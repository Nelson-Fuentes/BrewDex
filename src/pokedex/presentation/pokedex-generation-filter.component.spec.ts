import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PokedexGenerationFilterComponent } from './pokedex-generation-filter.component';
import { Generation } from '../../game/domain/value-objects/generation';

describe('PokedexGenerationFilterComponent', () => {
  it('crea el componente con las generaciones dadas', () => {
    TestBed.configureTestingModule({
      imports: [
        PokedexGenerationFilterComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en: { pokedex: { generationFilterLabel: 'Generation', generationFilterAll: 'All generations' } } },
        }),
      ],
    });
    const fixture = TestBed.createComponent(PokedexGenerationFilterComponent);
    fixture.componentRef.setInput('generations', [new Generation('generation-viii', 'VIII')]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('emite el id de generación seleccionado (020)', () => {
    TestBed.configureTestingModule({
      imports: [
        PokedexGenerationFilterComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en: { pokedex: { generationFilterLabel: 'Generation', generationFilterAll: 'All generations' } } },
        }),
      ],
    });
    const fixture = TestBed.createComponent(PokedexGenerationFilterComponent);
    fixture.componentRef.setInput('generations', [new Generation('generation-viii', 'VIII')]);
    fixture.detectChanges();

    const spy = jasmine.createSpy('generationIdChange');
    fixture.componentInstance.generationIdChange.subscribe(spy);
    fixture.componentInstance.generationIdChange.emit('generation-viii');

    expect(spy).toHaveBeenCalledWith('generation-viii');
  });
});
