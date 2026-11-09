import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { Game } from '../../game/domain/entities/game';
import { Move, type DamageClass } from '../domain/value-objects/move';
import { MoveLearnInfo } from '../domain/value-objects/move-learn-info';
import type { LearnMethod } from '../domain/value-objects/move-learn-method';
import { PokemonType } from '../domain/value-objects/pokemon-type';
import type { MovepoolRepository } from '../domain/ports/movepool-repository';
import { PokedexUnavailable } from '../domain/ports/pokemon-repository';
import { resolveLocalizedName, type PokeApiLocalizedEntry } from '../../shared/pokeapi/resolve-localized-name';
import { LoggingService } from '../../shared/logging/logging.service';
import { logAndRethrow } from '../../shared/logging/http-error-mapping';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

const GEN_I_III_GENERATION_IDS = new Set(['generation-i', 'generation-ii', 'generation-iii']);

/**
 * Juegos cuyo movepool en PokeAPI puede estar completamente vacío para
 * cualquier Pokémon (fuente externa sin datos todavía, no un error de
 * matching — verificado en vivo: `pokemon/{id}` no tiene ninguna entrada
 * de `version_group_details` para `legends-za`, a diferencia de
 * `legends-arceus`, que sí tiene datos reales pese a declarar
 * `move_learn_methods: []` en su propio recurso). Pedido explícito del
 * usuario: cuando el juego principal no tiene datos, usar el movepool de
 * estos otros juegos como aproximación, probados en este orden hasta
 * encontrar el primero con datos — nunca se mezclan, se usa el primero
 * que resuelva un movepool no vacío completo.
 */
const MOVEPOOL_FALLBACK_VERSION_GROUP_IDS: Readonly<Record<string, readonly string[]>> = {
  'legends-za': [
    'scarlet-violet',
    'legends-arceus',
    'brilliant-diamond-shining-pearl',
    'sword-shield',
    'lets-go-pikachu-lets-go-eevee',
    'ultra-sun-ultra-moon',
  ],
};

/**
 * Tabla tipo→clase histórica de Gen. I-III (data-model.md — atribución a
 * WikiDex, CC BY-SA): en esas generaciones la clase no era un dato propio
 * del movimiento, se derivaba del tipo.
 */
const PHYSICAL_TYPES_GEN_I_III = new Set([
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
]);

interface NamedApiResource {
  readonly name: string;
  readonly url: string;
}

interface PokeApiMoveListEntry {
  readonly move: NamedApiResource;
  readonly version_group_details: readonly {
    readonly level_learned_at: number;
    readonly version_group: NamedApiResource;
    readonly move_learn_method: NamedApiResource;
  }[];
}

interface PokeApiPokemonMovesResource {
  readonly moves: readonly PokeApiMoveListEntry[];
}

interface PokeApiNamedLocalizedEntry extends PokeApiLocalizedEntry {
  readonly name: string;
}

interface PokeApiMachineListEntry {
  readonly machine: NamedApiResource;
  readonly version_group: NamedApiResource;
}

interface PokeApiMoveResource {
  readonly name: string;
  readonly power: number | null;
  readonly accuracy: number | null;
  readonly pp: number;
  readonly type: NamedApiResource;
  readonly damage_class: NamedApiResource;
  readonly names: readonly PokeApiNamedLocalizedEntry[];
  readonly flavor_text_entries: readonly (PokeApiLocalizedEntry & { readonly flavor_text: string; readonly version_group: NamedApiResource })[];
  /** Ausente en algunos movimientos (nunca disponibles por MT/MO) —
   *  tratado como `[]` (021-move-slots-filters, research.md Decisión 1). */
  readonly machines?: readonly PokeApiMachineListEntry[];
}

interface PokeApiMachineResource {
  /** `"tm##"`/`"tr##"` → MT; `"hm##"` → MO (021-move-slots-filters). */
  readonly item: NamedApiResource;
}

/**
 * Implementa {@link MovepoolRepository} contra `pokemon` y `move` de
 * PokeAPI (contracts/movepool.md, contracts/movepool-with-learn-info.md).
 * Único lugar de la infraestructura que conoce la forma de esas
 * respuestas (Constitución Principio VI).
 */
@Injectable({ providedIn: 'root' })
export class PokeApiMovepoolRepositoryService implements MovepoolRepository {
  private readonly http = inject(HttpClient);
  private readonly logging = inject(LoggingService);

  async fetchMovepool(varietyId: string, game: Game, languageCode: string): Promise<MoveLearnInfo[]> {
    try {
      for (const versionGroupId of [game.id, ...(MOVEPOOL_FALLBACK_VERSION_GROUP_IDS[game.id] ?? [])]) {
        const entries = await this.movesLearnedIn(varietyId, versionGroupId);
        if (entries.length === 0) {
          continue;
        }
        return await Promise.all(entries.map((entry) => this.resolveMoveLearnInfo(entry, game, versionGroupId, languageCode)));
      }
      return [];
    } catch (error) {
      return logAndRethrow(this.logging, 'PokeApiMovepoolRepositoryService', error, () => new PokedexUnavailable());
    }
  }

  async fetchDefaultMoveset(varietyId: string, game: Game, languageCode: string): Promise<Move[]> {
    try {
      for (const versionGroupId of [game.id, ...(MOVEPOOL_FALLBACK_VERSION_GROUP_IDS[game.id] ?? [])]) {
        const moveset = await this.fetchDefaultMovesetForVersionGroup(varietyId, game, versionGroupId, languageCode);
        if (moveset.length > 0) {
          return moveset;
        }
      }
      return [];
    } catch (error) {
      return logAndRethrow(this.logging, 'PokeApiMovepoolRepositoryService', error, () => new PokedexUnavailable());
    }
  }

  private async fetchDefaultMovesetForVersionGroup(
    varietyId: string,
    game: Game,
    versionGroupId: string,
    languageCode: string,
  ): Promise<Move[]> {
    const entries = await this.movesLearnedIn(varietyId, versionGroupId);
    const levelUpEntries = entries
      .map((entry) => ({
        move: entry.move,
        detail: entry.version_group_details.find(
          (d) => d.version_group.name === versionGroupId && d.move_learn_method.name === 'level-up',
        ),
      }))
      .filter((e): e is { move: NamedApiResource; detail: NonNullable<typeof e.detail> } => e.detail !== undefined)
      .sort((a, b) => b.detail.level_learned_at - a.detail.level_learned_at)
      .slice(0, 4)
      .reverse();

    return Promise.all(levelUpEntries.map(async (entry) => this.buildMove(await this.fetchMoveResource(entry.move.name), game, languageCode)));
  }

  /** Los `version_group_details` de `varietyId` filtrados al version-group
   *  exacto pedido — nunca un juego hermano de la misma generación (salvo
   *  que ese "hermano" sea explícitamente un fallback de
   *  {@link MOVEPOOL_FALLBACK_VERSION_GROUP_IDS}, resuelto por el llamador,
   *  no acá). */
  private async movesLearnedIn(varietyId: string, versionGroupId: string): Promise<PokeApiMoveListEntry[]> {
    const pokemon = await firstValueFrom(
      this.http.get<PokeApiPokemonMovesResource>(`${POKEAPI_BASE_URL}pokemon/${varietyId}/`),
    );
    return pokemon.moves.filter((entry) =>
      entry.version_group_details.some((d) => d.version_group.name === versionGroupId),
    );
  }

  private async fetchMoveResource(moveName: string): Promise<PokeApiMoveResource> {
    return firstValueFrom(this.http.get<PokeApiMoveResource>(`${POKEAPI_BASE_URL}move/${moveName}/`));
  }

  /** `game` solo se usa para `buildMove` (localización/regla histórica de
   *  clase por generación, siempre la del juego PRINCIPAL pedido, nunca
   *  la del juego de fallback) — el filtrado de qué movimientos/métodos
   *  aplican usa `versionGroupId`, que puede ser un fallback. */
  private async resolveMoveLearnInfo(
    entry: PokeApiMoveListEntry,
    game: Game,
    versionGroupId: string,
    languageCode: string,
  ): Promise<MoveLearnInfo> {
    const resource = await this.fetchMoveResource(entry.move.name);
    const move = this.buildMove(resource, game, languageCode);
    const matchingDetails = entry.version_group_details.filter((d) => d.version_group.name === versionGroupId);
    const methodNames = new Set(matchingDetails.map((d) => d.move_learn_method.name));

    const methods: LearnMethod[] = [];
    let levelLearnedAt: number | null = null;
    if (methodNames.has('level-up')) {
      methods.push('level');
      levelLearnedAt = matchingDetails.find((d) => d.move_learn_method.name === 'level-up')?.level_learned_at ?? null;
    }
    if (methodNames.has('egg')) {
      methods.push('egg');
    }
    if (methodNames.has('tutor')) {
      methods.push('tutor');
    }
    if (methodNames.has('machine')) {
      const machineMethod = await this.resolveMachineMethod(resource, versionGroupId);
      if (machineMethod) {
        methods.push(machineMethod);
      }
    }
    return new MoveLearnInfo(move, methods, levelLearnedAt);
  }

  /** Distingue MT de MO (research.md Decisión 1): PokeAPI solo expone
   *  `move_learn_method.name === 'machine'` para ambas — la distinción
   *  real está en el prefijo del `item` de la máquina concreta
   *  (`tm##`/`tr##` → MT, `hm##` → MO), resuelto vía `move.machines[]`
   *  filtrado al version-group pedido (el principal o un fallback). */
  private async resolveMachineMethod(move: PokeApiMoveResource, versionGroupId: string): Promise<LearnMethod | null> {
    const entries = (move.machines ?? []).filter((m) => m.version_group.name === versionGroupId);
    if (entries.length === 0) {
      return null;
    }
    const machines = await Promise.all(
      entries.map((entry) => firstValueFrom(this.http.get<PokeApiMachineResource>(entry.machine.url))),
    );
    return machines.some((m) => m.item.name.startsWith('hm')) ? 'hm' : 'tm';
  }

  private buildMove(move: PokeApiMoveResource, game: Game, languageCode: string): Move {
    const type = new PokemonType(move.type.name, move.type.name);
    const displayName = resolveLocalizedName(move.names, languageCode, (n) => n.name) ?? move.name;
    const flavorEntry =
      move.flavor_text_entries.find((f) => f.language.name === languageCode) ??
      move.flavor_text_entries.find((f) => f.language.name === 'en');
    const description = flavorEntry?.flavor_text.replace(/[\n\f]/g, ' ') ?? '';
    const damageClass = this.resolveDamageClass(move, game);
    return new Move(move.name, displayName, type, damageClass, move.pp, move.power, description, move.accuracy);
  }

  /** `damageClass` por generación (research.md Decisión 13). */
  private resolveDamageClass(move: PokeApiMoveResource, game: Game): DamageClass {
    if (!GEN_I_III_GENERATION_IDS.has(game.generation.id)) {
      return move.damage_class.name as DamageClass;
    }
    if (move.damage_class.name === 'status') {
      return 'status';
    }
    return PHYSICAL_TYPES_GEN_I_III.has(move.type.name) ? 'physical' : 'special';
  }
}
