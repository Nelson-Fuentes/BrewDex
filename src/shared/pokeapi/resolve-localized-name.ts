/** La forma mínima que PokeAPI usa para listas de nombres/textos localizados
 * (p. ej. `pokemon-species.names`, `move.names`, `move.flavor_text_entries`)
 * — un arreglo de entradas, cada una atada a un idioma. */
export interface PokeApiLocalizedEntry {
  readonly language: { readonly name: string };
}

/**
 * Resuelve el texto localizado para `languageCode` dentro de `entries`,
 * cayendo a inglés cuando no hay traducción para ese idioma puntual
 * (FR-018) — la misma regla que cada adaptador PokeAPI de la versión
 * Flutter aplicaba de forma individual, centralizada acá para no
 * duplicarla en `pokemon`, `pokedex`, `game` y `language`
 * (contracts/pokemon.md, contracts/movepool.md, contracts/game-catalog.md,
 * contracts/language-catalog.md).
 *
 * @param entries Las entradas localizadas de PokeAPI.
 * @param languageCode El idioma activo (código PokeAPI, p. ej. `"es"`).
 * @param extractText Cómo leer el texto de una entrada — distinto según el
 *   recurso (`names[].name` vs. `flavor_text_entries[].flavor_text`).
 * @returns El texto en `languageCode`, o en inglés si no existe, o `null`
 *   si tampoco hay una entrada en inglés.
 */
export function resolveLocalizedName<TEntry extends PokeApiLocalizedEntry>(
  entries: readonly TEntry[],
  languageCode: string,
  extractText: (entry: TEntry) => string,
): string | null {
  const inActiveLanguage = entries.find((entry) => entry.language.name === languageCode);
  if (inActiveLanguage) {
    return extractText(inActiveLanguage);
  }
  const inEnglish = entries.find((entry) => entry.language.name === 'en');
  return inEnglish ? extractText(inEnglish) : null;
}
