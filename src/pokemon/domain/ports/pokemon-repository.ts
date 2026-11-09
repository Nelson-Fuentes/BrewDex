import type { Game } from '../../../game/domain/entities/game';
import type { PokedexView } from '../../../pokedex/domain/value-objects/pokedex-view';
import type { PokedexEntry } from '../entities/pokedex-entry';

/** Lanzado cuando el detalle de Pokédex no se puede obtener. */
export class PokedexUnavailable extends Error {
  constructor() {
    super('The Pokédex data could not be retrieved.');
    this.name = 'PokedexUnavailable';
  }
}

/**
 * Puerto para resolver el detalle completo (sprites, tipos, formas,
 * variantes cosméticas...) de cada especie/forma para un juego y vista de
 * Pokédex dados (FR-008, FR-013). Implementado por
 * `PokeApiPokemonRepositoryService`; consumido por `application/` de
 * `pokemon` y por `team` (vía `RosterValidityChecker`).
 */
export interface PokemonRepository {
  /**
   * Detalle completo para `pokemonIds`. `view` DEBE ser el mismo valor
   * usado para producir `pokemonIds` — el número de dex y el `sourceTag`
   * dependen de la vista, no solo de la identidad. Puede devolver menos
   * entradas de las pedidas si algún id no resuelve, pero lanza
   * {@link PokedexUnavailable} si NINGÚN id resuelve. `pokemonIds` vacío
   * devuelve `[]` sin ninguna llamada HTTP.
   */
  fetchPokedexDetails(
    game: Game,
    view: PokedexView,
    pokemonIds: readonly string[],
    languageCode: string,
  ): Promise<PokedexEntry[]>;
}
