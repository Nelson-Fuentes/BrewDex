import { InjectionToken } from '@angular/core';

import type { MovepoolRepository } from '../../pokemon/domain/ports/movepool-repository';

/**
 * Token de inyección para el puerto `MovepoolRepository` — mismo patrón
 * que los demás en `shared/tokens/`. `team` lo consume para resolver el
 * moveset por defecto/movepool sin importar la infraestructura concreta
 * de `pokemon` directamente (Constitución Principio VI).
 */
export const MOVEPOOL_REPOSITORY = new InjectionToken<MovepoolRepository>('MovepoolRepository');
