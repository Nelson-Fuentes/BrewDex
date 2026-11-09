import type { Observable } from 'rxjs';

/**
 * **Contrato cruzado entre módulos.** Este es el único tipo de `language`
 * que la `application`/`presentation` de otro módulo puede importar
 * (Constitución Principio VI — un módulo no filtra su modelo interno a
 * otro; ver eslint.config.js). `game` (`GetGameCatalog`) y `pokemon`/
 * `pokedex` son sus consumidores.
 */
export interface ActiveLanguageReader {
  /**
   * El código de idioma vigente. Siempre válido y no vacío — resuelto
   * (default o explícito) antes de que cualquier consumidor pueda
   * observar un valor, per FR-003.
   */
  currentLanguageCode(): string;

  /**
   * Emite un nuevo código cada vez que cambia (tras una selección
   * explícita completada — FR-003). No emite el valor actual al
   * suscribirse; quien necesite el valor actual de inmediato debe llamar
   * primero a {@link currentLanguageCode}.
   */
  onLanguageChanged(): Observable<string>;
}
