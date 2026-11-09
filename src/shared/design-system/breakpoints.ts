/**
 * Los tres layouts entre los que BrewDex se adapta, del más angosto al más
 * ancho (contracts/responsive-layout.md; FR-019, spec.md). Sin ningún
 * import de Angular por diseño — es una función pura, unit-testable sin
 * levantar ningún componente, igual que `breakpoints.dart` en la versión
 * Flutter (specs/017-migracion-angular/research.md Decisión 7).
 */
export type ScreenSize = 'compact' | 'medium' | 'expanded';

/**
 * Umbrales de ancho de viewport que resuelven a cada {@link ScreenSize} —
 * única fuente de verdad: ningún componente de `presentation/` de ningún
 * módulo debe hardcodear su propio chequeo de ancho.
 */
export abstract class Breakpoints {
  /** Por debajo de este ancho aplica `'compact'`. */
  static readonly compact = 600;

  /**
   * Por debajo de este ancho (y desde {@link compact}) aplica `'medium'`;
   * desde este ancho en adelante aplica `'expanded'`.
   */
  static readonly expanded = 840;

  /**
   * Mapeo puro y total de un ancho de viewport no negativo a la variante
   * {@link ScreenSize} que le corresponde.
   */
  static resolve(width: number): ScreenSize {
    if (width < Breakpoints.compact) {
      return 'compact';
    }
    if (width < Breakpoints.expanded) {
      return 'medium';
    }
    return 'expanded';
  }
}
