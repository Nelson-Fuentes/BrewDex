import type { Observable } from 'rxjs';
import type { Game } from '../entities/game';

/**
 * **Contrato cruzado entre módulos**, mismo patrón que
 * `ActiveLanguageReader` (módulo `language`) — el único recorte de
 * `game` que `pokedex`/`team` pueden depender, sin ver el resto de
 * `GameStore` (Constitución Principio VI).
 */
export interface GameSelectionReader {
  /** El juego activo, o `null` si aún no se eligió ninguno. */
  currentGame(): Game | null;

  /** Los ids de DLC actualmente activos para el juego activo. */
  currentActiveDlcIds(): ReadonlySet<string>;

  /** Emite cada vez que cambia el juego activo o sus DLC activos —
   *  quien consume debe volver a leer {@link currentGame}/
   *  {@link currentActiveDlcIds} al recibir un evento. */
  onSelectionChanged(): Observable<void>;

  /** Activa/desactiva un DLC del juego actualmente elegido (FR-009/
   *  FR-010/FR-011 de `018`). Único método de escritura de este puerto —
   *  se agrega acá (en vez de crear un segundo puerto) porque `pokedex`
   *  ya depende de este contrato para leer el juego/DLC activos, y el
   *  toggle de DLC ahora vive en la pantalla de Pokédex, no en la de
   *  selección de juego (research.md Decisión 7 de `018`). */
  toggleDlc(dlcId: string): void;
}
