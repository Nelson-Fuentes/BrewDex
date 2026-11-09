import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import type { Move } from '../../pokemon/domain/value-objects/move';
import { TypeBadgeComponent } from '../../shared/design-system/type-badge.component';

/**
 * Interfaz única de un movimiento — usada tanto para un slot ocupado de
 * la tarjeta de personalización (`state: 'empty' | 'filled'`) como para
 * cada fila candidata del selector de movimientos (`state: 'selectable' |
 * 'disabled'`), garantizando que ambos lugares muestren exactamente los
 * mismos datos con el mismo diseño (FR-001, FR-002, FR-003, FR-006 —
 * contracts/move-slot-component.md).
 *
 * Componente presentacional puro: sin lógica de filtrado, movepool ni
 * estado de equipo — eso vive en `MoveSelectionSheetComponent` y en
 * `InMemoryTeamService`.
 */
@Component({
  selector: 'app-move-slot',
  standalone: true,
  imports: [TranslocoModule, TypeBadgeComponent, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (move(); as move) {
      <button
        type="button"
        class="app-move-slot app-move-slot--filled"
        [class.app-move-slot--disabled]="state() === 'disabled'"
        [disabled]="state() === 'disabled'"
        (click)="onActivate()"
      >
        <div class="app-move-slot__header">
          <app-type-badge [typeId]="move.type.id" [label]="move.type.label" />
          <span class="app-move-slot__name">{{ move.displayName }}</span>
          @if (state() === 'selectable' || state() === 'disabled') {
            <span class="app-move-slot__action">
              @if (equipped() || state() === 'disabled') {
                <span class="app-move-slot__equipped-badge">
                  <mat-icon>check</mat-icon>
                  {{ 'team.moveEquipped' | transloco }}
                </span>
              } @else {
                <span class="app-move-slot__add-badge">
                  <mat-icon>add</mat-icon>
                  {{ 'team.moveAdd' | transloco }}
                </span>
              }
            </span>
          }
        </div>

        <span class="app-move-slot__damage-class-chip app-move-slot__damage-class-chip--{{ move.damageClass }}">
          <span class="app-move-slot__damage-class-dot"></span>
          {{ 'team.damageClass.' + move.damageClass | transloco }}
        </span>

        <div class="app-move-slot__stats">
          <span class="app-move-slot__stat" [class.app-move-slot__stat--not-applicable]="move.power === null">
            {{ 'team.movePower' | transloco }}: {{ move.power !== null ? move.power : ('team.movePowerNotApplicable' | transloco) }}
          </span>
          <span class="app-move-slot__stat-sep">|</span>
          <span class="app-move-slot__stat" [class.app-move-slot__stat--not-applicable]="move.accuracy === null">
            {{ 'team.moveAccuracy' | transloco }}:
            {{ move.accuracy !== null ? move.accuracy + '%' : ('team.moveAccuracyNotApplicable' | transloco) }}
          </span>
          <span class="app-move-slot__stat-sep">|</span>
          <span class="app-move-slot__stat">{{ 'team.movePp' | transloco }}: {{ move.pp }}</span>
        </div>

        <span class="app-move-slot__description">{{ move.description }}</span>
      </button>
    } @else {
      <button type="button" class="app-move-slot app-move-slot--empty" (click)="onActivate()">
        {{ 'team.emptyMoveSlot' | transloco }}
      </button>
    }
  `,
  styles: `
    .app-move-slot {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--mat-sys-outline-variant, #ccc);
      border-radius: 12px;
      background: var(--mat-sys-surface, #fff);
      color: var(--mat-sys-on-surface, #000);
      text-align: left;
      cursor: pointer;
      font: inherit;
      transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    /* Hover en cualquier slot/opción tocable — tanto el slot ocupado/vacío
       de la tarjeta como cada fila candidata del selector, ya que ambos
       usan este mismo componente (FR-006). Excluido explícitamente para
       el estado disabled más abajo. */
    .app-move-slot:not(.app-move-slot--disabled):hover {
      background: var(--mat-sys-surface-variant, #f0f0f5);
      border-color: var(--mat-sys-primary, #5b3df6);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }
    .app-move-slot--empty {
      align-items: center;
      justify-content: center;
      color: var(--mat-sys-on-surface-variant, #666);
      font-style: italic;
    }
    .app-move-slot--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .app-move-slot__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .app-move-slot__name {
      font-weight: 700;
      flex: 1 1 auto;
    }
    .app-move-slot__action {
      flex: 0 0 auto;
    }
    .app-move-slot__equipped-badge,
    .app-move-slot__add-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .app-move-slot__equipped-badge {
      background: var(--mat-sys-primary, #5b3df6);
      color: var(--mat-sys-on-primary, #fff);
    }
    .app-move-slot__add-badge {
      border: 1px solid var(--mat-sys-outline, #9e9e9e);
      color: var(--mat-sys-primary, #5b3df6);
    }
    .app-move-slot__equipped-badge mat-icon,
    .app-move-slot__add-badge mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
    .app-move-slot__damage-class-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      width: fit-content;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .app-move-slot__damage-class-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .app-move-slot__damage-class-chip--physical {
      color: #c0392b;
    }
    .app-move-slot__damage-class-chip--special {
      color: #2980b9;
    }
    .app-move-slot__damage-class-chip--status {
      color: #7f8c8d;
    }
    .app-move-slot__stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .app-move-slot__stat-sep {
      color: var(--mat-sys-outline-variant, #ccc);
    }
    .app-move-slot__description {
      font-size: 0.85em;
      color: var(--mat-sys-on-surface-variant, #666);
    }
  `,
})
export class MoveSlotComponent {
  /** `null` = slot/opción vacía. */
  readonly move = input<Move | null>(null);
  /** Nivel asociado, mostrado cuando el contexto filtra por método `'level'`. */
  readonly levelLearnedAt = input<number | null>(null);
  /** `'empty'`/`'filled'`: uso en la tarjeta. `'selectable'`/`'disabled'`: uso en el selector. */
  readonly state = input<'empty' | 'filled' | 'selectable' | 'disabled'>('empty');
  /** Solo relevante en el selector (`state: 'selectable'`): el movimiento
   *  ya está asignado a ALGÚN slot del Pokémon (incluida la posición que
   *  se está editando ahora mismo) — se muestra como "Equipado" en vez de
   *  "+ Agregar". `state: 'disabled'` siempre se ve como "Equipado"
   *  independientemente de este input (está asignado a OTRO slot). */
  readonly equipped = input(false);
  readonly activate = output<void>();

  protected onActivate(): void {
    if (this.state() === 'disabled') {
      return;
    }
    this.activate.emit();
  }
}
