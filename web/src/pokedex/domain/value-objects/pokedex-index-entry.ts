import type { PokedexEntrySource } from './pokedex-entry-source';

/**
 * La proyección barata, solo-orden, de una entrada de Pokédex — sin
 * llamada HTTP por especie. El resto del detalle (sprites, tipos,
 * formas...) lo resuelve `PokemonRepository` (módulo `pokemon`) por
 * separado y bajo demanda.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class PokedexIndexEntry {
  constructor(
    /** Misma identidad que `PokedexEntry.pokemonId`/`RosterEntry.pokemonId`. */
    readonly pokemonId: string,
    /** Regional o nacional según la vista activa. */
    readonly pokedexNumber: number,
    readonly sourceTag: PokedexEntrySource,
  ) {}

  /** Igualdad por `pokemonId` únicamente. */
  equals(other: PokedexIndexEntry): boolean {
    return this.pokemonId === other.pokemonId;
  }
}
