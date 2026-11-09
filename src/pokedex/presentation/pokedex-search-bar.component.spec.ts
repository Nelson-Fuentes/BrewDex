import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PokedexSearchBarComponent } from './pokedex-search-bar.component';

describe('PokedexSearchBarComponent', () => {
  it('emite searchTextChange al escribir', () => {
    TestBed.configureTestingModule({
      imports: [
        PokedexSearchBarComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: { pokedex: { searchPlaceholder: 'Search' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(PokedexSearchBarComponent);
    fixture.detectChanges();

    const spy = jasmine.createSpy('searchTextChange');
    fixture.componentInstance.searchTextChange.subscribe(spy);

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'pikachu';
    input.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalledWith('pikachu');
  });
});
