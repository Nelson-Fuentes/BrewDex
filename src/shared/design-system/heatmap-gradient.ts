/**
 * Color de fondo en degradado ("mapa de calor") para una celda, según la
 * posición de su valor entre el mínimo y el máximo de los valores de su
 * propia columna — genérico por diseño (spec `023`, FR-011): no conoce
 * nada sobre "eficacia defensiva" ni "coeficiente de defensa", por lo que
 * cualquier columna futura de números (p. ej. un coeficiente de ataque o
 * de cobertura) lo reutiliza sin cambios.
 *
 * No es una regla de negocio del dominio Pokémon — es un mapeo
 * presentacional genérico número→color, igual que `pokemon-type-colors.ts`
 * — por eso vive en `shared/design-system`, no en `pokemon/domain`
 * (Constitución Principio VI; plan.md `023`, Constitution Check).
 */

/** Extremo "bajo" de la paleta: rojo pálido. Paleta "semáforo" pedida
 *  explícitamente por el usuario (2026-09-10) sobre un mockup — reemplaza
 *  el degradado de un solo matiz (violeta→lavanda) que `023`/FR-008a había
 *  elegido a propósito por ser seguro para daltonismo rojo-verde
 *  (deuteranopia/protanopia). El usuario confirmó explícitamente que
 *  prioriza igualar el mockup por sobre esa garantía de accesibilidad —
 *  ver `vault/06_Logs/log.md`, entrada 2026-09-10 "Paleta semáforo". */
const LOW_COLOR: readonly [number, number, number] = [0xff, 0xcd, 0xd2];

/** Punto medio de la paleta: amarillo/ámbar pálido. */
const MID_COLOR: readonly [number, number, number] = [0xff, 0xf3, 0xc4];

/** Extremo "alto" de la paleta: verde pálido. */
const HIGH_COLOR: readonly [number, number, number] = [0xc8, 0xe6, 0xc9];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerpChannel(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

function lerpColor(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  t: number,
): readonly [number, number, number] {
  return [lerpChannel(from[0], to[0], t), lerpChannel(from[1], to[1], t), lerpChannel(from[2], to[2], t)];
}

/** RGB interpolado en la posición `t` (0-1) de la paleta de 3 puntos
 *  (rojo→amarillo→verde) — compartido por {@link colorAt} (color de fondo)
 *  y {@link textColorAt} (contraste de texto), para no calcular la
 *  interpolación dos veces con fórmulas que puedan divergir. La mitad
 *  inferior (`t <= 0.5`) interpola rojo→amarillo, la mitad superior
 *  amarillo→verde. */
function rgbAt(t: number): readonly [number, number, number] {
  const clamped = clamp01(t);
  if (clamped <= 0.5) {
    return lerpColor(LOW_COLOR, MID_COLOR, clamped / 0.5);
  }
  return lerpColor(MID_COLOR, HIGH_COLOR, (clamped - 0.5) / 0.5);
}

function colorAt(t: number): string {
  const [r, g, b] = rgbAt(t);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Luminosidad percibida (0-255, fórmula YIQ/ITU-R BT.601) de un color RGB
 *  — más alta significa un fondo más claro, más baja un fondo más oscuro.
 *  Usada solo para decidir el color de texto de contraste
 *  ({@link textColorAt}), no para el propio degradado. */
function perceivedLuminance([r, g, b]: readonly [number, number, number]): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Umbral de luminosidad bajo el cual un fondo se considera "oscuro" y el
 *  texto debe pasar a blanco para mantener contraste — 140 sobre 255, el
 *  valor de corte perceptivo estándar (WCAG-adyacente). Con la paleta
 *  "semáforo" (2026-09-10, todos los tonos pálidos) este umbral en la
 *  práctica nunca se cruza — el texto queda siempre oscuro — pero se
 *  conserva la lógica de contraste por si una paleta futura vuelve a usar
 *  tonos oscuros en algún extremo. */
const DARK_BACKGROUND_LUMINANCE_THRESHOLD = 140;

/** Color de texto (blanco u oscuro) con contraste suficiente sobre el color
 *  de fondo que produciría {@link colorAt} en la misma posición `t`. */
function textColorAt(t: number): string {
  return perceivedLuminance(rgbAt(t)) < DARK_BACKGROUND_LUMINANCE_THRESHOLD ? '#ffffff' : '#1a1a1a';
}

/** Color intermedio de la paleta (t = 0.5, el punto amarillo exacto) usado
 *  como valor de reserva consistente cuando la columna no tiene un rango
 *  real que interpolar (vacía, o con `min === máx` — FR-009). */
const NEUTRAL_COLOR = colorAt(0.5);

/** Color de texto de contraste correspondiente a {@link NEUTRAL_COLOR}. */
const NEUTRAL_TEXT_COLOR = textColorAt(0.5);

/** Posición relativa (0-1) de `value` entre el mínimo y el máximo de
 *  `columnValues`, o `null` cuando no hay un rango real que interpolar
 *  (columna vacía, o `min === máx` — FR-009) — compartido por
 *  {@link heatmapColorFor} y {@link heatmapTextColorFor} para que ambos
 *  posicionen exactamente el mismo punto de la paleta. */
function relativePosition(value: number, columnValues: readonly number[]): number | null {
  if (columnValues.length === 0) {
    return null;
  }
  const min = Math.min(...columnValues);
  const max = Math.max(...columnValues);
  return min === max ? null : (value - min) / (max - min);
}

/**
 * Color CSS (`rgb(r, g, b)`) para `value`, interpolado en 3 puntos
 * (rojo pálido → amarillo pálido → verde pálido, paleta "semáforo") entre
 * el mínimo y el máximo de `columnValues` (que debe incluir a `value`).
 *
 * - Si `columnValues` está vacía, o todos sus valores son iguales
 *   (`min === máx`), devuelve un único color consistente (`NEUTRAL_COLOR`,
 *   el punto amarillo) para cualquier `value`, sin dividir por un rango de
 *   cero (FR-009).
 * - En caso contrario, `value === min` devuelve rojo pálido, `value === máx`
 *   devuelve verde pálido, y los valores intermedios se interpolan
 *   proporcionalmente (pasando por amarillo pálido en el punto medio).
 * - Es independiente de la escala/unidad de `columnValues` — el mismo
 *   `value` relativo (p. ej. el mínimo de la columna) siempre produce el
 *   mismo color, sin importar la magnitud absoluta de los números.
 */
export function heatmapColorFor(value: number, columnValues: readonly number[]): string {
  const t = relativePosition(value, columnValues);
  return t === null ? NEUTRAL_COLOR : colorAt(t);
}

/**
 * Color de texto CSS (`#ffffff` o `#1a1a1a`) con contraste suficiente sobre
 * el color de fondo que {@link heatmapColorFor} produciría para el mismo
 * `value`/`columnValues` — blanco cuando ese fondo es oscuro (luminosidad
 * percibida por debajo del umbral), oscuro cuando es claro. Pensado para
 * usarse siempre junto a `heatmapColorFor` en la misma celda
 * (`[style.background]="heatmapColorFor(...)"` +
 * `[style.color]="heatmapTextColorFor(...)"`), nunca de forma aislada.
 */
export function heatmapTextColorFor(value: number, columnValues: readonly number[]): string {
  const t = relativePosition(value, columnValues);
  return t === null ? NEUTRAL_TEXT_COLOR : textColorAt(t);
}
