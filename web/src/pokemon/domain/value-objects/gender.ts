/**
 * El género indicado de un Pokémon en un slot de equipo. Unión literal en
 * vez de un `boolean isFemale` — `'genderless'` es un tercer estado
 * explícito, no un default silencioso a `'male'`.
 */
export type Gender = 'male' | 'female' | 'genderless';

/**
 * Qué géneros admite una especie — derivado de `PokedexEntry.genderRate`
 * (`019`). `'dual'` es el único caso en el que la tarjeta de detalle
 * ofrece un selector accionable (FR-002); los otros tres muestran un
 * indicador fijo (FR-004/FR-005/FR-006).
 */
export type GenderCapability = 'dual' | 'male-only' | 'female-only' | 'genderless';

/**
 * `genderRate` es la codificación cruda de PokeAPI (`species.gender_rate`,
 * ver `PokedexEntry.genderRate`): `-1` = sin datos de género, `0` = 100%
 * de probabilidad del género no-hembra (siempre macho), `8` = siempre
 * hembra, `1`-`7` = ambos géneros posibles.
 */
export function genderCapability(genderRate: number): GenderCapability {
  if (genderRate === -1) {
    return 'genderless';
  }
  if (genderRate === 0) {
    return 'male-only';
  }
  if (genderRate === 8) {
    return 'female-only';
  }
  return 'dual';
}

/**
 * El género a mostrar en la tarjeta de detalle: el ya guardado en el
 * `RosterEntry` (`storedGender`) si la persona ya eligió uno, o el
 * derivado de la capacidad de la especie en caso contrario (FR-003/
 * FR-004/FR-005/FR-006) — macho por defecto en las especies de género
 * dual o exclusivamente macho.
 */
export function resolveDisplayGender(genderRate: number, storedGender: Gender | null): Gender {
  if (storedGender !== null) {
    return storedGender;
  }
  const capability = genderCapability(genderRate);
  if (capability === 'female-only') {
    return 'female';
  }
  if (capability === 'genderless') {
    return 'genderless';
  }
  return 'male';
}
