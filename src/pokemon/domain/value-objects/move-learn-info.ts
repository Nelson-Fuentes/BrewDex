import type { Move } from './move';
import type { LearnMethod } from './move-learn-method';

/**
 * Un movimiento del movepool de una forma concreta, emparejado con el o
 * los métodos por los que esa forma lo aprende en un juego concreto
 * (FR-009, FR-018, data-model.md). Un movimiento aparece una sola vez
 * aunque se aprenda por más de un método a la vez en el mismo juego (p.
 * ej. nivel y MT) — `methods` nunca está vacío.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class MoveLearnInfo {
  constructor(
    readonly move: Move,
    /** Nunca vacío — siempre al menos un método. */
    readonly methods: readonly LearnMethod[],
    /** Nivel asociado si `'level'` está entre `methods`; `null` si no. */
    readonly levelLearnedAt: number | null,
  ) {}
}
