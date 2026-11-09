/**
 * Un tipo que un Pokémon puede tener como tipo 1 o tipo 2. Enumeración
 * pequeña, estable y provista por la fuente, con etiqueta localizada.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class PokemonType {
  constructor(
    /** Id estable (p. ej. el nombre de tipo de PokeAPI, `"rock"`). */
    readonly id: string,
    /** Etiqueta localizada usada en el filtro de tipo (p. ej. "Rock"). */
    readonly label: string,
    /** Id numérico propio de PokeAPI — el repositorio de íconos de tipo de
     *  `github.com/PokeAPI/sprites` nombra sus archivos por este número,
     *  no por `id`. `0` cuando no se resolvió (nunca un id real). */
    readonly numericId = 0,
  ) {}

  /** Igualdad por `id` únicamente. */
  equals(other: PokemonType): boolean {
    return this.id === other.id;
  }
}
