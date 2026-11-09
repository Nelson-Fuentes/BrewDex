import type { Game } from '../domain/entities/game';

/**
 * Caso de uso: aplicar la elección explícita de juego (FR-007). Efectivo
 * de inmediato, solo para lo que dure la sesión (FR-015). Quien llama
 * (la capa de presentación, vía `GameStore`) es responsable de pedir
 * confirmación antes si ya hay un roster no vacío (FR-016) — este caso de
 * uso no vuelve a preguntar.
 */
export function selectGame(game: Game, onGameSelected: (game: Game) => void): void {
  onGameSelected(game);
}
