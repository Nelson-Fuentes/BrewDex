import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import type { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';

/**
 * Selector de forma/variante para el slot activo (FR-013) — solo formas
 * tipo `'template'`; Mega/Gigamax se activan por separado (botones
 * dedicados en `TeamBuilderPage`, no acá).
 */
@Component({
  selector: 'app-form-selection-modal',
  standalone: true,
  imports: [MatListModule, MatButtonModule, MatIconModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-modal-overlay">
      <div
        class="app-modal-card"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'team.formSelectionTitle' | transloco"
      >
        <header>
          <h2>{{ 'team.formSelectionTitle' | transloco }}</h2>
          <button mat-icon-button type="button" [attr.aria-label]="'common.close' | transloco" (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </header>
        <mat-nav-list>
          @for (form of forms(); track form.varietyId) {
            <button mat-list-item type="button" (click)="select.emit(form)">
              <span matListItemTitle>{{ form.displayName }}</span>
            </button>
          }
        </mat-nav-list>
      </div>
    </div>
  `,
})
export class FormSelectionModalComponent {
  readonly forms = input<readonly SelectableForm[]>([]);
  readonly select = output<SelectableForm>();
  readonly close = output<void>();
}
