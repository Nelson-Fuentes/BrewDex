import type { Game } from '../domain/entities/game';
import type { GameCatalogRepository } from '../domain/ports/game-catalog-repository';

/** Caso de uso: obtener el catálogo de juegos seleccionables (FR-004). */
export function getGameCatalog(
  repository: GameCatalogRepository,
  languageCode: string,
): Promise<Game[]> {
  return repository.fetchCatalog(languageCode);
}
