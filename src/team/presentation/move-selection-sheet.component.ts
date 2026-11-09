import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import type { Move } from '../../pokemon/domain/value-objects/move';
import type { MoveSlots } from '../domain/value-objects/roster-entry';

/**
 * Selección de movimientos de un slot (FR-014) — 4 posiciones fijas, cada
 * una editable eligiendo de la lista de movimientos aprendibles
 * (`movepool`). Muestra `damageClass` de cada opción (data-model.md).
 */
@Component({
  selector: 'app-move-selection-sheet',
  standalone: true,
  imports: [MatListModule, MatButtonModule, MatIconModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-modal-overlay">
      <div
        class="app-modal-card"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'team.moveSelectionTitle' | transloco"
      >
        <header>
          <h2>{{ 'team.moveSelectionTitle' | transloco }}</h2>
          <button mat-icon-button type="button" [attr.aria-label]="'common.close' | transloco" (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        @for (moveId of moveIds(); track $index) {
          <p>
            {{ 'team.moveSlot' | transloco: { position: $index + 1 } }}:
            {{ moveId ?? '—' }}
          </p>
        }

        <mat-nav-list>
          @for (move of movepool(); track move.id) {
            <button mat-list-item type="button" (click)="selectMove.emit({ position: activePosition(), move })">
              <span matListItemTitle>{{ move.displayName }}</span>
              <span matListItemLine>{{ 'team.damageClass.' + move.damageClass | transloco }}</span>
            </button>
          }
        </mat-nav-list>
      </div>
    </div>
  `,
})
export class MoveSelectionSheetComponent {
  readonly moveIds = input.required<MoveSlots>();
  readonly movepool = input<readonly Move[]>([]);
  /** Qué posición (0-3) está eligiéndose ahora mismo. */
  readonly activePosition = input<0 | 1 | 2 | 3>(0);
  readonly selectMove = output<{ position: 0 | 1 | 2 | 3; move: Move | null }>();
  readonly close = output<void>();
}
