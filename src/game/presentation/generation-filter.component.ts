import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@jsverse/transloco';

import type { Generation } from '../domain/value-objects/generation';

/** Filtro por generación del catálogo de juegos (FR-004). `null` en la
 *  selección significa "todas las generaciones". */
@Component({
  selector: 'app-generation-filter',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" style="width: 100%">
      <mat-label>{{ 'game.generationFilterLabel' | transloco }}</mat-label>
      <mat-select
        [value]="selectedGenerationId()"
        (selectionChange)="generationIdChange.emit($event.value)"
      >
        <mat-option [value]="null">{{ 'game.generationFilterAll' | transloco }}</mat-option>
        @for (generation of generations(); track generation.id) {
          <mat-option [value]="generation.id">{{ generation.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class GenerationFilterComponent {
  readonly generations = input<readonly Generation[]>([]);
  readonly selectedGenerationId = input<string | null>(null);
  readonly generationIdChange = output<string | null>();
}
