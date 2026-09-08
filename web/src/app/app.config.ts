import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { ACTIVE_LANGUAGE_READER } from '../shared/tokens/active-language-reader.token';
import { InMemoryActiveLanguageService } from '../language/infrastructure/in-memory-active-language.service';
import { GAME_SELECTION_READER } from '../shared/tokens/game-selection-reader.token';
import { InMemoryGameService } from '../game/infrastructure/in-memory-game.service';
import { ROSTER_READER } from '../shared/tokens/roster-reader.token';
import { InMemoryTeamService } from '../team/infrastructure/in-memory-team.service';
import { POKEDEX_DETAILS_READER } from '../shared/tokens/pokedex-details-reader.token';
import { InMemoryPokedexService } from '../pokedex/infrastructure/in-memory-pokedex.service';
import { POKEMON_REPOSITORY } from '../shared/tokens/pokemon-repository.token';
import { PokeApiPokemonRepositoryService } from '../pokemon/infrastructure/pokeapi-pokemon-repository.service';
import { MOVEPOOL_REPOSITORY } from '../shared/tokens/movepool-repository.token';
import { PokeApiMovepoolRepositoryService } from '../pokemon/infrastructure/pokeapi-movepool-repository.service';

/**
 * Raíz de composición (exenta de las reglas de import-boundaries, ver
 * eslint.config.js) — el único lugar que liga un puerto cruzado entre
 * módulos (`ACTIVE_LANGUAGE_READER`) a su implementación concreta, igual
 * que `AppDependencies` en la versión Flutter.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(),
    provideTransloco({
      // FR-002: los mismos 8 idiomas ya localizados en la versión Flutter.
      config: {
        availableLangs: ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'],
        defaultLang: 'en',
        fallbackLang: 'en',
        // FR-018: cualquier clave sin traducir en el idioma activo cae a
        // inglés en vez de mostrarse rota o en blanco.
        missingHandler: { useFallbackTranslation: true },
        // FR-003: cambiar de idioma durante la sesión reactualiza la UI
        // de inmediato, sin recargar la página.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    { provide: ACTIVE_LANGUAGE_READER, useExisting: InMemoryActiveLanguageService },
    { provide: GAME_SELECTION_READER, useExisting: InMemoryGameService },
    { provide: ROSTER_READER, useExisting: InMemoryTeamService },
    { provide: POKEDEX_DETAILS_READER, useExisting: InMemoryPokedexService },
    { provide: POKEMON_REPOSITORY, useExisting: PokeApiPokemonRepositoryService },
    { provide: MOVEPOOL_REPOSITORY, useExisting: PokeApiMovepoolRepositoryService },
  ],
};
