import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DlcToggleListComponent } from './dlc-toggle-list.component';
import { GameDlc } from '../domain/value-objects/game-dlc';

describe('DlcToggleListComponent', () => {
  it('no renderiza nada cuando no hay DLC', () => {
    TestBed.configureTestingModule({
      imports: [DlcToggleListComponent, NoopAnimationsModule, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
    });
    const fixture = TestBed.createComponent(DlcToggleListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset')).toBeNull();
  });

  it('emite toggle con el id del DLC clickeado', () => {
    TestBed.configureTestingModule({
      imports: [
        DlcToggleListComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: { game: { dlcSectionTitle: 'Expansions' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(DlcToggleListComponent);
    fixture.componentRef.setInput('dlcs', [new GameDlc('the-isle-of-armor', 'The Isle of Armor')]);
    fixture.detectChanges();

    const spy = jasmine.createSpy('toggleDlc');
    fixture.componentInstance.toggleDlc.subscribe(spy);
    fixture.nativeElement.querySelector('mat-slide-toggle button').click();

    expect(spy).toHaveBeenCalledWith('the-isle-of-armor');
  });
});
