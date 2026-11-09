import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoModule } from '@jsverse/transloco';

import type { GameDlc } from '../domain/value-objects/game-dlc';

/** Lista de expansiones/DLC activables del juego elegido (FR-006). Vacía
 *  cuando el juego no tiene ninguna. */
@Component({
  selector: 'app-dlc-toggle-list',
  standalone: true,
  imports: [MatSlideToggleModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dlcs().length > 0) {
      <fieldset>
        <legend>{{ 'game.dlcSectionTitle' | transloco }}</legend>
        @for (dlc of dlcs(); track dlc.id) {
          <mat-slide-toggle
            [checked]="activeDlcIds().has(dlc.id)"
            (change)="toggleDlc.emit(dlc.id)"
          >
            {{ dlc.displayName }}
          </mat-slide-toggle>
        }
      </fieldset>
    }
  `,
})
export class DlcToggleListComponent {
  readonly dlcs = input<readonly GameDlc[]>([]);
  readonly activeDlcIds = input<ReadonlySet<string>>(new Set());
  readonly toggleDlc = output<string>();
}
