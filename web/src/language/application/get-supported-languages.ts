import type { SupportedLanguage } from '../domain/value-objects/supported-language';
import type { SupportedLanguageCatalog } from '../domain/ports/supported-language-catalog';

/**
 * Caso de uso: obtener el catálogo de idiomas soportados (FR-002). Delgado
 * por diseño — toda la lógica de dónde viene el catálogo vive detrás del
 * puerto {@link SupportedLanguageCatalog}.
 */
export function getSupportedLanguages(
  catalog: SupportedLanguageCatalog,
): Promise<SupportedLanguage[]> {
  return catalog.fetchSupportedLanguages();
}
