/**
 * Una generación agrupa juegos tal como ya los categoriza la fuente
 * (el recurso `generation` de PokeAPI). No se inventa un esquema de
 * agrupación propio.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class Generation {
  constructor(
    /** Id estable (p. ej. el nombre de generación de PokeAPI, `"generation-i"`). */
    readonly id: string,
    /** Etiqueta legible usada en el filtro (p. ej. "Generation I"). */
    readonly label: string,
  ) {}

  /** Igualdad por `id` únicamente. */
  equals(other: Generation): boolean {
    return this.id === other.id;
  }
}
