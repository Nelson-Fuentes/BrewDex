import type { PokemonType } from '../../../pokemon/domain/value-objects/pokemon-type';
import type { Generation } from '../../../game/domain/value-objects/generation';

/**
 * El criterio de búsqueda/filtro actual de la persona (FR-009), aplicado
 * en cliente sobre una lista ya obtenida.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class PokedexFilterCriteria {
  constructor(
    /** Coincidencia parcial, case-insensitive, contra el nombre. Vacío = sin filtro. */
    readonly searchText = '',
    /** `null` = sin filtro de tipo. */
    readonly type: PokemonType | null = null,
    /** `null` = sin filtro de generación. */
    readonly generation: Generation | null = null,
  ) {}

  /** `true` cuando ningún filtro está activo — toda entrada pasa. */
  get isEmpty(): boolean {
    return this.searchText === '' && this.type === null && this.generation === null;
  }

  withSearchText(searchText: string): PokedexFilterCriteria {
    return new PokedexFilterCriteria(searchText, this.type, this.generation);
  }

  withType(type: PokemonType | null): PokedexFilterCriteria {
    return new PokedexFilterCriteria(this.searchText, type, this.generation);
  }

  withGeneration(generation: Generation | null): PokedexFilterCriteria {
    return new PokedexFilterCriteria(this.searchText, this.type, generation);
  }
}
