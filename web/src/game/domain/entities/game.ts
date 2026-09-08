import type { Generation } from '../value-objects/generation';
import type { GameDlc } from '../value-objects/game-dlc';

/**
 * Una opción seleccionable de juego de Pokémon. Un lanzamiento conjunto
 * (p. ej. dos versiones vendidas juntas) se representa como un único
 * {@link Game} — nunca como dos (FR-005).
 *
 * Entidad de dominio pura: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class Game {
  constructor(
    /** Id estable del catálogo (el version-group de PokeAPI). */
    readonly id: string,
    /** Nombre visible, inequívoco frente a cualquier otro juego del catálogo. */
    readonly displayName: string,
    /** Generación a la que pertenece este juego (filtro FR-004). */
    readonly generation: Generation,
    /** Expansiones/DLC de este juego, nunca ofrecidas como `Game` aparte. */
    readonly dlcs: readonly GameDlc[] = [],
  ) {
    if (!id) {
      throw new Error('Game.id must not be empty');
    }
    if (!displayName) {
      throw new Error('Game.displayName must not be empty');
    }
  }

  equals(other: Game): boolean {
    return this.id === other.id;
  }
}
