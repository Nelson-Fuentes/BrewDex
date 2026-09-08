import { colorForGame } from './pokemon-game-colors';

describe('colorForGame', () => {
  it('es determinístico — el mismo id siempre devuelve el mismo color', () => {
    expect(colorForGame('red-blue')).toBe(colorForGame('red-blue'));
  });

  it('devuelve colores distintos para juegos distintos (con la paleta actual)', () => {
    expect(colorForGame('red-blue')).not.toBe(colorForGame('emerald'));
  });

  it('no lanza para un id vacío o desconocido, y devuelve un color por defecto', () => {
    expect(() => colorForGame('')).not.toThrow();
    expect(colorForGame('')).toBeTruthy();
    expect(colorForGame('un-juego-que-no-existe')).toBeTruthy();
  });
});
