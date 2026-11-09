import { InjectionToken } from '@angular/core';

import type { GameSelectionReader } from '../../game/domain/ports/game-selection-reader';

/**
 * Token de inyección para el puerto cruzado `GameSelectionReader` — mismo
 * patrón que `active-language-reader.token.ts`. La raíz de composición
 * (`app.config.ts`) lo liga a `InMemoryGameService`; `pokedex`/`team`
 * solo ven el contrato.
 */
export const GAME_SELECTION_READER = new InjectionToken<GameSelectionReader>('GameSelectionReader');
