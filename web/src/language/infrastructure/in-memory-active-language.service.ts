import { Injectable, inject, signal } from '@angular/core';
import { Subject, type Observable } from 'rxjs';

import type { ActiveLanguageReader } from '../domain/ports/active-language-reader';
import type { SupportedLanguage } from '../domain/value-objects/supported-language';
import { getSupportedLanguages } from '../application/get-supported-languages';
import { getActiveLanguage, DEFAULT_LANGUAGE_CODE } from '../application/get-active-language';
import { selectLanguage } from '../application/select-language';
import { PokeApiSupportedLanguageCatalogService } from './pokeapi-supported-language-catalog.service';
import { BrowserDeviceLocaleProviderService } from './browser-device-locale-provider.service';

export type LanguageLoadStatus = 'loading' | 'ready' | 'error';

/**
 * Implementa {@link ActiveLanguageReader} y expone la API de aplicación
 * `LanguageStore` (contracts/language-catalog.md) como signals — el
 * reemplazo de `LanguageSelectionCubit`. Estado en memoria únicamente: no
 * hay ningún almacenamiento involucrado (FR-015); cada instancia arranca
 * en `status: 'loading'` y resuelve el idioma activo desde cero.
 */
@Injectable({ providedIn: 'root' })
export class InMemoryActiveLanguageService implements ActiveLanguageReader {
  private readonly catalog = inject(PokeApiSupportedLanguageCatalogService);
  private readonly deviceLocaleProvider = inject(BrowserDeviceLocaleProviderService);

  private readonly statusSignal = signal<LanguageLoadStatus>('loading');
  private readonly supportedLanguagesSignal = signal<readonly SupportedLanguage[]>([]);
  private readonly activeLanguageCodeSignal = signal<string>(DEFAULT_LANGUAGE_CODE);
  private readonly languageChanged = new Subject<string>();

  readonly status = this.statusSignal.asReadonly();
  readonly supportedLanguages = this.supportedLanguagesSignal.asReadonly();
  readonly activeLanguageCode = this.activeLanguageCodeSignal.asReadonly();

  constructor() {
    void this.load();
  }

  /** Vuelve a intentar cargar el catálogo tras un fallo (FR-017). */
  async load(): Promise<void> {
    this.statusSignal.set('loading');
    try {
      const languages = await getSupportedLanguages(this.catalog);
      this.supportedLanguagesSignal.set(languages);
      this.activeLanguageCodeSignal.set(getActiveLanguage(this.deviceLocaleProvider, languages));
      this.statusSignal.set('ready');
    } catch {
      this.statusSignal.set('error');
    }
  }

  /** FR-003: efectivo de inmediato, para el resto de la sesión. */
  selectLanguage(languageCode: string): void {
    selectLanguage(languageCode, (code) => {
      this.activeLanguageCodeSignal.set(code);
      this.languageChanged.next(code);
    });
  }

  currentLanguageCode(): string {
    return this.activeLanguageCodeSignal();
  }

  onLanguageChanged(): Observable<string> {
    return this.languageChanged.asObservable();
  }
}
