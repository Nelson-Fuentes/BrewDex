import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@jsverse/transloco';

import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

/** Filtro por tipo dentro de la Pokédex activa (FR-009). `null` = todos
 *  los tipos. */
@Component({
  selector: 'app-pokedex-type-filter',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" style="width: 100%">
      <mat-label>{{ 'pokedex.typeFilterLabel' | transloco }}</mat-label>
      <mat-select [value]="selectedTypeId()" (selectionChange)="typeIdChange.emit($event.value)">
        <mat-option [value]="null">{{ 'pokedex.typeFilterAll' | transloco }}</mat-option>
        @for (type of types(); track type.id) {
          <mat-option [value]="type.id">{{ type.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class PokedexTypeFilterComponent {
  readonly types = input<readonly PokemonType[]>([]);
  readonly selectedTypeId = input<string | null>(null);
  readonly typeIdChange = output<string | null>();
}
