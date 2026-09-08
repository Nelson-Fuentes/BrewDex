import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { GenerationFilterComponent } from './generation-filter.component';
import { Generation } from '../domain/value-objects/generation';

describe('GenerationFilterComponent', () => {
  it('crea el componente con las generaciones dadas', () => {
    TestBed.configureTestingModule({
      imports: [
        GenerationFilterComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: { game: { generationFilterLabel: 'Generation', generationFilterAll: 'All' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(GenerationFilterComponent);
    fixture.componentRef.setInput('generations', [new Generation('generation-i', 'Generation I')]);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
