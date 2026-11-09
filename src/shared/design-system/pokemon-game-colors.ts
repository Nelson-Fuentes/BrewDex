/**
 * Paleta de color por juego — puramente de presentación (research.md
 * Decisión 3 de `018`). Un id vacío/desconocido cae a un color por
 * defecto en vez de romper el render; el mismo id siempre resuelve al
 * mismo color (hash determinístico), así que juegos distintos casi
 * siempre difieren visualmente sin mantener una tabla fija por juego.
 */
const GAME_COLOR_PALETTE: readonly string[] = [
  '#EE6B6E',
  '#4C9F70',
  '#4C7BD9',
  '#D9A23B',
  '#8A5FD9',
  '#3BAFA6',
  '#D9598C',
  '#6B8E23',
  '#C2673B',
  '#5B7FBF',
];

const DEFAULT_GAME_COLOR = '#6A6A7A';

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function colorForGame(gameId: string): string {
  if (!gameId) {
    return DEFAULT_GAME_COLOR;
  }
  return GAME_COLOR_PALETTE[hashString(gameId) % GAME_COLOR_PALETTE.length];
}
