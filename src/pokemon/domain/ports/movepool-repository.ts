import type { Game } from '../../../game/domain/entities/game';
import type { Move } from '../value-objects/move';
import type { MoveLearnInfo } from '../value-objects/move-learn-info';

/**
 * Puerto para resolver qué movimientos puede aprender una variedad en un
 * juego concreto (FR-014). Implementado por
 * `PokeApiMovepoolRepositoryService`; consumido por `application/` de
 * `pokemon`.
 */
export interface MovepoolRepository {
  /**
   * Movimientos que `varietyId` puede aprender en `game`, filtrado al
   * version-group exacto (nunca un juego hermano de la misma
   * generación), cada uno emparejado con su(s) método(s) de aprendizaje
   * en ese juego (FR-009, FR-018 — `021-move-slots-filters`). `[]` es
   * una respuesta válida (no aprende nada); lanza `PokedexUnavailable`
   * si la fuente falla.
   */
  fetchMovepool(varietyId: string, game: Game, languageCode: string): Promise<MoveLearnInfo[]>;

  /**
   * Hasta 4 movimientos por nivel más alto que `varietyId` aprende en
   * `game`, orden ascendente por nivel — nunca incluye un movimiento
   * aprendido solo por otro método (MT, huevo, tutor). `[]` = no aprende
   * nada por nivel en ese juego. Alimenta el moveset por defecto
   * (FR-014).
   */
  fetchDefaultMoveset(varietyId: string, game: Game, languageCode: string): Promise<Move[]>;
}
