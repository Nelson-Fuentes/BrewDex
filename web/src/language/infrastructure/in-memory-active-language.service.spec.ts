import { TestBed } from '@angular/core/testing';

import { InMemoryActiveLanguageService } from './in-memory-active-language.service';
import { PokeApiSupportedLanguageCatalogService } from './pokeapi-supported-language-catalog.service';
import { BrowserDeviceLocaleProviderService } from './browser-device-locale-provider.service';
import { SupportedLanguage } from '../domain/value-objects/supported-language';

describe('InMemoryActiveLanguageService', () => {
  function setup(languages: SupportedLanguage[], deviceLanguageCode: string) {
    TestBed.configureTestingModule({
      providers: [
        InMemoryActiveLanguageService,
        {
          provide: PokeApiSupportedLanguageCatalogService,
          useValue: { fetchSupportedLanguages: () => Promise.resolve(languages) },
        },
        {
          provide: BrowserDeviceLocaleProviderService,
          useValue: { currentDeviceLanguageCode: () => deviceLanguageCode },
        },
      ],
    });
    return TestBed.inject(InMemoryActiveLanguageService);
  }

  it('resuelve el idioma del dispositivo cuando está soportado, y expone status "ready"', async () => {
    const service = setup(
      [new SupportedLanguage('en', 'English'), new SupportedLanguage('es', 'Español')],
      'es',
    );

    await service.load();

    expect(service.status()).toBe('ready');
    expect(service.currentLanguageCode()).toBe('es');
    expect(service.supportedLanguages().length).toBe(2);
  });

  it('emite onLanguageChanged al seleccionar explícitamente un idioma (FR-003)', async () => {
    const service = setup([new SupportedLanguage('en', 'English')], 'en');
    await service.load();

    const emitted: string[] = [];
    service.onLanguageChanged().subscribe((code) => emitted.push(code));

    service.selectLanguage('fr');

    expect(service.currentLanguageCode()).toBe('fr');
    expect(emitted).toEqual(['fr']);
  });

  it('expone status "error" cuando el catálogo falla, sin romper', async () => {
    TestBed.configureTestingModule({
      providers: [
        InMemoryActiveLanguageService,
        {
          provide: PokeApiSupportedLanguageCatalogService,
          useValue: { fetchSupportedLanguages: () => Promise.reject(new Error('down')) },
        },
        {
          provide: BrowserDeviceLocaleProviderService,
          useValue: { currentDeviceLanguageCode: () => 'en' },
        },
      ],
    });
    const service = TestBed.inject(InMemoryActiveLanguageService);

    await service.load();

    expect(service.status()).toBe('error');
  });
});
