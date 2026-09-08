/**
 * Un idioma seleccionable — una opción "oficial" de PokeAPI, colapsada a
 * una sola entrada por idioma humano (research.md item histórico: `ja`/
 * `ja-Hrkt` se colapsan en una sola entrada `ja`).
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class SupportedLanguage {
  constructor(
    /** Código oficial de idioma de PokeAPI (p. ej. `"es"`, `"zh-Hans"`) —
     *  usado para pedir contenido localizado. Clave de identidad/igualdad. */
    readonly code: string,
    /** Nombre visible en el selector — nunca el código crudo (FR-002). */
    readonly displayName: string,
  ) {
    if (!code) {
      throw new Error('SupportedLanguage.code must not be empty');
    }
    if (!displayName) {
      throw new Error('SupportedLanguage.displayName must not be empty');
    }
  }

  /** Igualdad por `code` únicamente — dos instancias con el mismo código
   *  representan el mismo idioma aunque `displayName` difiera. */
  equals(other: SupportedLanguage): boolean {
    return this.code === other.code;
  }
}
