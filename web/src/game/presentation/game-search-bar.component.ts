import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';

/** Búsqueda por nombre dentro del catálogo de juegos (FR-004). */
@Component({
  selector: 'app-game-search-bar',
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
        [placeholder]="'game.searchPlaceholder' | transloco"
        [attr.aria-label]="'game.searchPlaceholder' | transloco"
      />
    </mat-form-field>
  `,
})
export class GameSearchBarComponent {
  readonly searchText = input('');
  readonly searchTextChange = output<string>();
}
