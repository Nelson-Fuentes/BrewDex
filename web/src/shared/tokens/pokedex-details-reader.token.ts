import { InjectionToken } from '@angular/core';

import type { PokedexDetailsReader } from '../../pokedex/domain/ports/pokedex-details-reader';

/**
 * Token de inyección para el puerto cruzado `PokedexDetailsReader` —
 * mismo patrón que los demás en `shared/tokens/`. La raíz de composición
 * (`app.config.ts`) lo liga a `InMemoryPokedexService`; `team` solo ve el
 * contrato.
 */
export const POKEDEX_DETAILS_READER = new InjectionToken<PokedexDetailsReader>('PokedexDetailsReader');
