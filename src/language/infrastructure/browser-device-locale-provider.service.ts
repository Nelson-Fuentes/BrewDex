import { Injectable } from '@angular/core';

import type { DeviceLocaleProvider } from '../domain/ports/device-locale-provider';

/**
 * Implementa {@link DeviceLocaleProvider} leyendo `navigator.language`
 * (contracts/language-catalog.md) y normalizándolo a la forma de código
 * que el catálogo de idiomas soportados usa (p. ej. `"es-AR"` → `"es"`,
 * cualquier variante de chino → `"zh"` — el mismo colapso que
 * `PokeApiSupportedLanguageCatalogService` ya aplica del lado del
 * catálogo, research.md Decisión 14).
 */
@Injectable({ providedIn: 'root' })
export class BrowserDeviceLocaleProviderService implements DeviceLocaleProvider {
  currentDeviceLanguageCode(): string {
    const raw = typeof navigator !== 'undefined' ? navigator.language : 'en';
    const baseSubtag = raw.split('-')[0].toLowerCase();
    return baseSubtag === 'zh' ? 'zh' : baseSubtag;
  }
}
