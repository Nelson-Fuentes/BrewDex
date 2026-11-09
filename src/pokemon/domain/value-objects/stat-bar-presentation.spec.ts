import { statBarColor, statBarPercent } from './stat-bar-presentation';

describe('statBarPercent', () => {
  it('devuelve 0 para el valor mínimo (0)', () => {
    expect(statBarPercent(0)).toBe(0);
  });

  it('devuelve 100 para el máximo absoluto de una estadística (255)', () => {
    expect(statBarPercent(255)).toBe(100);
  });

  it('devuelve 50 para el punto medio exacto (127.5)', () => {
    expect(statBarPercent(127.5)).toBe(50);
  });

  it('escala un valor típico (130) contra 255, no contra 200 ni contra el máximo del propio Pokémon', () => {
    expect(statBarPercent(130)).toBeCloseTo((130 / 255) * 100, 5);
  });

  it('recorta (clamp) al 100% un valor por encima de 255 (dato inconsistente)', () => {
    expect(statBarPercent(300)).toBe(100);
  });

  it('recorta (clamp) al 0% un valor negativo (dato inconsistente)', () => {
    expect(statBarPercent(-10)).toBe(0);
  });

  it('es monótonamente no decreciente', () => {
    expect(statBarPercent(50)).toBeLessThanOrEqual(statBarPercent(100));
    expect(statBarPercent(100)).toBeLessThanOrEqual(statBarPercent(200));
  });
});

describe('statBarColor', () => {
  it('devuelve rojo puro para el valor mínimo (0)', () => {
    expect(statBarColor(0)).toBe('rgb(255, 0, 0)');
  });

  it('devuelve amarillo puro para el punto medio exacto (127.5)', () => {
    expect(statBarColor(127.5)).toBe('rgb(255, 255, 0)');
  });

  it('devuelve verde puro para el máximo absoluto (255)', () => {
    expect(statBarColor(255)).toBe('rgb(0, 255, 0)');
  });

  it('interpola de rojo a amarillo en el primer tramo (0–127.5)', () => {
    expect(statBarColor(64)).toBe('rgb(255, 128, 0)');
  });

  it('interpola de amarillo a verde en el segundo tramo (127.5–255)', () => {
    expect(statBarColor(191)).toBe('rgb(128, 255, 0)');
  });

  it('recorta (clamp) al verde puro un valor por encima de 255 (dato inconsistente)', () => {
    expect(statBarColor(300)).toBe('rgb(0, 255, 0)');
  });

  it('recorta (clamp) al rojo puro un valor negativo (dato inconsistente)', () => {
    expect(statBarColor(-10)).toBe('rgb(255, 0, 0)');
  });
});
