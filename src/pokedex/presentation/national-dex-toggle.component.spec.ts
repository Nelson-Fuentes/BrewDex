import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NationalDexToggleComponent } from './national-dex-toggle.component';

describe('NationalDexToggleComponent', () => {
  it('emite useNationalDexChange al cambiar', () => {
    TestBed.configureTestingModule({
      imports: [
        NationalDexToggleComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: { pokedex: { nationalDexToggle: 'National Dex' } } } }),
      ],
    });
    const fixture = TestBed.createComponent(NationalDexToggleComponent);
    fixture.detectChanges();

    const spy = jasmine.createSpy('useNationalDexChange');
    fixture.componentInstance.useNationalDexChange.subscribe(spy);
    fixture.nativeElement.querySelector('button').click();

    expect(spy).toHaveBeenCalledWith(true);
  });
});
