import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { heatmapColorFor, heatmapTextColorFor } from '../../shared/design-system/heatmap-gradient';
import { TypeBadgeComponent } from '../../shared/design-system/type-badge.component';
import type { TeamCoverageCell, TeamCoverageRow, TeamCoverageTotals } from './team-coverage.types';

/** Las 3 métricas de una `TeamCoverageCell`, en el orden en que se
 *  renderizan sus sub-columnas. */
type CoverageMetric = 'defense' | 'attack' | 'coverage';

/** Sprite de reserva — mismo criterio que `TeamSlotComponent.EGG_SPRITE_URL`
 *  para cuando una columna de Pokémon no tiene sprite resuelto. */
const EGG_SPRITE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/egg.png';

/** Pestaña de filtro de la tabla (mismo mecanismo que
 *  `CoverageAnalysisTableComponent`, pedido por el usuario para el modal
 *  de equipo también): filtra las filas (tipos) visibles por el
 *  coeficiente de cobertura representativo de ese tipo para el equipo —
 *  el de la columna de promedio del equipo cuando existe — sin afectar el
 *  mapa de calor (que sigue calculándose sobre todas las filas). */
type CoverageTab = 'all' | 'super-effective' | 'blind-spots';

/** Mismos umbrales (inclusive) que `CoverageAnalysisTableComponent`. */
const SUPER_EFFECTIVE_THRESHOLD = 200;
const BLIND_SPOT_THRESHOLD = 100;

/** Orden de las filas visibles — mismo mecanismo que
 *  `CoverageAnalysisTableComponent`, sobre el coeficiente de cobertura
 *  representativo del tipo para el equipo. */
type SortOrder = 'original' | 'coverage-desc' | 'coverage-asc' | 'alpha';

/**
 * Modal de Análisis de Cobertura del equipo (spec `027`) — una fila por
 * cada tipo de la generación activa (misma orientación que la tabla de la
 * tarjeta individual, `023`-`025`) y una columna (3 sub-valores: defensa/
 * ataque/cobertura) por cada Pokémon ocupado del equipo, más una columna
 * final con la media aritmética del equipo por tipo y métrica.
 *
 * Puramente presentacional (Constitución Principio VI): nunca invoca
 * `computeDefensiveCoverageRows` ni ningún puerto/servicio — todo llega
 * ya resuelto por `TeamBuilderPage` (`rows`/`types`/`totals`). Solo
 * formatea (`Math.round`) y pinta (`heatmapColorFor`/`heatmapTextColorFor`,
 * sin cambios respecto a `CoverageAnalysisTableComponent`).
 *
 * Incorpora, sin ninguna spec formal (pedido directo del usuario sobre la
 * implementación ya construida): las mismas pestañas de filtro por rango
 * de cobertura, buscador por nombre de tipo, y selector de orden que ya
 * tiene `CoverageAnalysisTableComponent` — ninguno de los tres afecta el
 * mapa de calor de ninguna columna (que sigue calculándose sobre `types()`
 * completo) ni los valores de la columna de totales.
 */
@Component({
  selector: 'app-team-coverage-modal',
  standalone: true,
  imports: [FormsModule, MatIconModule, TranslocoModule, TypeBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-modal-overlay">
      <div
        class="app-modal-card app-team-coverage-modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'team.teamCoverageModalTitle' | transloco"
      >
        <header class="app-team-coverage-modal__header">
          <h2>{{ 'team.teamCoverageModalTitle' | transloco }}</h2>
          <button
            class="app-team-coverage-modal__close"
            mat-icon-button
            type="button"
            data-testid="team-coverage-modal-close"
            [attr.aria-label]="'common.close' | transloco"
            (click)="close.emit()"
          >
            <mat-icon>close</mat-icon>
          </button>
        </header>

        @if (generationUnavailable()) {
          <p class="app-team-coverage-modal__unavailable">{{ 'team.coverageUnavailable' | transloco }}</p>
        } @else {
          <div class="app-team-coverage-modal__toolbar">
            <div class="app-team-coverage-modal__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                class="app-team-coverage-modal__tab"
                [class.app-team-coverage-modal__tab--active]="activeTab() === 'all'"
                [attr.aria-selected]="activeTab() === 'all'"
                (click)="activeTab.set('all')"
              >
                {{ 'team.coverageTabAll' | transloco }} ({{ types().length }})
              </button>
              <button
                type="button"
                role="tab"
                class="app-team-coverage-modal__tab"
                [class.app-team-coverage-modal__tab--active]="activeTab() === 'super-effective'"
                [attr.aria-selected]="activeTab() === 'super-effective'"
                (click)="activeTab.set('super-effective')"
              >
                {{ 'team.coverageTabSuperEffective' | transloco }} (≥{{ superEffectiveThreshold }})
              </button>
              <button
                type="button"
                role="tab"
                class="app-team-coverage-modal__tab"
                [class.app-team-coverage-modal__tab--active]="activeTab() === 'blind-spots'"
                [attr.aria-selected]="activeTab() === 'blind-spots'"
                (click)="activeTab.set('blind-spots')"
              >
                {{ 'team.coverageTabBlindSpots' | transloco }} (≤{{ blindSpotThreshold }})
              </button>
            </div>
            <div class="app-team-coverage-modal__controls">
              <input
                type="search"
                class="app-team-coverage-modal__search"
                [attr.aria-label]="'team.coverageSearchPlaceholder' | transloco"
                [placeholder]="'team.coverageSearchPlaceholder' | transloco"
                [ngModel]="searchText()"
                (ngModelChange)="searchText.set($event)"
              />
              <select
                class="app-team-coverage-modal__sort"
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
          <div class="app-team-coverage-modal__scroll">
            <table class="app-team-coverage-modal__table">
              <thead>
                <tr>
                  <th class="app-team-coverage-modal__type-header"></th>
                  @for (row of rows(); track row.slotIndex) {
                    <th [attr.colspan]="3" class="app-team-coverage-modal__pokemon-header">
                      <img [src]="row.spriteUrl ?? eggSpriteUrl" [alt]="row.displayName" />
                      <span class="app-team-coverage-modal__pokemon-name">{{ row.displayName }}</span>
                      <span class="app-team-coverage-modal__pokemon-types">
                        <app-type-badge [typeId]="row.types[0].id" [label]="row.types[0].label" />
                        @if (row.types[1]; as secondary) {
                          <app-type-badge [typeId]="secondary.id" [label]="secondary.label" />
                        }
                      </span>
                    </th>
                  }
                  @if (totals(); as teamTotals) {
                    <th [attr.colspan]="3" class="app-team-coverage-modal__pokemon-header">
                      {{ 'team.teamCoverageTotalRowLabel' | transloco }}
                    </th>
                  }
                </tr>
                <tr>
                  <th class="app-team-coverage-modal__type-header">{{ 'team.teamCoveragePokemonColumnLabel' | transloco }}</th>
                  @for (row of rows(); track row.slotIndex) {
                    <th>{{ 'team.teamCoverageDefenseSubcolumnLabel' | transloco }}</th>
                    <th>{{ 'team.teamCoverageAttackSubcolumnLabel' | transloco }}</th>
                    <th>{{ 'team.teamCoverageCoverageSubcolumnLabel' | transloco }}</th>
                  }
                  @if (totals()) {
                    <th>{{ 'team.teamCoverageDefenseSubcolumnLabel' | transloco }}</th>
                    <th>{{ 'team.teamCoverageAttackSubcolumnLabel' | transloco }}</th>
                    <th>{{ 'team.teamCoverageCoverageSubcolumnLabel' | transloco }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (type of visibleTypes(); track type.id) {
                  <tr>
                    <td class="app-team-coverage-modal__type-cell">
                      <app-type-badge [typeId]="type.id" [label]="type.label" />
                    </td>
                    @for (row of rows(); track row.slotIndex) {
                      @if (row.coverageByType.get(type.id); as cell) {
                        <td
                          [style.background]="heatmapColorFor(cell.defense, columnValuesForRow(row, 'defense'))"
                          [style.color]="heatmapTextColorFor(cell.defense, columnValuesForRow(row, 'defense'))"
                        >
                          {{ roundedValue(cell.defense) }}
                        </td>
                        @if (cell.attack === null) {
                          <td>{{ 'team.coverageAttackCoefficientNotApplicable' | transloco }}</td>
                        } @else {
                          <td
                            [style.background]="heatmapColorFor(cell.attack, columnValuesForRow(row, 'attack'))"
                            [style.color]="heatmapTextColorFor(cell.attack, columnValuesForRow(row, 'attack'))"
                          >
                            {{ roundedValue(cell.attack) }}
                          </td>
                        }
                        <td
                          [style.background]="heatmapColorFor(cell.coverage, columnValuesForRow(row, 'coverage'))"
                          [style.color]="heatmapTextColorFor(cell.coverage, columnValuesForRow(row, 'coverage'))"
                        >
                          {{ roundedValue(cell.coverage) }}
                        </td>
                      } @else {
                        <td></td>
                        <td></td>
                        <td></td>
                      }
                    }
                    @if (totals(); as teamTotals) {
                      @if (teamTotals.totalsByType.get(type.id); as totalCell) {
                        <td
                          class="app-team-coverage-modal__total-cell"
                          [style.background]="heatmapColorFor(totalCell.defense, columnValuesForTotals('defense'))"
                          [style.color]="heatmapTextColorFor(totalCell.defense, columnValuesForTotals('defense'))"
                        >
                          {{ roundedValue(totalCell.defense) }}
                        </td>
                        <td
                          class="app-team-coverage-modal__total-cell"
                          [style.background]="heatmapColorFor(totalCell.attack, columnValuesForTotals('attack'))"
                          [style.color]="heatmapTextColorFor(totalCell.attack, columnValuesForTotals('attack'))"
                        >
                          {{ roundedValue(totalCell.attack) }}
                        </td>
                        <td
                          class="app-team-coverage-modal__total-cell"
                          [style.background]="heatmapColorFor(totalCell.coverage, columnValuesForTotals('coverage'))"
                          [style.color]="heatmapTextColorFor(totalCell.coverage, columnValuesForTotals('coverage'))"
                        >
                          {{ roundedValue(totalCell.coverage) }}
                        </td>
                      } @else {
                        <td></td>
                        <td></td>
                        <td></td>
                      }
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .app-team-coverage-modal {
      max-width: min(1100px, 96vw);
      display: flex;
      flex-direction: column;
    }
    .app-team-coverage-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem 0.5rem;
      gap: 1rem;
    }
    .app-team-coverage-modal__header h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .app-team-coverage-modal__unavailable {
      padding: 0 1.25rem 1.25rem;
      color: var(--mat-sys-on-surface-variant, #49454f);
    }
    .app-team-coverage-modal__toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0 1.25rem 0.5rem;
    }
    .app-team-coverage-modal__tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .app-team-coverage-modal__tab {
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
    .app-team-coverage-modal__tab--active {
      border-color: var(--mat-sys-primary, #673ab7);
      background: var(--mat-sys-primary-container, rgba(103, 58, 183, 0.14));
      color: var(--mat-sys-on-primary-container, inherit);
    }
    .app-team-coverage-modal__controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .app-team-coverage-modal__search,
    .app-team-coverage-modal__sort {
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 8px;
      padding: 0.3rem 0.5rem;
      font-size: 0.75rem;
      background: transparent;
      color: inherit;
    }
    .app-team-coverage-modal__search {
      min-width: 10rem;
    }
    .app-team-coverage-modal__scroll {
      overflow-x: auto;
      padding: 0 1.25rem 1.25rem;
    }
    .app-team-coverage-modal__table {
      border-collapse: collapse;
      width: 100%;
    }
    .app-team-coverage-modal__table th,
    .app-team-coverage-modal__table td {
      padding: 0.4rem 0.55rem;
      text-align: center;
      white-space: nowrap;
      font-size: 0.85rem;
    }
    .app-team-coverage-modal__type-header,
    .app-team-coverage-modal__type-cell {
      position: sticky;
      left: 0;
      background: var(--mat-sys-surface, #fff);
      text-align: left;
      z-index: 1;
    }
    .app-team-coverage-modal__pokemon-header {
      display: table-cell;
      vertical-align: bottom;
    }
    .app-team-coverage-modal__pokemon-header img {
      display: block;
      margin: 0 auto;
      width: 40px;
      height: 40px;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .app-team-coverage-modal__pokemon-name {
      display: block;
      font-weight: 600;
      white-space: nowrap;
    }
    .app-team-coverage-modal__pokemon-types {
      display: flex;
      justify-content: center;
      gap: 0.2rem;
      flex-wrap: wrap;
    }
    .app-team-coverage-modal__total-cell {
      font-weight: 700;
    }
  `,
})
export class TeamCoverageModalComponent {
  readonly rows = input.required<readonly TeamCoverageRow[]>();
  readonly types = input.required<readonly PokemonType[]>();
  readonly totals = input<TeamCoverageTotals | null>(null);
  readonly generationUnavailable = input(false);
  readonly close = output<void>();

  protected readonly eggSpriteUrl = EGG_SPRITE_URL;
  protected readonly heatmapColorFor = heatmapColorFor;
  protected readonly heatmapTextColorFor = heatmapTextColorFor;

  /** Pestaña de filtro activa — mismo mecanismo que
   *  `CoverageAnalysisTableComponent`, pedido por el usuario también para
   *  este modal. No forma parte de ninguna spec `027`. */
  protected readonly activeTab = signal<CoverageTab>('all');
  protected readonly superEffectiveThreshold = SUPER_EFFECTIVE_THRESHOLD;
  protected readonly blindSpotThreshold = BLIND_SPOT_THRESHOLD;

  /** Texto de búsqueda por nombre de tipo — filtra sobre `type.label`,
   *  insensible a mayúsculas, mismo criterio que `CoverageAnalysisTableComponent`. */
  protected readonly searchText = signal('');

  /** Orden de las filas visibles. */
  protected readonly sortOrder = signal<SortOrder>('original');

  /** El coeficiente de cobertura "representativo" de un tipo para todo el
   *  equipo, usado únicamente por las pestañas/orden (nunca por el mapa de
   *  calor ni por los valores mostrados en las celdas): el de la columna
   *  de promedio del equipo cuando existe; si no (`totals()` es `null`,
   *  equipo con 0 Pokémon en la práctica), la media aritmética simple de
   *  `cell.coverage` entre las columnas de Pokémon visibles para ese tipo. */
  private representativeCoverageFor(type: PokemonType): number {
    const totalCell = this.totals()?.totalsByType.get(type.id);
    if (totalCell !== undefined) {
      return totalCell.coverage;
    }
    const values = this.rows()
      .map((row) => row.coverageByType.get(type.id)?.coverage)
      .filter((value): value is number => value !== undefined);
    return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /** Filas (tipos) realmente renderizadas en `<tbody>`: filtradas por
   *  pestaña ({@link activeTab}) y por {@link searchText}, y ordenadas
   *  según {@link sortOrder} — ninguno de los tres afecta el mapa de calor
   *  de ninguna columna (que sigue calculándose sobre `types()` completo)
   *  ni los valores de la columna de totales. */
  protected readonly visibleTypes = computed<readonly PokemonType[]>(() => {
    const types = this.types();
    const tab = this.activeTab();
    let filtered = types;
    if (tab === 'super-effective') {
      filtered = filtered.filter((type) => this.roundedValue(this.representativeCoverageFor(type)) >= SUPER_EFFECTIVE_THRESHOLD);
    } else if (tab === 'blind-spots') {
      filtered = filtered.filter((type) => this.roundedValue(this.representativeCoverageFor(type)) <= BLIND_SPOT_THRESHOLD);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search.length > 0) {
      filtered = filtered.filter((type) => type.label.toLowerCase().includes(search));
    }

    const order = this.sortOrder();
    if (order === 'original') {
      return filtered;
    }
    const sorted = [...filtered];
    if (order === 'coverage-desc') {
      sorted.sort((a, b) => this.representativeCoverageFor(b) - this.representativeCoverageFor(a));
    } else if (order === 'coverage-asc') {
      sorted.sort((a, b) => this.representativeCoverageFor(a) - this.representativeCoverageFor(b));
    } else {
      sorted.sort((a, b) => a.label.localeCompare(b.label));
    }
    return sorted;
  });

  /** Mismo criterio de redondeo que `CoverageAnalysisTableComponent.roundedValue`
   *  (visual entero, precisión decimal completa conservada aguas arriba). */
  protected roundedValue(value: number): number {
    return Math.round(value);
  }

  /** FR-011: los valores de la columna de un Pokémon para una métrica dada
   *  — uno por cada fila de tipo de `types()` (TODAS, no solo
   *  {@link visibleTypes}) — para calcular el mapa de calor de esa columna
   *  de forma independiente del resto y sin verse afectado por los
   *  filtros/orden de la tabla. Excluye `null` (celdas de ataque "no
   *  aplica", que no llevan mapa de calor, mismo criterio que
   *  `CoverageAnalysisTableComponent`). No memoizado (mismo criterio que
   *  `TeamBuilderPage.coverageIndexFor`) — aceptable dado el volumen
   *  (≤6 columnas × ≤18 filas de tipo). */
  protected columnValuesForRow(row: TeamCoverageRow, metric: CoverageMetric): readonly number[] {
    return this.types()
      .map((type) => row.coverageByType.get(type.id))
      .filter((cell): cell is TeamCoverageCell => cell !== undefined)
      .map((cell) => cell[metric])
      .filter((value): value is number => value !== null);
  }

  /** Mismo criterio que {@link columnValuesForRow}, para la columna final
   *  de promedios del equipo. */
  protected columnValuesForTotals(metric: CoverageMetric): readonly number[] {
    const totals = this.totals();
    if (totals === null) {
      return [];
    }
    return this.types()
      .map((type) => totals.totalsByType.get(type.id))
      .filter((cell): cell is { defense: number; attack: number; coverage: number } => cell !== undefined)
      .map((cell) => cell[metric]);
  }
}
