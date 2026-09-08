import type { SupportedLanguage } from '../value-objects/supported-language';

/** Lanzado cuando el catálogo de idiomas no se puede obtener. */
export class LanguageCatalogUnavailable extends Error {
  constructor() {
    super('The supported language catalog could not be retrieved.');
    this.name = 'LanguageCatalogUnavailable';
  }
}

/**
 * Puerto (Hexagonal/Ports & Adapters) para obtener el catálogo completo de
 * {@link SupportedLanguage} (FR-002). Implementado por un adaptador de
 * infraestructura (`PokeApiSupportedLanguageCatalogService`); consumido
 * solo por `application/` de `language`.
 */
export interface SupportedLanguageCatalog {
  /**
   * El catálogo de idiomas oficiales vigente, en un orden estable y
   * presentable. Lanza {@link LanguageCatalogUnavailable} si no se puede
   * obtener — nunca devuelve una lista parcial en silencio.
   */
  fetchSupportedLanguages(): Promise<SupportedLanguage[]>;
}
