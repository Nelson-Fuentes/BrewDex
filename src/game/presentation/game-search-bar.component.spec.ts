import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { GameSearchBarComponent } from './game-search-bar.component';

describe('GameSearchBarComponent', () => {
  it('emite searchTextChange al escribir', () => {
    TestBed.configureTestingModule({
      imports: [
        GameSearchBarComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: { game: { searchPlaceholder: 'Search' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(GameSearchBarComponent);
    fixture.detectChanges();

    const spy = jasmine.createSpy('searchTextChange');
    fixture.componentInstance.searchTextChange.subscribe(spy);

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'sword';
    input.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalledWith('sword');
  });
});
