import { InjectionToken } from '@angular/core';

import type { PokemonRepository } from '../../pokemon/domain/ports/pokemon-repository';

/**
 * Token de inyección para el puerto `PokemonRepository` — mismo patrón
 * que los demás en `shared/tokens/`. `pokedex` y `team` lo consumen para
 * resolver detalle de especie sin importar la infraestructura concreta
 * de `pokemon` directamente (Constitución Principio VI).
 */
export const POKEMON_REPOSITORY = new InjectionToken<PokemonRepository>('PokemonRepository');
