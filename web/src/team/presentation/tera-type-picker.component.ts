import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@jsverse/transloco';

import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

/** Selector de Tipo Tera (Escarlata/Púrpura únicamente, contracts/pokemon.md). */
@Component({
  selector: 'app-tera-type-picker',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ 'team.teraTypeTitle' | transloco }}</mat-label>
      <mat-select [value]="selectedTypeId()" (selectionChange)="selectType.emit(typeById($event.value))">
        @for (type of types(); track type.id) {
          <mat-option [value]="type.id">{{ type.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class TeraTypePickerComponent {
  readonly types = input<readonly PokemonType[]>([]);
  readonly selectedTypeId = input<string | null>(null);
  readonly selectType = output<PokemonType | null>();

  protected typeById(id: string | null): PokemonType | null {
    return this.types().find((type) => type.id === id) ?? null;
  }
}
