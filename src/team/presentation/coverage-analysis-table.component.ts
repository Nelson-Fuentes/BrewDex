import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import type { Generation } from '../../game/domain/value-objects/generation';
import { averageCoverageCoefficient, computeDefensiveCoverageRows, type DefensiveCoverageRow } from '../../pokemon/domain/value-objects/defensive-coverage';
import type { Move } from '../../pokemon/domain/value-objects/move';
import type { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { heatmapColorFor, heatmapTextColorFor } from '../../shared/design-system/heatmap-gradient';
import { TypeBadgeComponent } from '../../shared/design-system/type-badge.component';

/** Cantidad fija de slots de movimiento equipados por Pokémon (spec `024`). */
const MOVE_SLOT_COUNT = 4;

/** Pestaña de filtro de la tabla de cobertura (implementación directa
 *  pedida por el usuario sobre un mockup, 2026-09-10): filtra las filas
 *  visibles por su `coverageCoefficient` redondeado, sin afectar el mapa
 *  de calor (que sigue calculándose sobre todas las filas) ni la fila de
 *  Total (que sigue promediando todas las filas, no solo las visibles). */
type CoverageTab = 'all' | 'super-effective' | 'blind-spots';

/** Umbral (inclusive) de `coverageCoefficient` redondeado para la pestaña
 *  "Súper eficaces". */
const SUPER_EFFECTIVE_THRESHOLD = 200;

/** Umbral (inclusive) de `coverageCoefficient` redondeado para la pestaña
 *  "Puntos ciegos / Bajos". */
const BLIND_SPOT_THRESHOLD = 100;

/** Orden de las filas visibles (implementación directa, 2026-09-10) —
 *  no altera el orden usado por el mapa de calor ni por la fila de Total,
 *  solo el de `<tbody>`. */
type SortOrder = 'original' | 'coverage-desc' | 'coverage-asc' | 'alpha';

/** Clasificación descriptiva de un valor de eficacia defensiva (siempre
 *  uno de `0, 0.25, 0.5, 1, 2, 4` — producto de hasta dos multiplicadores
 *  en `{0, 0.5, 1, 2}`, ver `type-effectiveness.ts`) — implementación
 *  directa pedida por el usuario sobre un mockup (2026-09-10) para mostrar
 *  un texto ("Inmune"/"Resiste"/"Neutro"/"Débil") en vez de solo el número. */
type EfficacyTier = 'immune' | 'resists' | 'neutral' | 'weak';

function efficacyTierFor(efficacy: number): EfficacyTier {
  if (efficacy === 0) {
    return 'immune';
  }
  if (efficacy < 1) {
    return 'resists';
  }
  if (efficacy === 1) {
    return 'neutral';
  }
  return 'weak';
}

const EFFICACY_TIER_I18N_KEY: Record<EfficacyTier, string> = {
  immune: 'team.coverageEfficacyImmune',
  resists: 'team.coverageEfficacyResists',
  neutral: 'team.coverageEfficacyNeutral',
  weak: 'team.coverageEfficacyWeak',
};

const EFFICACY_TIER_CSS_CLASS: Record<EfficacyTier, string> = {
  immune: 'app-coverage-table__efficacy--immune',
  resists: 'app-coverage-table__efficacy--resists',
  neutral: 'app-coverage-table__efficacy--neutral',
  weak: 'app-coverage-table__efficacy--weak',
};

/**
 * Tabla de Análisis de Cobertura del modal de detalle de un Pokémon (spec
 * `023`, FR-001-FR-012; spec `024`, FR-001-FR-010; spec `025`, FR-001-FR-009):
 * una fila por cada tipo de ataque válido en la generación del juego
 * seleccionado, con su eficacia defensiva combinada, su coeficiente de
 * defensa, el coeficiente de ataque de cada uno de los 4 movimientos
 * equipados, su promedio, y su coeficiente de cobertura — más una fila
 * final de "Total" con el promedio de esa última columna.
 *
 * Puramente presentacional — invoca `computeDefensiveCoverageRows`
 * (dominio `pokemon`) para todo el cálculo; este componente solo redondea
 * los valores para mostrarlos (FR-006a/FR-008), muestra el indicador de
 * "no aplica" para movimientos de estado/slots vacíos (FR-004) y aplica el
 * mapa de calor genérico (`shared/design-system`) a cada celda calculable.
 *
 * Ganó, sin ninguna spec formal (pedido directo del usuario sobre un
 * mockup, 2026-09-10): pestañas de filtro por rango de cobertura, un
 * buscador por nombre de tipo, un selector de orden, etiquetas
 * descriptivas de eficacia, y una tarjeta de resumen ("Puntaje Global")
 * debajo de la tabla — ninguno de estos elementos afecta el mapa de calor
 * ni el valor de la fila de Total, que siguen reflejando SIEMPRE la
 * totalidad de las filas. La paleta del mapa de calor (`heatmapColorFor`)
 * pasó de un degradado de un solo matiz a una paleta "semáforo" (rojo→
 * amarillo→verde, pedida explícitamente por el usuario pese a la pérdida
 * de garantía de accesibilidad para daltonismo rojo-verde que tenía el
 * diseño anterior — ver `heatmap-gradient.ts`).
 */
@Component({
  selector: 'app-coverage-analysis-table',
  standalone: true,
  imports: [TranslocoModule, TypeBadgeComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-coverage-table">
      <span class="app-coverage-table__title">{{ 'team.coverageSectionLabel' | transloco }}</span>
      @if (rows(); as coverageRows) {
        <div class="app-coverage-table__toolbar">
          <div class="app-coverage-table__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              class="app-coverage-table__tab"
              [class.app-coverage-table__tab--active]="activeTab() === 'all'"
              [attr.aria-selected]="activeTab() === 'all'"
              (click)="activeTab.set('all')"
            >
              {{ 'team.coverageTabAll' | transloco }} ({{ coverageRows.length }})
            </button>
            <button
              type="button"
              role="tab"
              class="app-coverage-table__tab"
              [class.app-coverage-table__tab--active]="activeTab() === 'super-effective'"
              [attr.aria-selected]="activeTab() === 'super-effective'"
              (click)="activeTab.set('super-effective')"
            >
              {{ 'team.coverageTabSuperEffective' | transloco }} (≥{{ superEffectiveThreshold }})
            </button>
            <button
              type="button"
              role="tab"
              class="app-coverage-table__tab"
              [class.app-coverage-table__tab--active]="activeTab() === 'blind-spots'"
              [attr.aria-selected]="activeTab() === 'blind-spots'"
              (click)="activeTab.set('blind-spots')"
            >
              {{ 'team.coverageTabBlindSpots' | transloco }} (≤{{ blindSpotThreshold }})
            </button>
          </div>
          <div class="app-coverage-table__controls">
            <input
              type="search"
              class="app-coverage-table__search"
              [attr.aria-label]="'team.coverageSearchPlaceholder' | transloco"
              [placeholder]="'team.coverageSearchPlaceholder' | transloco"
              [ngModel]="searchText()"
              (ngModelChange)="searchText.set($event)"
            />
            <select
              class="app-coverage-table__sort"
              [attr.aria-label]="'team.coverageSortLabel' | transloco"
              [ngModel]="sortOrder()"
              (ngModelChange)="sortOrder.set($event)"
            >
              <option value="original">{{ 'team.coverageSortOriginal' | transloco }}</option>
              <option value="coverage-desc">{{ 'team.coverageSortCoverageDesc' | transloco }}</option>
              <option value="coverage-asc">{{ 'team.coverageSortCoverageAsc' | transloco }}</option>
              <option value="alpha">{{ 'team.coverageSortAlpha' | transloco }}</option>
            </select>
          </div>
        </div>
        <div class="app-coverage-table__scroll">
          <table class="app-coverage-table__table">
            <thead>
              <tr class="app-coverage-table__group-row">
                <th></th>
                <th colspan="2">{{ 'team.coverageGroupDefense' | transloco }}</th>
                <th [attr.colspan]="moveSlots().length + 1">{{ 'team.coverageGroupOffense' | transloco }}</th>
                <th>{{ 'team.coverageGroupFinal' | transloco }}</th>
              </tr>
              <tr>
                <th>{{ 'team.coverageTypeColumnLabel' | transloco }}</th>
                <th>{{ 'team.coverageEfficacyColumnLabel' | transloco }}</th>
                <th>{{ 'team.coverageDefenseColumnLabel' | transloco }}</th>
                @for (move of moveSlots(); track $index) {
                  <th>{{ move ? move.displayName : ('team.emptyMoveSlot' | transloco) }}</th>
                }
                <th>{{ 'team.coverageAverageColumnLabel' | transloco }}</th>
                <th>{{ 'team.coverageCoefficientColumnLabel' | transloco }}</th>
              </tr>
            </thead>
            <tbody>
              @for (row of visibleRows(); track row.type.id) {
                <tr>
                  <td>
                    <app-type-badge [typeId]="row.type.id" [label]="row.type.label" />
                  </td>
                  <td
                    [class]="efficacyTierClass(row.efficacy)"
                    [style.background]="heatmapColorFor(row.efficacy, efficacyColumnValues())"
                  >
                    {{ row.efficacy }}× ({{ efficacyTierI18nKey(row.efficacy) | transloco }})
                  </td>
                  <td
                    [style.background]="heatmapColorFor(row.defenseCoefficient, defenseCoefficientColumnValues())"
                    [style.color]="heatmapTextColorFor(row.defenseCoefficient, defenseCoefficientColumnValues())"
                  >
                    {{ roundedValue(row.defenseCoefficient) }}
                  </td>
                  @for (coefficient of row.attackCoefficients; track $index) {
                    @if (coefficient === null) {
                      <td>{{ 'team.coverageAttackCoefficientNotApplicable' | transloco }}</td>
                    } @else {
                      <td
                        [style.background]="heatmapColorFor(coefficient, attackCoefficientColumnValues()[$index])"
                        [style.color]="heatmapTextColorFor(coefficient, attackCoefficientColumnValues()[$index])"
                      >
                        {{ roundedValue(coefficient) }}
                      </td>
                    }
                  }
                  @if (row.averageAttackCoefficient === null) {
                    <td>{{ 'team.coverageAttackCoefficientNotApplicable' | transloco }}</td>
                  } @else {
                    <td
                      [style.background]="heatmapColorFor(row.averageAttackCoefficient, averageAttackCoefficientColumnValues())"
                      [style.color]="heatmapTextColorFor(row.averageAttackCoefficient, averageAttackCoefficientColumnValues())"
                    >
                      {{ roundedValue(row.averageAttackCoefficient) }}
                    </td>
                  }
                  <td
                    [style.background]="heatmapColorFor(row.coverageCoefficient, coverageCoefficientColumnValues())"
                    [style.color]="heatmapTextColorFor(row.coverageCoefficient, coverageCoefficientColumnValues())"
                  >
                    {{ roundedValue(row.coverageCoefficient) }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="app-coverage-table__row--total" [attr.aria-label]="'team.coverageTotalRowLabel' | transloco">
                <td></td>
                <td></td>
                <td></td>
                @for (move of moveSlots(); track $index) {
                  <td></td>
                }
                <td></td>
                <td>{{ roundedValue(totalCoverageCoefficient()) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="app-coverage-table__summary">
          <span class="app-coverage-table__summary-dot" aria-hidden="true"></span>
          <div class="app-coverage-table__summary-text">
            <strong>{{ 'team.coverageSummaryTitle' | transloco }}</strong>
            <span>{{ 'team.coverageSummaryDescription' | transloco }}</span>
          </div>
          <div class="app-coverage-table__summary-score">
            <span class="app-coverage-table__summary-score-label">{{ 'team.coverageSummaryScoreLabel' | transloco }}</span>
            <span class="app-coverage-table__summary-score-value">{{ roundedValue(totalCoverageCoefficient()) }}</span>
          </div>
        </div>
      } @else {
        <p class="app-coverage-table__unavailable">{{ 'team.coverageUnavailable' | transloco }}</p>
      }
    </div>
  `,
  styles: `
    .app-coverage-table {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
    }
    .app-coverage-table__title {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.55;
    }
    .app-coverage-table__toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .app-coverage-table__tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .app-coverage-table__tab {
      appearance: none;
      cursor: pointer;
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 999px;
      padding: 0.3rem 0.7rem;
      font-size: 0.7rem;
      font-weight: 700;
      background: transparent;
      color: inherit;
    }
    .app-coverage-table__tab--active {
      border-color: var(--mat-sys-primary, #673ab7);
      background: var(--mat-sys-primary-container, rgba(103, 58, 183, 0.14));
      color: var(--mat-sys-on-primary-container, inherit);
    }
    .app-coverage-table__controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .app-coverage-table__search,
    .app-coverage-table__sort {
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 8px;
      padding: 0.3rem 0.5rem;
      font-size: 0.75rem;
      background: transparent;
      color: inherit;
    }
    .app-coverage-table__search {
      min-width: 10rem;
    }
    .app-coverage-table__scroll {
      width: 100%;
      overflow-x: auto;
    }
    .app-coverage-table__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }
    .app-coverage-table__table th {
      text-align: left;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.6;
      padding: 0.3rem 0.4rem;
    }
    .app-coverage-table__group-row th {
      opacity: 0.45;
      font-size: 0.6rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant, #eceff1);
    }
    .app-coverage-table__table td {
      padding: 0.3rem 0.4rem;
      border-top: 1px solid var(--mat-sys-outline-variant, #eceff1);
    }
    .app-coverage-table__efficacy--immune {
      color: #8e24aa;
      font-weight: 700;
    }
    .app-coverage-table__efficacy--resists {
      color: #2e7d32;
      font-weight: 700;
    }
    .app-coverage-table__efficacy--neutral {
      opacity: 0.75;
    }
    .app-coverage-table__efficacy--weak {
      color: #c62828;
      font-weight: 700;
    }
    .app-coverage-table__row--total td {
      border-top: 2px solid var(--mat-sys-outline, #79747e);
      font-weight: 800;
    }
    .app-coverage-table__unavailable {
      font-size: 0.8rem;
      opacity: 0.7;
      margin: 0;
    }
    .app-coverage-table__summary {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
      padding: 0.5rem 0.7rem;
      border-radius: 10px;
      background: var(--mat-sys-surface-variant, #f3f0f7);
    }
    .app-coverage-table__summary-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 999px;
      background: var(--mat-sys-primary, #673ab7);
      flex-shrink: 0;
    }
    .app-coverage-table__summary-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      flex: 1;
      min-width: 12rem;
    }
    .app-coverage-table__summary-text strong {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .app-coverage-table__summary-text span {
      font-size: 0.7rem;
      opacity: 0.7;
    }
    .app-coverage-table__summary-score {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.1rem;
    }
    .app-coverage-table__summary-score-label {
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.6;
    }
    .app-coverage-table__summary-score-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--mat-sys-primary, #673ab7);
    }
  `,
})
export class CoverageAnalysisTableComponent {
  readonly pokemonTypes = input.required<readonly [PokemonType] | readonly [PokemonType, PokemonType]>();
  readonly stats = input.required<PokemonStats>();
  readonly generation = input<Generation | null>(null);
  /** Los 4 movimientos equipados (o `null` por slot vacío), mismo array y
   *  orden que `PokemonDetailModalComponent.resolvedMoveSlots` ya usa para
   *  la sección "Movimientos" (spec `024`, FR-002). */
  readonly moveSlots = input.required<readonly (Move | null)[]>();

  /** Las filas ya calculadas (dominio `pokemon`), o `null` cuando la
   *  generación no tiene una era de tipos reconocida (FR-012) — se
   *  recalcula automáticamente ante cualquier cambio de input (FR-010,
   *  spec `024` FR-009). */
  protected readonly rows = computed<readonly DefensiveCoverageRow[] | null>(() => {
    const generation = this.generation();
    if (generation === null) {
      return null;
    }
    return computeDefensiveCoverageRows(this.pokemonTypes(), this.stats(), generation, this.moveSlots());
  });

  /** Todos los valores de eficacia defensiva (precisión completa, sin
   *  redondear) de la tabla actual — la columna completa que
   *  `heatmapColorFor` (FR-007) necesita para su propio mínimo/máximo. */
  protected readonly efficacyColumnValues = computed<readonly number[]>(() => (this.rows() ?? []).map((row) => row.efficacy));

  /** Igual que {@link efficacyColumnValues} pero para el coeficiente de
   *  defensa (FR-008) — calculado de forma independiente, con su propio
   *  mínimo/máximo. */
  protected readonly defenseCoefficientColumnValues = computed<readonly number[]>(() =>
    (this.rows() ?? []).map((row) => row.defenseCoefficient),
  );

  /** Un `readonly number[]` por cada uno de los 4 slots de movimiento (spec
   *  `024`, FR-007): los valores calculables (no `null`) de `attackCoefficients[i]`
   *  entre todas las filas, para el mínimo/máximo propio de esa columna —
   *  las celdas "no aplica" (FR-004) quedan excluidas del rango. */
  protected readonly attackCoefficientColumnValues = computed<readonly (readonly number[])[]>(() => {
    const rows = this.rows() ?? [];
    return Array.from({ length: MOVE_SLOT_COUNT }, (_, i) =>
      rows.map((row) => row.attackCoefficients[i]).filter((v): v is number => v !== null),
    );
  });

  /** Igual que {@link attackCoefficientColumnValues} pero para la columna de
   *  promedio (spec `024`, FR-005/FR-007). */
  protected readonly averageAttackCoefficientColumnValues = computed<readonly number[]>(() =>
    (this.rows() ?? []).map((row) => row.averageAttackCoefficient).filter((v): v is number => v !== null),
  );

  /** Igual que {@link efficacyColumnValues} pero para el coeficiente de
   *  cobertura (spec `025`, FR-004) — sin `.filter`, porque `coverageCoefficient`
   *  nunca es `null` (a diferencia de `attackCoefficients`/`averageAttackCoefficient`). */
  protected readonly coverageCoefficientColumnValues = computed<readonly number[]>(() =>
    (this.rows() ?? []).map((row) => row.coverageCoefficient),
  );

  /** Media aritmética de {@link coverageCoefficientColumnValues} — el valor
   *  de la fila de Total (spec `025`, FR-007) y de la tarjeta de resumen
   *  ("Puntaje Global"). Como `coverageCoefficient` nunca es `null`, no
   *  hace falta excluir ninguna fila del promedio. Se calcula siempre
   *  sobre TODAS las filas, sin importar la pestaña/búsqueda/orden activos
   *  — es un resumen global, no del subconjunto visible (ver
   *  {@link visibleRows}). */
  protected readonly totalCoverageCoefficient = computed<number>(() => averageCoverageCoefficient(this.rows() ?? []));

  /** Pestaña de filtro activa de la tabla (implementación directa pedida
   *  por el usuario sobre un mockup, 2026-09-10) — no forma parte de
   *  ninguna spec `023`/`024`/`025`. */
  protected readonly activeTab = signal<CoverageTab>('all');

  protected readonly superEffectiveThreshold = SUPER_EFFECTIVE_THRESHOLD;
  protected readonly blindSpotThreshold = BLIND_SPOT_THRESHOLD;

  /** Texto de búsqueda por nombre de tipo (implementación directa,
   *  2026-09-10) — filtra sobre `row.type.label`, insensible a mayúsculas. */
  protected readonly searchText = signal('');

  /** Orden de las filas visibles (implementación directa, 2026-09-10). */
  protected readonly sortOrder = signal<SortOrder>('original');

  /** Filas realmente renderizadas en `<tbody>`: filtradas por pestaña
   *  ({@link activeTab}) y por {@link searchText}, y ordenadas según
   *  {@link sortOrder} — ninguno de los tres afecta el mapa de calor de
   *  ninguna columna (que sigue calculándose sobre {@link rows}, todas las
   *  filas) ni la fila de Total/tarjeta de resumen
   *  ({@link totalCoverageCoefficient}). */
  protected readonly visibleRows = computed<readonly DefensiveCoverageRow[]>(() => {
    const rows = this.rows() ?? [];
    const tab = this.activeTab();
    let filtered = rows;
    if (tab === 'super-effective') {
      filtered = filtered.filter((row) => this.roundedValue(row.coverageCoefficient) >= SUPER_EFFECTIVE_THRESHOLD);
    } else if (tab === 'blind-spots') {
      filtered = filtered.filter((row) => this.roundedValue(row.coverageCoefficient) <= BLIND_SPOT_THRESHOLD);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search.length > 0) {
      filtered = filtered.filter((row) => row.type.label.toLowerCase().includes(search));
    }

    const order = this.sortOrder();
    if (order === 'original') {
      return filtered;
    }
    const sorted = [...filtered];
    if (order === 'coverage-desc') {
      sorted.sort((a, b) => b.coverageCoefficient - a.coverageCoefficient);
    } else if (order === 'coverage-asc') {
      sorted.sort((a, b) => a.coverageCoefficient - b.coverageCoefficient);
    } else {
      sorted.sort((a, b) => a.type.label.localeCompare(b.type.label));
    }
    return sorted;
  });

  /** Redondeo a entero para la presentación visual (FR-006a) — el cálculo
   *  interno (`rows()`) conserva siempre la precisión decimal completa. */
  protected roundedValue(value: number): number {
    return Math.round(value);
  }

  /** Expuesto al template para el color de fondo de cada celda (FR-007/FR-008),
   *  siempre con los valores de precisión completa, nunca los ya redondeados
   *  para mostrar (FR-006a). */
  protected readonly heatmapColorFor = heatmapColorFor;

  /** Expuesto al template para el color de texto de contraste de cada celda
   *  con mapa de calor — blanco sobre fondos oscuros, oscuro sobre fondos
   *  claros, siempre calculado sobre la misma posición que `heatmapColorFor`. */
  protected readonly heatmapTextColorFor = heatmapTextColorFor;

  /** Clave i18n de la etiqueta descriptiva de eficacia ("Inmune"/"Resiste"/
   *  "Neutro"/"Débil", implementación directa 2026-09-10). */
  protected efficacyTierI18nKey(efficacy: number): string {
    return EFFICACY_TIER_I18N_KEY[efficacyTierFor(efficacy)];
  }

  /** Clase CSS de color de texto para la etiqueta descriptiva de eficacia. */
  protected efficacyTierClass(efficacy: number): string {
    return EFFICACY_TIER_CSS_CLASS[efficacyTierFor(efficacy)];
  }

}
