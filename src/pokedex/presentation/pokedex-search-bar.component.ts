import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';

/** Búsqueda por nombre dentro de la Pokédex activa (FR-009). */
@Component({
  selector: 'app-pokedex-search-bar',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" style="width: 100%">
      <input
        matInput
        type="search"
        [ngModel]="searchText()"
        (ngModelChange)="searchTextChange.emit($event)"
        [placeholder]="'pokedex.searchPlaceholder' | transloco"
        [attr.aria-label]="'pokedex.searchPlaceholder' | transloco"
      />
    </mat-form-field>
  `,
})
export class PokedexSearchBarComponent {
  readonly searchText = input('');
  readonly searchTextChange = output<string>();
}
