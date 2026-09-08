import type { Game } from '../../../game/domain/entities/game';
import type { PokedexView } from '../value-objects/pokedex-view';
import type { PokedexIndexEntry } from '../value-objects/pokedex-index-entry';

/** Lanzado cuando el índice de Pokédex no se puede obtener. */
export class PokedexIndexUnavailable extends Error {
  constructor() {
    super('The Pokédex index could not be retrieved.');
    this.name = 'PokedexIndexUnavailable';
  }
}

/**
 * Puerto para resolver la proyección barata, solo-orden, del Pokédex de
 * un juego bajo una vista dada (FR-004, FR-017). Implementado por
 * `PokeApiPokedexIndexRepositoryService`; consumido por `application/` de
 * `pokedex`.
 */
export interface PokedexIndexRepository {
  /**
   * Ordenado ascendente por `pokedexNumber`. Lanza
   * {@link PokedexIndexUnavailable} si no se puede obtener — nunca un
   * índice parcial.
   */
  fetchPokedexIndex(game: Game, view: PokedexView): Promise<PokedexIndexEntry[]>;
}
