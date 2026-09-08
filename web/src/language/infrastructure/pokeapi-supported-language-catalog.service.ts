import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { SupportedLanguage } from '../domain/value-objects/supported-language';
import {
  LanguageCatalogUnavailable,
  type SupportedLanguageCatalog,
} from '../domain/ports/supported-language-catalog';
import { LoggingService } from '../../shared/logging/logging.service';
import { logAndRethrow } from '../../shared/logging/http-error-mapping';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

/**
 * Los 8 idiomas que FR-002 exige, con su código exacto de PokeAPI y su
 * autónimo (nombre de ese idioma en sí mismo — el patrón estándar de
 * cualquier selector de idioma). `official: true` en PokeAPI no alcanza
 * para la curación de códigos, y PokeAPI tampoco publica autónimos (solo
 * traduce el nombre de un idioma a `en`/`es`/`it`/`pt-br`/`es-419`) — ver
 * research.md Decisión 14. Ambas tablas son hand-maintained a propósito,
 * el mismo patrón ya usado para otras brechas de modelado de PokeAPI
 * (Decisión 4).
 */
const SUPPORTED_LANGUAGES: readonly { pokeApiCode: string; displayCode: string; autonym: string }[] = [
  { pokeApiCode: 'en', displayCode: 'en', autonym: 'English' },
  { pokeApiCode: 'es', displayCode: 'es', autonym: 'Español' },
  { pokeApiCode: 'fr', displayCode: 'fr', autonym: 'Français' },
  { pokeApiCode: 'de', displayCode: 'de', autonym: 'Deutsch' },
  { pokeApiCode: 'it', displayCode: 'it', autonym: 'Italiano' },
  { pokeApiCode: 'ja', displayCode: 'ja', autonym: '日本語' },
  { pokeApiCode: 'ko', displayCode: 'ko', autonym: '한국어' },
  { pokeApiCode: 'zh-hans', displayCode: 'zh', autonym: '中文' },
];

interface PokeApiLanguageResource {
  readonly name: string;
}

/**
 * Implementa {@link SupportedLanguageCatalog} contra el recurso `language`
 * de PokeAPI (contracts/language-catalog.md). Único lugar de la
 * infraestructura que conoce la forma de esa respuesta (Constitución
 * Principio VI).
 */
@Injectable({ providedIn: 'root' })
export class PokeApiSupportedLanguageCatalogService implements SupportedLanguageCatalog {
  private readonly http = inject(HttpClient);
  private readonly logging = inject(LoggingService);

  async fetchSupportedLanguages(): Promise<SupportedLanguage[]> {
    try {
      // Se confirma que cada idioma sigue existiendo en PokeAPI (FR-017:
      // un fallo acá dispara el mensaje de error + reintento), aunque el
      // nombre a mostrar viene de la tabla local, no de la respuesta.
      await Promise.all(
        SUPPORTED_LANGUAGES.map(({ pokeApiCode }) =>
          firstValueFrom(
            this.http.get<PokeApiLanguageResource>(`${POKEAPI_BASE_URL}language/${pokeApiCode}/`),
          ),
        ),
      );
      return SUPPORTED_LANGUAGES.map(
        ({ displayCode, autonym }) => new SupportedLanguage(displayCode, autonym),
      );
    } catch (error) {
      return logAndRethrow(
        this.logging,
        'PokeApiSupportedLanguageCatalogService',
        error,
        () => new LanguageCatalogUnavailable(),
      );
    }
  }
}
