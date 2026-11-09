/**
 * Cómo un Pokémon puede aprender un movimiento en un juego concreto. Las
 * cinco categorías pedidas por el filtro del selector (FR-009):
 * - `'level'`: por nivel — ver `MoveLearnInfo.levelLearnedAt`.
 * - `'tm'`: Máquina Técnica.
 * - `'hm'`: Máquina Oculta — solo existe en juegos de Generación I-VI
 *   (data-model.md, research.md Decisión 1).
 * - `'tutor'`: tutor de movimientos.
 * - `'egg'`: por herencia (huevo).
 *
 * No modela otros `move_learn_method` de PokeAPI fuera de estas cinco
 * categorías (spec.md Assumptions).
 */
export type LearnMethod = 'level' | 'tm' | 'hm' | 'tutor' | 'egg';
