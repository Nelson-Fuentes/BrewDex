import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@jsverse/transloco';

import type { Generation } from '../../game/domain/value-objects/generation';

/** Filtro por generación dentro de la Pokédex activa (020) — una forma
 *  introducida más tarde que su especie (p. ej. una regional) cuenta
 *  como de la generación en que se introdujo, no la de la especie
 *  original (`PokedexEntry.introducedGeneration`, ver
 *  `pokeapi-pokemon-repository.service.ts`). `null` = todas las
 *  generaciones. */
@Component({
  selector: 'app-pokedex-generation-filter',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" style="width: 100%">
      <mat-label>{{ 'pokedex.generationFilterLabel' | transloco }}</mat-label>
      <mat-select [value]="selectedGenerationId()" (selectionChange)="generationIdChange.emit($event.value)">
        <mat-option [value]="null">{{ 'pokedex.generationFilterAll' | transloco }}</mat-option>
        @for (generation of generations(); track generation.id) {
          <mat-option [value]="generation.id">{{ generation.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class PokedexGenerationFilterComponent {
  readonly generations = input<readonly Generation[]>([]);
  readonly selectedGenerationId = input<string | null>(null);
  readonly generationIdChange = output<string | null>();
}
