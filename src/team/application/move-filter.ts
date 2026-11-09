import type { DamageClass } from '../../pokemon/domain/value-objects/move';
import type { LearnMethod } from '../../pokemon/domain/value-objects/move-learn-method';
import type { MoveLearnInfo } from '../../pokemon/domain/value-objects/move-learn-info';

/** Combinación activa de filtros del selector (FR-007, FR-008, FR-009).
 *  Un campo ausente no restringe — todos se combinan por AND (FR-010). */
export interface MoveFilter {
  readonly damageClass?: DamageClass;
  readonly type?: string;
  readonly learnMethod?: LearnMethod;
  /** Búsqueda de texto libre por nombre o descripción del movimiento,
   *  case-insensitive — pedido explícito de UX, no de una historia de
   *  usuario del spec original. Vacío/solo espacios equivale a ausente. */
  readonly searchText?: string;
}

/**
 * Filtra un movepool ya cargado por clase/tipo/método de aprendizaje y
 * texto libre, combinados por conjunción (FR-010, FR-011 —
 * contracts/move-selector-filters.md). Función pura de aplicación: no
 * muta `movepool`, sin dependencias de Angular/HTTP (Constitución
 * Principio VI).
 */
export function filterMovepool(movepool: readonly MoveLearnInfo[], filter: MoveFilter): readonly MoveLearnInfo[] {
  const searchText = filter.searchText?.trim().toLowerCase();
  return movepool.filter((entry) => {
    if (filter.damageClass !== undefined && entry.move.damageClass !== filter.damageClass) {
      return false;
    }
    if (filter.type !== undefined && entry.move.type.id !== filter.type) {
      return false;
    }
    if (filter.learnMethod !== undefined && !entry.methods.includes(filter.learnMethod)) {
      return false;
    }
    if (searchText) {
      const haystack = `${entry.move.displayName} ${entry.move.description}`.toLowerCase();
      if (!haystack.includes(searchText)) {
        return false;
      }
    }
    return true;
  });
}
