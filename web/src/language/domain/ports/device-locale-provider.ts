/**
 * Puerto para leer el idioma actual del navegador, usado para resolver el
 * default de FR-003 cuando aún no hay una selección explícita en la
 * sesión. Implementado por `BrowserDeviceLocaleProviderService`; consumido
 * solo por `application/` de `language`.
 *
 * Sin conocimiento de Angular por diseño (Constitución Principio VI):
 * devuelve un código con forma PokeAPI (ya resolviendo sutilezas como el
 * split `zh-Hans`/`zh-Hant` de chino), no un objeto de i18n del navegador.
 */
export interface DeviceLocaleProvider {
  /**
   * El idioma actual del navegador como código con forma PokeAPI (p. ej.
   * `"es"`, `"zh-Hans"`) — no necesariamente uno que esté en el catálogo
   * de idiomas soportados; quien llama es responsable de verificarlo.
   */
  currentDeviceLanguageCode(): string;
}
