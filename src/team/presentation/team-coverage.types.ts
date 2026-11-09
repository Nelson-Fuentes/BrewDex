import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

/**
 * `027` (data-model.md): los 3 coeficientes de un Pokémon del equipo
 * frente a un tipo — mismos campos que ya expone `DefensiveCoverageRow`
 * por fila de la tabla individual (`defenseCoefficient`,
 * `averageAttackCoefficient`, `coverageCoefficient`), solo renombrados
 * para el modal de equipo. Ningún valor ni fórmula nueva.
 */
export interface TeamCoverageCell {
  readonly defense: number;
  readonly attack: number | null;
  readonly coverage: number;
}

/**
 * `027` (data-model.md): una fila de la tabla del modal de equipo — un
 * Pokémon ocupado del equipo, con sus 3 coeficientes frente a cada tipo
 * de la generación activa (`coverageByType`, clave = `PokemonType.id`).
 */
export interface TeamCoverageRow {
  readonly slotIndex: number;
  readonly spriteUrl: string | null;
  readonly displayName: string;
  readonly types: readonly [PokemonType] | readonly [PokemonType, PokemonType];
  readonly coverageByType: ReadonlyMap<string, TeamCoverageCell>;
}

/**
 * `027` (data-model.md): la fila final del equipo — la media aritmética
 * simple, por tipo, de `defense`/`attack`/`coverage` entre los Pokémon
 * ocupados del equipo (FR-007/FR-008). Nunca `null` por tipo (siempre hay
 * al menos un Pokémon ocupado cuando el modal está abierto, FR-003).
 */
export interface TeamCoverageTotals {
  readonly totalsByType: ReadonlyMap<string, { readonly defense: number; readonly attack: number; readonly coverage: number }>;
}
