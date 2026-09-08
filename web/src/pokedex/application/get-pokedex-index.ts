import type { Game } from '../../game/domain/entities/game';
import type { PokedexView } from '../domain/value-objects/pokedex-view';
import type { PokedexIndexEntry } from '../domain/value-objects/pokedex-index-entry';
import type { PokedexIndexRepository } from '../domain/ports/pokedex-index-repository';

/** Caso de uso: obtener el índice de Pokédex de un juego/vista (FR-004, FR-017). */
export function getPokedexIndex(
  repository: PokedexIndexRepository,
  game: Game,
  view: PokedexView,
): Promise<PokedexIndexEntry[]> {
  return repository.fetchPokedexIndex(game, view);
}
