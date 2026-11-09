import type { Game } from '../../game/domain/entities/game';
import type { MoveLearnInfo } from '../domain/value-objects/move-learn-info';
import type { MovepoolRepository } from '../domain/ports/movepool-repository';

/** Caso de uso: obtener todos los movimientos que una variedad puede
 *  aprender en un juego, con su(s) método(s) de aprendizaje (FR-014,
 *  FR-009). */
export function getMovepool(
  repository: MovepoolRepository,
  varietyId: string,
  game: Game,
  languageCode: string,
): Promise<MoveLearnInfo[]> {
  return repository.fetchMovepool(varietyId, game, languageCode);
}
