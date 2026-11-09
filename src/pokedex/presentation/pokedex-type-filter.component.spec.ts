import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PokedexTypeFilterComponent } from './pokedex-type-filter.component';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

describe('PokedexTypeFilterComponent', () => {
  it('crea el componente con los tipos dados', () => {
    TestBed.configureTestingModule({
      imports: [
        PokedexTypeFilterComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: { pokedex: { typeFilterLabel: 'Type', typeFilterAll: 'All' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(PokedexTypeFilterComponent);
    fixture.componentRef.setInput('types', [new PokemonType('fire', 'Fire')]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
