import type { Game } from '../../game/domain/entities/game';
import type { Move } from '../domain/value-objects/move';
import type { MovepoolRepository } from '../domain/ports/movepool-repository';

/** Caso de uso: obtener el moveset por defecto sugerido al agregar un
 *  Pokémon al equipo (FR-014). */
export function getDefaultMoveset(
  repository: MovepoolRepository,
  varietyId: string,
  game: Game,
  languageCode: string,
): Promise<Move[]> {
  return repository.fetchDefaultMoveset(varietyId, game, languageCode);
}
