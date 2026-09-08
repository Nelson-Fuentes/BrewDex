/**
 * **Contrato cruzado entre módulos**, mismo patrón que
 * `ActiveLanguageReader`/`GameSelectionReader` — lo único de `team` que
 * `game` puede depender (para saber, antes de confirmar un cambio de
 * juego, si hay que advertir que el equipo actual se perderá — FR-016).
 */
export interface RosterReader {
  /** `true` si algún slot del equipo tiene un Pokémon asignado. */
  hasAnyPokemon(): boolean;
}
