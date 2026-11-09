import { InjectionToken } from '@angular/core';

import type { RosterReader } from '../../team/domain/ports/roster-reader';

/**
 * Token de inyección para el puerto cruzado `RosterReader` — mismo
 * patrón que `active-language-reader.token.ts`/`game-selection-reader.token.ts`.
 * La raíz de composición (`app.config.ts`) lo liga a `InMemoryTeamService`;
 * `game` solo ve el contrato (para advertir antes de un cambio de juego —
 * FR-016).
 */
export const ROSTER_READER = new InjectionToken<RosterReader>('RosterReader');
