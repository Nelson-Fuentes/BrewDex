import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoModule } from '@jsverse/transloco';

/** Alterna entre la Pokédex regional y la nacional cuando el juego activo
 *  es elegible (FR-004, FR-017). */
@Component({
  selector: 'app-national-dex-toggle',
  standalone: true,
  imports: [MatSlideToggleModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-slide-toggle [checked]="useNationalDex()" (change)="useNationalDexChange.emit($event.checked)">
      {{ 'pokedex.nationalDexToggle' | transloco }}
    </mat-slide-toggle>
  `,
})
export class NationalDexToggleComponent {
  readonly useNationalDex = input(false);
  readonly useNationalDexChange = output<boolean>();
}
