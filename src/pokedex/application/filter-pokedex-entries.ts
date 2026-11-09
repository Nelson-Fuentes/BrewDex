import { availableSelectableForms } from '../../pokemon/domain/value-objects/active-form';
import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import type { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import type { PokedexFilterCriteria } from '../domain/value-objects/pokedex-filter-criteria';

/**
 * Bug fix (2026-09-10, implementación directa sin spec): una entrada
 * coincide con el tipo del filtro si lo tiene la variedad principal
 * resuelta (`typePrimary`/`typeSecondary`, como ya hacía este filtro) O
 * cualquiera de sus `selectableForms` realmente disponibles con los DLC
 * activos (`availableSelectableForms`, mismo helper que ya usa el modal de
 * formas del equipo). Ejemplo real: Tauros en Escarlata/Púrpura resuelve
 * su variedad principal a la raza Paldeana (Combate/Agua/Fuego, ninguna es
 * Normal); Tauros-Kanto (tipo Normal puro) solo existe como
 * `SelectableForm` con `requiresDlcId = 'the-indigo-disk'` — sin este
 * chequeo adicional, filtrar por "Normal" nunca encontraba la entrada
 * "Tauros", con o sin el DLC activo. */
function entryMatchesType(entry: PokedexEntry, type: PokemonType, activeDlcIds: ReadonlySet<string>): boolean {
  if (entry.typePrimary.equals(type) || (entry.typeSecondary?.equals(type) ?? false)) {
    return true;
  }
  return availableSelectableForms(entry, activeDlcIds).some(
    (form) => form.typePrimary.equals(type) || (form.typeSecondary?.equals(type) ?? false),
  );
}

/**
 * Caso de uso: aplicar el criterio de búsqueda/filtro actual sobre una
 * lista de entradas ya resuelta (FR-009) — puramente en cliente, sin
 * ninguna llamada HTTP nueva. `activeDlcIds` determina qué formas
 * alternativas por DLC cuentan para el filtro de tipo (ver
 * {@link entryMatchesType}) — mismo criterio de disponibilidad que ya usa
 * el modal de formas del equipo (`availableSelectableForms`).
 */
export function filterPokedexEntries(
  entries: readonly PokedexEntry[],
  criteria: PokedexFilterCriteria,
  activeDlcIds: ReadonlySet<string>,
): PokedexEntry[] {
  const search = criteria.searchText.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesSearch = !search || entry.displayName.toLowerCase().includes(search);
    const matchesType = !criteria.type || entryMatchesType(entry, criteria.type, activeDlcIds);
    const matchesGeneration = !criteria.generation || entry.introducedGeneration.equals(criteria.generation);
    return matchesSearch && matchesType && matchesGeneration;
  });
}
