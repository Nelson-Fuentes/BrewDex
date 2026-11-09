import { heatmapColorFor, heatmapTextColorFor } from './heatmap-gradient';

function parseRgb(color: string): readonly [number, number, number] {
  const match = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(color);
  if (!match) {
    throw new Error(`No es un color rgb(): ${color}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

describe('heatmapColorFor', () => {
  it('el valor mínimo y el máximo de una columna devuelven los dos extremos de la paleta', () => {
    const columnValues = [0, 1, 2, 4];
    const minColor = heatmapColorFor(0, columnValues);
    const maxColor = heatmapColorFor(4, columnValues);

    expect(minColor).not.toBe(maxColor);
  });

  it('un valor intermedio devuelve un color coherente con su posición relativa (monotonía, paleta semáforo)', () => {
    const columnValues = [0, 1, 2, 4];
    const low = parseRgb(heatmapColorFor(0, columnValues));
    const mid = parseRgb(heatmapColorFor(2, columnValues));
    const high = parseRgb(heatmapColorFor(4, columnValues));

    // Paleta "semáforo" (rojo→amarillo→verde, 2026-09-10): ni el canal rojo ni el verde
    // solos son monótonos de extremo a extremo (el rojo se mantiene alto de bajo a medio y
    // cae de medio a alto; el verde sube y luego baja levemente) — la señal "más verde que
    // rojo" (G − R) sí crece monótonamente de bajo a alto, que es la semántica de un semáforo.
    const greennessOf = ([r, g]: readonly [number, number, number]): number => g - r;
    expect(greennessOf(low)).toBeLessThanOrEqual(greennessOf(mid));
    expect(greennessOf(mid)).toBeLessThanOrEqual(greennessOf(high));
  });

  it('una columna con min === máx (incluyendo un único valor repetido) devuelve un único color consistente sin lanzar (FR-009)', () => {
    expect(() => heatmapColorFor(45.125, [45.125, 45.125, 45.125])).not.toThrow();
    const color = heatmapColorFor(45.125, [45.125, 45.125, 45.125]);
    expect(heatmapColorFor(45.125, [45.125])).toBe(color);
  });

  it('una columna vacía no lanza excepción', () => {
    expect(() => heatmapColorFor(3, [])).not.toThrow();
  });

  it('devuelve siempre un string de color CSS rgb() válido', () => {
    expect(() => parseRgb(heatmapColorFor(2, [0, 1, 2, 4]))).not.toThrow();
    expect(() => parseRgb(heatmapColorFor(3, []))).not.toThrow();
  });

  it('el mismo valor mínimo/máximo produce siempre el mismo color entre columnas de escalas distintas (independiente de la unidad)', () => {
    const smallScale = heatmapColorFor(0, [0, 2, 4]);
    const largeScale = heatmapColorFor(0, [0, 200, 400]);
    expect(smallScale).toBe(largeScale);
  });
});

describe('heatmapTextColorFor', () => {
  it('devuelve un color oscuro en ambos extremos de la paleta (todos los tonos son pálidos desde la paleta semáforo, 2026-09-10)', () => {
    expect(heatmapTextColorFor(0, [0, 1, 2, 4])).toBe('#1a1a1a');
    expect(heatmapTextColorFor(4, [0, 1, 2, 4])).toBe('#1a1a1a');
  });

  it('el color de texto es siempre uno de los dos disponibles, nunca un tercero', () => {
    const values = [0, 1, 2, 3, 4];
    for (const value of values) {
      const textColor = heatmapTextColorFor(value, values);
      expect(['#ffffff', '#1a1a1a']).toContain(textColor);
    }
  });

  it('con min === máx (o columna vacía) devuelve un único color de texto consistente, sin lanzar (FR-009)', () => {
    expect(() => heatmapTextColorFor(45.125, [45.125, 45.125, 45.125])).not.toThrow();
    const textColor = heatmapTextColorFor(45.125, [45.125, 45.125, 45.125]);
    expect(heatmapTextColorFor(45.125, [45.125])).toBe(textColor);
    expect(() => heatmapTextColorFor(3, [])).not.toThrow();
  });
});
