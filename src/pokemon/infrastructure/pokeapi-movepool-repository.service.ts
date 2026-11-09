import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { Game } from '../../game/domain/entities/game';
import { Move, type DamageClass } from '../domain/value-objects/move';
import { PokemonType } from '../domain/value-objects/pokemon-type';
import type { MovepoolRepository } from '../domain/ports/movepool-repository';
import { PokedexUnavailable } from '../domain/ports/pokemon-repository';
import { resolveLocalizedName, type PokeApiLocalizedEntry } from '../../shared/pokeapi/resolve-localized-name';
import { LoggingService } from '../../shared/logging/logging.service';
import { logAndRethrow } from '../../shared/logging/http-error-mapping';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

const GEN_I_III_GENERATION_IDS = new Set(['generation-i', 'generation-ii', 'generation-iii']);

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

interface PokeApiMoveResource {
  readonly name: string;
  readonly power: number | null;
  readonly pp: number;
  readonly type: NamedApiResource;
  readonly damage_class: NamedApiResource;
  readonly names: readonly PokeApiNamedLocalizedEntry[];
  readonly flavor_text_entries: readonly (PokeApiLocalizedEntry & { readonly flavor_text: string; readonly version_group: NamedApiResource })[];
}

/**
 * Implementa {@link MovepoolRepository} contra `pokemon` y `move` de
 * PokeAPI (contracts/movepool.md). Único lugar de la infraestructura que
 * conoce la forma de esas respuestas (Constitución Principio VI).
 */
@Injectable({ providedIn: 'root' })
export class PokeApiMovepoolRepositoryService implements MovepoolRepository {
  private readonly http = inject(HttpClient);
  private readonly logging = inject(LoggingService);

  async fetchMovepool(varietyId: string, game: Game, languageCode: string): Promise<Move[]> {
    try {
      const entries = await this.movesLearnedIn(varietyId, game);
      const moves = await Promise.all(
        entries.map((entry) => this.resolveMove(entry.move.name, game, languageCode)),
      );
      return moves;
    } catch (error) {
      return logAndRethrow(this.logging, 'PokeApiMovepoolRepositoryService', error, () => new PokedexUnavailable());
    }
  }

  async fetchDefaultMoveset(varietyId: string, game: Game, languageCode: string): Promise<Move[]> {
    try {
      const entries = await this.movesLearnedIn(varietyId, game);
      const levelUpEntries = entries
        .map((entry) => ({
          move: entry.move,
          detail: entry.version_group_details.find(
            (d) => d.version_group.name === game.id && d.move_learn_method.name === 'level-up',
          ),
        }))
        .filter((e): e is { move: NamedApiResource; detail: NonNullable<typeof e.detail> } => e.detail !== undefined)
        .sort((a, b) => b.detail.level_learned_at - a.detail.level_learned_at)
        .slice(0, 4)
        .reverse();

      const moves = await Promise.all(
        levelUpEntries.map((entry) => this.resolveMove(entry.move.name, game, languageCode)),
      );
      return moves;
    } catch (error) {
      return logAndRethrow(this.logging, 'PokeApiMovepoolRepositoryService', error, () => new PokedexUnavailable());
    }
  }

  /** Los `version_group_details` de `varietyId` filtrados al version-group
   *  exacto de `game` — nunca un juego hermano de la misma generación. */
  private async movesLearnedIn(varietyId: string, game: Game): Promise<PokeApiMoveListEntry[]> {
    const pokemon = await firstValueFrom(
      this.http.get<PokeApiPokemonMovesResource>(`${POKEAPI_BASE_URL}pokemon/${varietyId}/`),
    );
    return pokemon.moves.filter((entry) =>
      entry.version_group_details.some((d) => d.version_group.name === game.id),
    );
  }

  private async resolveMove(moveName: string, game: Game, languageCode: string): Promise<Move> {
    const move = await firstValueFrom(this.http.get<PokeApiMoveResource>(`${POKEAPI_BASE_URL}move/${moveName}/`));
    const type = new PokemonType(move.type.name, move.type.name);
    const displayName = resolveLocalizedName(move.names, languageCode, (n) => n.name) ?? move.name;
    const flavorEntry =
      move.flavor_text_entries.find((f) => f.language.name === languageCode) ??
      move.flavor_text_entries.find((f) => f.language.name === 'en');
    const description = flavorEntry?.flavor_text.replace(/[\n\f]/g, ' ') ?? '';
    const damageClass = this.resolveDamageClass(move, game);
    return new Move(move.name, displayName, type, damageClass, move.pp, move.power, description);
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
