import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { Game } from '../../game/domain/entities/game';
import type { PokedexView } from '../domain/value-objects/pokedex-view';
import { PokedexIndexEntry } from '../domain/value-objects/pokedex-index-entry';
import type { PokedexEntrySource } from '../domain/value-objects/pokedex-entry-source';
import { PokedexIndexUnavailable, type PokedexIndexRepository } from '../domain/ports/pokedex-index-repository';
import { LoggingService } from '../../shared/logging/logging.service';
import { logAndRethrow } from '../../shared/logging/http-error-mapping';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

/**
 * Ids de generación elegibles para el toggle de Pokédex nacional (FR-017)
 * — 2ª a 7ª generación, per la regla de negocio provista por la persona
 * usuaria (spec Assumptions original; research.md).
 */
const NATIONAL_DEX_ELIGIBLE_GENERATION_IDS = new Set([
  'generation-ii',
  'generation-iii',
  'generation-iv',
  'generation-v',
  'generation-vi',
  'generation-vii',
]);

/** Excepción fuera de la regla de generación (research.md Decisión 4). */
const NATIONAL_DEX_ELIGIBLE_GAME_IDS = new Set(['brilliant-diamond-shining-pearl']);

/**
 * Juegos que, pese a pertenecer a una generación elegible por regla
 * general, NO tienen Pokédex nacional en el juego real — verificado
 * contra PokeAPI (spec `020`, ronda 6): Let's Go Pikachu/Let's Go Eevee
 * es de la generación VII (elegible por regla) pero solo expone la
 * Pokédex de Kanto (`letsgo-kanto`), sin ninguna nacional; a diferencia
 * de Sol/Luna y Ultrasol/Ultraluna, que sí la tienen.
 */
const NATIONAL_DEX_INELIGIBLE_GAME_IDS = new Set(['lets-go-pikachu-lets-go-eevee']);

/** Orden total de generaciones, más antigua primero — usado para acotar
 *  el Pokédex nacional a especies que ya existían para la generación del
 *  juego objetivo. */
const GENERATION_ORDER = [
  'generation-i',
  'generation-ii',
  'generation-iii',
  'generation-iv',
  'generation-v',
  'generation-vi',
  'generation-vii',
  'generation-viii',
  'generation-ix',
];

function isNationalDexEligible(game: Game): boolean {
  if (NATIONAL_DEX_INELIGIBLE_GAME_IDS.has(game.id)) {
    return false;
  }
  return NATIONAL_DEX_ELIGIBLE_GENERATION_IDS.has(game.generation.id) || NATIONAL_DEX_ELIGIBLE_GAME_IDS.has(game.id);
}

function generationOrdinal(generationId: string): number {
  return GENERATION_ORDER.indexOf(generationId);
}

interface NamedApiResource {
  readonly name: string;
  readonly url: string;
}

interface PokeApiVersionGroupResource {
  readonly pokedexes: readonly NamedApiResource[];
}

interface PokeApiPokedexResource {
  readonly pokemon_entries: readonly { readonly entry_number: number; readonly pokemon_species: NamedApiResource }[];
}

interface PokeApiSpeciesGenerationOnly {
  readonly generation: NamedApiResource;
}

/**
 * Implementa {@link PokedexIndexRepository} contra `version-group` y
 * `pokedex` de PokeAPI (contracts/pokedex.md). Único lugar de la
 * infraestructura que conoce la forma de esas respuestas (Constitución
 * Principio VI).
 */
@Injectable({ providedIn: 'root' })
export class PokeApiPokedexIndexRepositoryService implements PokedexIndexRepository {
  private readonly http = inject(HttpClient);
  private readonly logging = inject(LoggingService);

  async fetchPokedexIndex(game: Game, view: PokedexView): Promise<PokedexIndexEntry[]> {
    try {
      if (view.useNationalDex && isNationalDexEligible(game)) {
        return await this.fetchNationalIndex(game);
      }
      return await this.fetchRegionalIndex(game, view);
    } catch (error) {
      return logAndRethrow(this.logging, 'PokeApiPokedexIndexRepositoryService', error, () => new PokedexIndexUnavailable());
    }
  }

  private async fetchRegionalIndex(game: Game, view: PokedexView): Promise<PokedexIndexEntry[]> {
    const gameVersionGroup = await firstValueFrom(
      this.http.get<PokeApiVersionGroupResource>(`${POKEAPI_BASE_URL}version-group/${game.id}/`),
    );
    const gamePokedexNames = gameVersionGroup.pokedexes.map((p) => p.name);

    const dlcPokedexNamesByDlcId = new Map<string, string[]>();
    await Promise.all(
      game.dlcs.map(async (dlc) => {
        const dlcVersionGroup = await firstValueFrom(
          this.http.get<PokeApiVersionGroupResource>(`${POKEAPI_BASE_URL}version-group/${dlc.id}/`),
        );
        dlcPokedexNamesByDlcId.set(dlc.id, dlcVersionGroup.pokedexes.map((p) => p.name));
      }),
    );
    const allDlcPokedexNames = new Set([...dlcPokedexNamesByDlcId.values()].flat());
    const basePokedexNames = gamePokedexNames.filter((name) => !allDlcPokedexNames.has(name));

    const byId = new Map<string, PokedexIndexEntry>();
    await this.mergePokedexesInto(byId, basePokedexNames, { kind: 'regional' });
    for (const [dlcId, names] of dlcPokedexNamesByDlcId) {
      if (view.activeDlcIds.has(dlcId)) {
        await this.mergePokedexesInto(byId, names, { kind: 'dlc', dlcId });
      }
    }
    return [...byId.values()].sort((a, b) => a.pokedexNumber - b.pokedexNumber);
  }

  private async fetchNationalIndex(game: Game): Promise<PokedexIndexEntry[]> {
    const byId = new Map<string, PokedexIndexEntry>();
    await this.mergePokedexesInto(byId, ['national'], { kind: 'national' });

    // FR-010 (heredado): una especie de una generación posterior a la del
    // juego objetivo no puede existir aún en su Pokédex nacional, aunque
    // el recurso `national` de PokeAPI ya la incluya.
    const gameGenerationOrdinal = generationOrdinal(game.generation.id);
    const entries = [...byId.values()];
    const generations = await Promise.all(
      entries.map((entry) =>
        firstValueFrom(
          this.http.get<PokeApiSpeciesGenerationOnly>(`${POKEAPI_BASE_URL}pokemon-species/${entry.pokemonId}/`),
        ),
      ),
    );
    const eligible = entries.filter((_, i) => generationOrdinal(generations[i].generation.name) <= gameGenerationOrdinal);
    return eligible.sort((a, b) => a.pokedexNumber - b.pokedexNumber);
  }

  /** Clave de dedup — por FUENTE (regional/nacional, o un DLC concreto),
   *  nunca solo por especie (spec `019`): la misma especie puede existir
   *  a la vez en la Pokédex regional Y en la de un DLC (p. ej. Slowpoke
   *  en Galar y en la Isla de la Armadura) — cada una es una Pokédex
   *  completa e independiente (FR-010), así que la especie debe poder
   *  aparecer una vez por cada una, no colapsarse en la primera que la
   *  trae. Deduplicar solo evita repetidos DENTRO de la misma fuente
   *  (dos pokedexes de PokeAPI listando la misma especie para el mismo
   *  juego). */
  private mergeKey(sourceTag: PokedexEntrySource, speciesName: string): string {
    const sourceKey = sourceTag.kind === 'dlc' ? `dlc:${sourceTag.dlcId}` : sourceTag.kind;
    return `${sourceKey}:${speciesName}`;
  }

  private async mergePokedexesInto(
    byId: Map<string, PokedexIndexEntry>,
    pokedexNames: readonly string[],
    sourceTag: PokedexEntrySource,
  ): Promise<void> {
    const pokedexes = await Promise.all(
      pokedexNames.map((name) => firstValueFrom(this.http.get<PokeApiPokedexResource>(`${POKEAPI_BASE_URL}pokedex/${name}/`))),
    );
    for (const pokedex of pokedexes) {
      for (const entry of pokedex.pokemon_entries) {
        const key = this.mergeKey(sourceTag, entry.pokemon_species.name);
        if (!byId.has(key)) {
          byId.set(key, new PokedexIndexEntry(entry.pokemon_species.name, entry.entry_number, sourceTag));
        }
      }
    }
  }
}
