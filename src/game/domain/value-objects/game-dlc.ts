/**
 * Una expansión/DLC seleccionable de un {@link Game} concreto (p. ej. "The
 * Isle of Armor" para Espada/Escudo). A diferencia de un lanzamiento
 * conjunto, un DLC nunca aparece como su propio `Game` — solo anidado bajo
 * el juego base que extiende, con su propio toggle de activación.
 */
export class GameDlc {
  constructor(
    /** Id estable de la fuente (el version-group de PokeAPI de este DLC). */
    readonly id: string,
    /** Etiqueta legible (p. ej. "The Isle of Armor"). */
    readonly displayName: string,
  ) {}

  equals(other: GameDlc): boolean {
    return this.id === other.id;
  }
}
