import type { Generation } from '../../../game/domain/value-objects/generation';
import type { Move } from './move';
import type { PokemonStats } from './pokemon-stats';
import type { PokemonType } from './pokemon-type';
import { attackTypesForGeneration, typeEffectivenessMultiplier, resolveTypeEffectivenessEra, type TypeEffectivenessEra } from './type-effectiveness';

/** Divisor de reemplazo usado en el coeficiente de defensa cuando la
 *  eficacia defensiva de una fila es `0`, para evitar una división por cero
 *  (spec `023`, FR-006). No aplica al coeficiente de ataque (spec `024`,
 *  FR-010): ahí una eficacia `0` produce legítimamente un coeficiente `0`. */
const ZERO_EFFICACY_DIVISOR = 0.125;

/**
 * Una fila de la tabla de Análisis de Cobertura: el tipo de ataque de esa
 * fila, la eficacia defensiva combinada contra los tipos del Pokémon
 * mostrado, el coeficiente de defensa derivado de esa eficacia y de sus
 * estadísticas base, el coeficiente de ataque por cada uno de los 4
 * movimientos equipados, y su promedio — todos los valores numéricos con
 * precisión decimal completa, sin redondear (Clarifications; el redondeo a
 * entero es responsabilidad de la presentación, FR-006a/FR-008).
 *
 * Interfaz deliberadamente simple y extensible (spec `023`, FR-011): la
 * columna de coeficiente de ataque/cobertura anticipada por esa spec es
 * `attackCoefficients`/`averageAttackCoefficient` (spec `024`), agregada
 * como campos más, sin tocar `type-effectiveness.ts` ni el mecanismo de
 * mapa de calor (que opera sobre `readonly number[]` genéricos, no sobre
 * esta interfaz).
 */
export interface DefensiveCoverageRow {
  readonly type: PokemonType;
  readonly efficacy: number;
  readonly defenseCoefficient: number;
  /** Un valor por cada slot de `moveSlots`, en el mismo orden. `null`
   *  cuando ese slot no tiene movimiento asignado o el movimiento es de
   *  clase `'status'` (spec `024`, FR-004) — nunca `0` como sentinela, un
   *  `0` es un resultado legítimo (eficacia de tipo `0`, FR-010). */
  readonly attackCoefficients: readonly (number | null)[];
  /** Media aritmética de los `attackCoefficients` no nulos de esta fila
   *  (FR-005); `null` cuando ninguno es calculable (FR-006). */
  readonly averageAttackCoefficient: number | null;
  /** Media armónica entre `defenseCoefficient` y `averageAttackCoefficient`
   *  cuando este último es numérico (spec `025`, FR-002); `defenseCoefficient / 2`
   *  cuando `averageAttackCoefficient` es `null` (FR-003, Clarifications) — a
   *  diferencia de `averageAttackCoefficient`, este campo nunca es `null`: el
   *  coeficiente de defensa siempre existe, así que la columna de cobertura
   *  siempre tiene un valor mostrable. Precisión decimal completa, sin
   *  redondear (FR-005). */
  readonly coverageCoefficient: number;
}

/** Coeficiente de ataque de `move` contra `defendingType` (spec `024`,
 *  FR-003): `(ataque + 0.2 × velocidad) × (potencia / 100) × stab × eficacia`.
 *  La potencia del movimiento (`move.power`, el número entero crudo del
 *  juego, p. ej. `90`) se usa como fracción de sí misma sobre 100 — no como
 *  el entero crudo — corrección de datos post-implementación pedida por el
 *  usuario (ver `vault/06_Logs/log.md`, entrada 2026-09-09 "corrección").
 *
 * Precondición: `move.damageClass !== 'status'` (por lo tanto
 * `move.power !== null`) — el llamador ({@link computeDefensiveCoverageRows})
 * es responsable de no invocarla para movimientos de estado o slots
 * vacíos, devolviendo `null` directamente en esos casos. */
function attackCoefficientFor(
  move: Move,
  stats: PokemonStats,
  pokemonTypes: readonly [PokemonType] | readonly [PokemonType, PokemonType],
  defendingType: PokemonType,
  era: TypeEffectivenessEra,
): number {
  const attackStat = move.damageClass === 'physical' ? stats.attack : stats.specialAttack;
  const stab = pokemonTypes.some((t) => t.id === move.type.id) ? 1.5 : 1;
  const efficacy = typeEffectivenessMultiplier(move.type, defendingType, era);
  return (attackStat + 0.2 * stats.speed) * (move.power! / 100) * stab * efficacy;
}

/**
 * Construye la tabla completa de filas de cobertura defensiva — una por
 * cada tipo de ataque válido de la generación — para un Pokémon con uno o
 * dos tipos, unas estadísticas base y hasta 4 movimientos equipados dados
 * (FR-001, FR-003–FR-006, FR-010; spec `023` FR-003–FR-006/FR-010).
 *
 * Devuelve `null` cuando `generation` no tiene una era de tipos reconocida
 * (FR-012) — el llamador (presentación) es responsable de mostrar un
 * mensaje explícito en ese caso, no esta función.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export function computeDefensiveCoverageRows(
  pokemonTypes: readonly [PokemonType] | readonly [PokemonType, PokemonType],
  stats: PokemonStats,
  generation: Generation,
  moveSlots: readonly (Move | null)[],
): readonly DefensiveCoverageRow[] | null {
  const era = resolveTypeEffectivenessEra(generation);
  const attackTypes = attackTypesForGeneration(generation);
  if (era === null || attackTypes === null) {
    return null;
  }

  const baseDefense = (stats.specialDefense + stats.defense) / 2 + 0.3 * stats.hp;

  return attackTypes.map((attackType) => {
    const efficacy =
      pokemonTypes.length === 2
        ? typeEffectivenessMultiplier(attackType, pokemonTypes[0], era) * typeEffectivenessMultiplier(attackType, pokemonTypes[1], era)
        : typeEffectivenessMultiplier(attackType, pokemonTypes[0], era);

    const defenseCoefficient = baseDefense / (efficacy === 0 ? ZERO_EFFICACY_DIVISOR : efficacy);

    const attackCoefficients = moveSlots.map((move) =>
      move === null || move.damageClass === 'status' ? null : attackCoefficientFor(move, stats, pokemonTypes, attackType, era),
    );
    const calculable = attackCoefficients.filter((c): c is number => c !== null);
    const averageAttackCoefficient = calculable.length === 0 ? null : calculable.reduce((sum, c) => sum + c, 0) / calculable.length;

    // spec `025`, FR-002/FR-003: media armónica cuando hay promedio de ataque
    // numérico; defenseCoefficient / 2 cuando no lo hay — nunca `null` (a
    // diferencia de averageAttackCoefficient), ver Clarifications.
    const coverageCoefficient =
      averageAttackCoefficient === null
        ? defenseCoefficient / 2
        : (2 * defenseCoefficient * averageAttackCoefficient) / (defenseCoefficient + averageAttackCoefficient);

    return { type: attackType, efficacy, defenseCoefficient, attackCoefficients, averageAttackCoefficient, coverageCoefficient };
  });
}

/**
 * Media aritmética de `coverageCoefficient` sobre todas las filas dadas —
 * el "Índice sintético de cobertura global" de un Pokémon (spec `026`,
 * research.md Decisión 1/2; extrae la expresión que
 * `CoverageAnalysisTableComponent.totalCoverageCoefficient` ya calculaba
 * inline desde `025`, ahora reutilizable también desde `TeamBuilderPage`
 * para mostrar el mismo valor en el slot del equipo).
 *
 * Siempre numérico y finito mientras `rows` no esté vacío: `coverageCoefficient`
 * nunca es `null` en ninguna fila (invariante ya garantizada por `025`).
 */
export function averageCoverageCoefficient(rows: readonly DefensiveCoverageRow[]): number {
  return rows.reduce((sum, row) => sum + row.coverageCoefficient, 0) / rows.length;
}
