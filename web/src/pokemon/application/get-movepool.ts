import type { Game } from '../../game/domain/entities/game';
import type { Move } from '../domain/value-objects/move';
import type { MovepoolRepository } from '../domain/ports/movepool-repository';

/** Caso de uso: obtener todos los movimientos que una variedad puede
 *  aprender en un juego (FR-014). */
export function getMovepool(
  repository: MovepoolRepository,
  varietyId: string,
  game: Game,
  languageCode: string,
): Promise<Move[]> {
  return repository.fetchMovepool(varietyId, game, languageCode);
}
