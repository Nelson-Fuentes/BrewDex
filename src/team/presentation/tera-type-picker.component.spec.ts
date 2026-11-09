import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TeraTypePickerComponent } from './tera-type-picker.component';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

describe('TeraTypePickerComponent', () => {
  it('crea el componente con los tipos dados', () => {
    TestBed.configureTestingModule({
      imports: [
        TeraTypePickerComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: { team: { teraTypeTitle: 'Tera Type' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(TeraTypePickerComponent);
    fixture.componentRef.setInput('types', [new PokemonType('fire', 'Fire')]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
