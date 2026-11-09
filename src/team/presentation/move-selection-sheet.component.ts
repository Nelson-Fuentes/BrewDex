import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import type { DamageClass } from '../../pokemon/domain/value-objects/move';
import type { MoveLearnInfo } from '../../pokemon/domain/value-objects/move-learn-info';
import type { LearnMethod } from '../../pokemon/domain/value-objects/move-learn-method';
import { filterMovepool, type MoveFilter } from '../application/move-filter';
import type { MoveSlots } from '../domain/value-objects/roster-entry';
import { MoveSlotComponent } from './move-slot.component';

const DAMAGE_CLASSES: readonly DamageClass[] = ['physical', 'special', 'status'];
const LEARN_METHODS: readonly LearnMethod[] = ['level', 'tm', 'hm', 'tutor', 'egg'];

/**
 * Selección de movimientos de un slot (FR-004, FR-005) — 4 posiciones
 * fijas, cada una editable eligiendo de la lista de movimientos
 * aprendibles (`movepool`) por la forma/juego activos, filtrable por
 * clase/tipo/método de aprendizaje y por texto libre (FR-007-FR-011) y
 * con los ya asignados a otro slot deshabilitados (FR-016/FR-017). Cada
 * candidato se renderiza con `MoveSlotComponent`, la misma interfaz que
 * el slot ocupado de la tarjeta (FR-006).
 */
@Component({
  selector: 'app-move-selection-sheet',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslocoModule,
    MoveSlotComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-modal-overlay">
      <div
        class="app-modal-card app-move-selection-card"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'team.moveSelectionTitle' | transloco"
      >
        <div class="app-move-selection-content">
          <header>
            <div class="app-move-selection-title-group">
              <h2>{{ 'team.moveSelectionTitle' | transloco }}</h2>
              @if (pokemonName(); as name) {
                <p class="app-move-selection-subtitle">{{ 'team.moveSelectionSubtitle' | transloco: { name } }}</p>
              }
            </div>
            <button mat-icon-button type="button" [attr.aria-label]="'common.close' | transloco" (click)="close.emit()">
              <mat-icon>close</mat-icon>
            </button>
          </header>

          <mat-form-field appearance="outline" class="app-move-search">
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              type="text"
              [attr.aria-label]="'team.moveSearchPlaceholder' | transloco"
              [placeholder]="'team.moveSearchPlaceholder' | transloco"
              [ngModel]="searchText()"
              (ngModelChange)="searchText.set($event)"
            />
            @if (searchText()) {
              <button matSuffix mat-icon-button type="button" [attr.aria-label]="'common.close' | transloco" (click)="searchText.set('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <div class="app-move-filters">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'team.moveFilterDamageClassLabel' | transloco }}</mat-label>
              <mat-select [value]="damageClassFilter()" (selectionChange)="damageClassFilter.set($event.value)">
                <mat-option [value]="null">{{ 'team.moveFilterAll' | transloco }}</mat-option>
                @for (damageClass of damageClasses; track damageClass) {
                  <mat-option [value]="damageClass">{{ 'team.damageClass.' + damageClass | transloco }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'team.moveFilterTypeLabel' | transloco }}</mat-label>
              <mat-select [value]="typeFilter()" (selectionChange)="typeFilter.set($event.value)">
                <mat-option [value]="null">{{ 'team.moveFilterAll' | transloco }}</mat-option>
                @for (type of availableTypes(); track type.id) {
                  <mat-option [value]="type.id">{{ type.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'team.moveFilterLearnMethodLabel' | transloco }}</mat-label>
              <mat-select [value]="learnMethodFilter()" (selectionChange)="learnMethodFilter.set($event.value)">
                <mat-option [value]="null">{{ 'team.moveFilterAll' | transloco }}</mat-option>
                @for (method of learnMethods; track method) {
                  <mat-option [value]="method">{{ 'team.learnMethod.' + method | transloco }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="app-move-selection-summary">
            <span>{{ 'team.moveSelectionCount' | transloco: { count: visibleMovepool().length } }}</span>
            <button mat-button type="button" class="app-move-selection-clear" (click)="clearFilters()">
              <mat-icon>filter_alt_off</mat-icon>
              {{ 'team.moveFilterClear' | transloco }}
            </button>
          </div>

          <div class="app-move-selection-list">
            @for (entry of visibleMovepool(); track entry.move.id) {
              <app-move-slot
                [move]="entry.move"
                [levelLearnedAt]="entry.levelLearnedAt"
                [state]="isAssignedElsewhere(entry) ? 'disabled' : 'selectable'"
                [equipped]="isEquipped(entry)"
                (activate)="selectMove.emit({ position: activePosition(), move: entry.move })"
              />
            } @empty {
              @if (movepool().length === 0) {
                <p class="app-move-selection-empty app-move-selection-empty--no-data">{{ 'team.moveDataUnavailable' | transloco }}</p>
              } @else {
                <p class="app-move-selection-empty">{{ 'team.moveFilterNoResults' | transloco }}</p>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    /* El shell genérico (.app-modal-card, global en styles.scss) no trae
       padding propio — cada modal define el suyo. Acá además se ensancha
       respecto al máximo global (min(520px, 92vw)): con buscador +
       filtros + tarjetas de movimiento con badges, 520px quedaba
       apretado (bug reportado: padding pegado al borde del modal). */
    .app-move-selection-card {
      max-width: min(680px, 95vw);
    }
    .app-move-selection-content {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1.25rem 1.5rem;
    }
    /* El <header> no tiene estilo global (a diferencia de Material) — sin
       esto, el botón de cerrar quedaba debajo del título en vez de
       arriba a la derecha, como en el resto de los modales (bug
       reportado). */
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .app-move-selection-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .app-move-selection-subtitle {
      margin: 0;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .app-move-search {
      width: 100%;
    }
    /* Grilla en vez de flex-wrap (bug reportado: el flex-wrap dejaba un
       hueco vacío al final de la fila) — cada filtro ocupa como mínimo
       160px y se agrupan de a 2 o de a 3 por fila según el ancho
       disponible, sin dejar espacio sobrante. */
    .app-move-filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.5rem;
    }
    .app-move-filters mat-form-field {
      width: 100%;
    }
    .app-move-selection-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .app-move-selection-clear {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .app-move-selection-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .app-move-selection-empty {
      text-align: center;
      color: var(--mat-sys-on-surface-variant, #666);
      font-style: italic;
    }
    .app-move-selection-empty--no-data {
      font-style: normal;
      font-weight: 600;
    }
  `,
})
export class MoveSelectionSheetComponent {
  readonly moveIds = input.required<MoveSlots>();
  readonly movepool = input<readonly MoveLearnInfo[]>([]);
  /** Qué posición (0-3) está eligiéndose ahora mismo. */
  readonly activePosition = input<0 | 1 | 2 | 3>(0);
  /** Nombre del Pokémon activo, mostrado como subtítulo ("Asignados a
   *  X") — puramente informativo, `null` lo oculta. */
  readonly pokemonName = input<string | null>(null);
  readonly selectMove = output<{ position: 0 | 1 | 2 | 3; move: MoveLearnInfo['move'] | null }>();
  readonly close = output<void>();

  protected readonly damageClasses = DAMAGE_CLASSES;
  protected readonly learnMethods = LEARN_METHODS;

  protected readonly searchText = signal('');
  protected readonly damageClassFilter = signal<DamageClass | null>(null);
  protected readonly typeFilter = signal<string | null>(null);
  protected readonly learnMethodFilter = signal<LearnMethod | null>(null);

  /** Los tipos presentes en el movepool actual — solo los relevantes
   *  para este Pokémon, no el catálogo completo de tipos. */
  protected readonly availableTypes = computed(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const entry of this.movepool()) {
      seen.set(entry.move.type.id, { id: entry.move.type.id, label: entry.move.type.label });
    }
    return [...seen.values()];
  });

  protected readonly visibleMovepool = computed(() => {
    const filter: MoveFilter = {
      damageClass: this.damageClassFilter() ?? undefined,
      type: this.typeFilter() ?? undefined,
      learnMethod: this.learnMethodFilter() ?? undefined,
      searchText: this.searchText() || undefined,
    };
    return filterMovepool(this.movepool(), filter);
  });

  protected clearFilters(): void {
    this.searchText.set('');
    this.damageClassFilter.set(null);
    this.typeFilter.set(null);
    this.learnMethodFilter.set(null);
  }

  /** FR-016/FR-017: un movimiento ya asignado a otra posición del mismo
   *  Pokémon aparece deshabilitado — nunca auto-intercambiado. */
  protected isAssignedElsewhere(entry: MoveLearnInfo): boolean {
    return this.moveIds().some((id, index) => id === entry.move.id && index !== this.activePosition());
  }

  /** Un movimiento ya asignado a ALGÚN slot del Pokémon (incluida la
   *  posición activa) se muestra como "Equipado" en vez de "+ Agregar". */
  protected isEquipped(entry: MoveLearnInfo): boolean {
    return this.moveIds().includes(entry.move.id);
  }
}
