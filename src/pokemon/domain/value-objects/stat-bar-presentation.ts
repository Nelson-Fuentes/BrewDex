/**
 * Reglas de presentación en forma de barra horizontal para una estadística
 * base individual (PS, Ataque, Defensa, Ataque Especial, Defensa Especial o
 * Velocidad): a qué porcentaje de ancho corresponde su valor sobre una
 * escala fija de 0 a 255 (el máximo teórico de cualquier estadística base
 * en los juegos de la saga), y qué color le corresponde en un degradado
 * continuo rojo→amarillo→verde.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP/DOM (Constitución
 * Principio VI). Ver spec `020-stats-bar-scale-color` y
 * `contracts/stat-bar-presentation.md`.
 */

/** Máximo teórico de una estadística base individual. */
const STAT_MAX = 255;

/** Punto medio exacto de la escala — donde el degradado de color es amarillo puro. */
const STAT_MID = STAT_MAX / 2;

/** Recorta (clamp) un valor de estadística, posiblemente inconsistente
 *  (negativo o por encima de 255), al rango visual `[0, STAT_MAX]`. */
function clampStatValue(value: number): number {
  return Math.min(STAT_MAX, Math.max(0, value));
}

/**
 * Porcentaje de ancho de barra (0–100) correspondiente a un valor de
 * estadística base, sobre la escala fija de 255 — no sobre el máximo entre
 * las estadísticas del propio Pokémon.
 *
 * Un valor de 0 devuelve 0 (sin longitud mínima artificial). Valores fuera
 * de `[0, 255]` se recortan antes de calcular el porcentaje.
 */
export function statBarPercent(value: number): number {
  return (clampStatValue(value) / STAT_MAX) * 100;
}

/**
 * Color CSS (`rgb(r, g, b)`) correspondiente a un valor de estadística base,
 * interpolando en dos tramos sobre RGB: rojo puro (0) → amarillo puro
 * (127.5) → verde puro (255). Valores fuera de `[0, 255]` se recortan antes
 * de calcular el color.
 */
export function statBarColor(value: number): string {
  const clamped = clampStatValue(value);

  if (clamped <= STAT_MID) {
    const green = Math.round((clamped / STAT_MID) * 255);
    return `rgb(255, ${green}, 0)`;
  }

  const red = Math.round((1 - (clamped - STAT_MID) / STAT_MID) * 255);
  return `rgb(${red}, 255, 0)`;
}
