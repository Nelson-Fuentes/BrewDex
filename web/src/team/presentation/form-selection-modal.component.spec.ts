import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { FormSelectionModalComponent } from './form-selection-modal.component';
import { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';

const normal = new PokemonType('normal', 'Normal');
const stats = new PokemonStats(1, 1, 1, 1, 1, 1);
const form = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, normal, null, stats);

describe('FormSelectionModalComponent', () => {
  it('lista las formas y emite select al elegir una', () => {
    TestBed.configureTestingModule({
      imports: [
        FormSelectionModalComponent,
        TranslocoTestingModule.forRoot({ langs: { en: { team: { formSelectionTitle: 'Choose a form' }, common: { close: 'Close' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(FormSelectionModalComponent);
    fixture.componentRef.setInput('forms', [form]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Heat Rotom');

    const spy = jasmine.createSpy('select');
    fixture.componentInstance.select.subscribe(spy);
    fixture.nativeElement.querySelector('mat-nav-list button').click();

    expect(spy).toHaveBeenCalledWith(form);
  });
});
