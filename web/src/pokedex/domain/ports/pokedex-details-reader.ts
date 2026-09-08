import type { PokedexEntry } from '../../../pokemon/domain/entities/pokedex-entry';

/**
 * **Contrato cruzado entre módulos**, mismo patrón que
 * `ActiveLanguageReader`/`GameSelectionReader`/`RosterReader` — lo único
 * de `pokedex` que `team` puede depender, para mostrar el detalle
 * (formas, tipos, sprites...) de un Pokémon ya agregado al equipo sin ver
 * el resto de `PokedexStore`.
 */
export interface PokedexDetailsReader {
  /** El detalle ya resuelto para `pokemonId`, o `null` si todavía no se
   *  resolvió (p. ej. sigue cargando, o no pertenece a la vista actual). */
  detailsFor(pokemonId: string): PokedexEntry | null;
}
