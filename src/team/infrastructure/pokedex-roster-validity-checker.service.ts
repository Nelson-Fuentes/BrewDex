import { Injectable, inject } from '@angular/core';

import type { Game } from '../../game/domain/entities/game';
import type { RosterValidityChecker } from '../../game/domain/ports/roster-validity-checker';
import { PokedexView } from '../../pokedex/domain/value-objects/pokedex-view';
import { POKEMON_REPOSITORY } from '../../shared/tokens/pokemon-repository.token';

/**
 * Implementa {@link RosterValidityChecker} (declarado por `game`) usando
 * el `PokemonRepository` de `pokemon` — `game` nunca ve esta clase
 * directamente, solo el contrato (contracts/game-catalog.md).
 */
@Injectable({ providedIn: 'root' })
export class PokedexRosterValidityCheckerService implements RosterValidityChecker {
  private readonly pokemonRepository = inject(POKEMON_REPOSITORY);

  async validFor(game: Game, rosterPokemonIds: readonly string[]): Promise<string[]> {
    if (rosterPokemonIds.length === 0) {
      return [];
    }
    try {
      const resolved = await this.pokemonRepository.fetchPokedexDetails(
        game,
        new PokedexView(),
        rosterPokemonIds,
        'en',
      );
      const resolvedIds = new Set(resolved.map((entry) => entry.pokemonId));
      return rosterPokemonIds.filter((id) => resolvedIds.has(id));
    } catch {
      // Ninguno resolvió (p. ej. fuente caída) — ningún id se considera
      // válido en vez de propagar el error (FR-016 solo necesita saber
      // "cuáles siguen siendo válidos", no un failure).
      return [];
    }
  }
}
