import type { Game } from '../entities/game';

/**
 * Puerto para saber cuál de un roster en curso sigue siendo válido para un
 * juego dado (FR-016). Declarado por `game`, pero implementado en `team`
 * usando el `PokemonRepository` de `pokemon` — `game` nunca conoce el
 * modelo interno de esos otros módulos, solo este contrato.
 */
export interface RosterValidityChecker {
  /** El subconjunto de `rosterPokemonIds` que sigue siendo válido para `game`. */
  validFor(game: Game, rosterPokemonIds: readonly string[]): Promise<string[]>;
}
