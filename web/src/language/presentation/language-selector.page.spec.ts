import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { LanguageSelectorPage } from './language-selector.page';
import { InMemoryActiveLanguageService } from '../infrastructure/in-memory-active-language.service';
import { SupportedLanguage } from '../domain/value-objects/supported-language';

describe('LanguageSelectorPage', () => {
  let fixture: ComponentFixture<LanguageSelectorPage>;
  let languageServiceStub: {
    status: () => string;
    supportedLanguages: () => SupportedLanguage[];
    activeLanguageCode: () => string;
    selectLanguage: jasmine.Spy;
    load: jasmine.Spy;
  };

  beforeEach(() => {
    languageServiceStub = {
      status: () => 'ready',
      supportedLanguages: () => [new SupportedLanguage('en', 'English'), new SupportedLanguage('es', 'Español')],
      activeLanguageCode: () => 'en',
      selectLanguage: jasmine.createSpy('selectLanguage'),
      load: jasmine.createSpy('load'),
    };

    TestBed.configureTestingModule({
      imports: [LanguageSelectorPage, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [
        provideRouter([]),
        { provide: InMemoryActiveLanguageService, useValue: languageServiceStub },
      ],
    });
    fixture = TestBed.createComponent(LanguageSelectorPage);
  });

  it('lista los idiomas soportados cuando status es "ready"', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('English');
    expect(text).toContain('Español');
  });

  it('no muestra ningún botón "Continuar" separado (FR-002)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-actions')).toBeNull();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // Solo un botón por idioma listado (las filas de app-language-option-tile) — ningún botón extra de acción.
    expect(buttons.length).toBe(languageServiceStub.supportedLanguages().length);
  });

  it('navega a /juego inmediatamente al elegir un idioma (FR-002)', () => {
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigateByUrl');

    const tile = fixture.nativeElement.querySelector('app-language-option-tile');
    tile.querySelector('button').click();

    expect(languageServiceStub.selectLanguage).toHaveBeenCalledWith('en');
    expect(navigateSpy).toHaveBeenCalledWith('/juego');
  });

  it('no muestra ningún control para volver (es el primer paso, FR-005)', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('arrow_back');
  });
});
