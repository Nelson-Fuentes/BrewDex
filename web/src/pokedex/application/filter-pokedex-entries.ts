import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import type { PokedexFilterCriteria } from '../domain/value-objects/pokedex-filter-criteria';

/**
 * Caso de uso: aplicar el criterio de búsqueda/filtro actual sobre una
 * lista de entradas ya resuelta (FR-009) — puramente en cliente, sin
 * ninguna llamada HTTP nueva.
 */
export function filterPokedexEntries(
  entries: readonly PokedexEntry[],
  criteria: PokedexFilterCriteria,
): PokedexEntry[] {
  const search = criteria.searchText.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesSearch = !search || entry.displayName.toLowerCase().includes(search);
    const matchesType =
      !criteria.type ||
      entry.typePrimary.equals(criteria.type) ||
      (entry.typeSecondary?.equals(criteria.type) ?? false);
    const matchesGeneration = !criteria.generation || entry.introducedGeneration.equals(criteria.generation);
    return matchesSearch && matchesType && matchesGeneration;
  });
}
