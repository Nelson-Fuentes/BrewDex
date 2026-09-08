# Contract: `PokemonRepository` (módulo `pokemon`)

```ts
export interface PokemonRepository {
  /** Detalle completo (sprites, tipos, formas, variantes cosméticas...)
   *  de cada especie/forma en pokemonIds, para el game/view dados.
   *  `view` (del módulo `pokedex`) DEBE ser el mismo valor usado para
   *  producir pokemonIds — el número de dex y el sourceTag dependen de
   *  la vista, no solo de la identidad. Puede devolver menos entradas
   *  de las pedidas si algún id no resuelve, pero lanza
   *  PokedexUnavailable si NINGÚN id resuelve. pokemonIds vacío
   *  devuelve [] sin ninguna llamada HTTP. Ex-`PokedexRepository.
   *  fetchPokedexDetails` antes de la segregación de [[../research.md]]
   *  Decisión 11. */
  fetchPokedexDetails(
    game: Game,
    view: PokedexView,
    pokemonIds: string[],
    languageCode: string,
  ): Promise<PokedexEntry[]>;
}
```

Implementación: `PokeApiPokemonRepositoryService`, contra `pokemon-species` y `pokemon` de PokeAPI. Único lugar de la infraestructura que conoce la forma de esas respuestas (Constitución Principio VI) — puede compartir helpers HTTP internos con `PokeApiPokedexIndexRepositoryService` ([[pokedex.md]]) sin que eso implique fusionar los dos puertos. Traslada literalmente:

- el mapa de sufijo de forma regional por juego (p. ej. `sword-shield` → `galar`) para elegir qué variedad es la "principal" de un juego regional (FR-008),
- `isNationalDexEligible`/`generationOrdinal` (usado también por `pokedex` para el alcance del Pokédex nacional).

## Fallback de idioma (FR-018)

Este adaptador resuelve todo contenido localizado (nombres, descripciones) con **fallback a inglés** cuando el idioma activo no tiene traducción para un recurso puntual — misma regla que [[movepool.md]], centralizada en un helper compartido de infraestructura (`resolveLocalizedName(names, languageCode)`) para no duplicar la lógica en cada adaptador.
