/**
 * Caso de uso: aplicar la elección explícita de idioma de la persona
 * (FR-003) — efectivo de inmediato, solo para lo que dure la sesión
 * actual (FR-015, sin ningún almacenamiento involucrado).
 */
export function selectLanguage(languageCode: string, onLanguageSelected: (code: string) => void): void {
  onLanguageSelected(languageCode);
}
