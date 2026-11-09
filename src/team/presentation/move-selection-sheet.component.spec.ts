import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MoveSelectionSheetComponent } from './move-selection-sheet.component';
import { Move } from '../../pokemon/domain/value-objects/move';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

const normal = new PokemonType('normal', 'Normal');
const tackle = new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...');

describe('MoveSelectionSheetComponent', () => {
  it('muestra el movepool y emite selectMove con la posición activa', () => {
    TestBed.configureTestingModule({
      imports: [
        MoveSelectionSheetComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              team: { moveSelectionTitle: 'Choose moves', moveSlot: 'Move {{position}}', damageClass: { physical: 'Physical' } },
              common: { close: 'Close' },
            },
          },
        }),
      ],
    });
    const fixture = TestBed.createComponent(MoveSelectionSheetComponent);
    fixture.componentRef.setInput('moveIds', [null, null, null, null]);
    fixture.componentRef.setInput('movepool', [tackle]);
    fixture.componentRef.setInput('activePosition', 0);
    fixture.detectChanges();

    const spy = jasmine.createSpy('selectMove');
    fixture.componentInstance.selectMove.subscribe(spy);
    fixture.nativeElement.querySelector('mat-nav-list button').click();

    expect(spy).toHaveBeenCalledWith({ position: 0, move: tackle });
  });
});
