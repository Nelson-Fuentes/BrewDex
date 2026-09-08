import type { Game } from '../entities/game';

/** Lanzado cuando el catálogo de juegos no se puede obtener. */
export class GameCatalogUnavailable extends Error {
  constructor() {
    super('The game catalog could not be retrieved.');
    this.name = 'GameCatalogUnavailable';
  }
}

/**
 * Puerto (Hexagonal/Ports & Adapters) para obtener el catálogo completo de
 * {@link Game}s seleccionables (FR-004). Implementado por
 * `PokeApiGameCatalogRepositoryService`; consumido solo por
 * `application/` de `game`.
 */
export interface GameCatalogRepository {
  /**
   * El catálogo completo y vigente, con `displayName` y
   * `generation.label` resueltos para `languageCode` (fallback inglés,
   * FR-018). Lanza {@link GameCatalogUnavailable} si no se puede obtener
   * — nunca una lista parcial en silencio.
   */
  fetchCatalog(languageCode: string): Promise<Game[]>;
}
