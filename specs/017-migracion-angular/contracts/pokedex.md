# Contract: módulo `pokedex`

## `PokedexIndexRepository` (puerto de dominio)

```ts
export interface PokedexIndexRepository {
  /** Proyección barata, solo-orden — sin llamada HTTP por especie.
   *  Ordenado ascendente por pokedexNumber. Aplica las mismas reglas de
   *  merge/dedup/offset-regional/alcance-nacional que la versión Flutter.
   *  Lanza PokedexUnavailable si no se puede obtener — nunca un índice
   *  parcial. */
  fetchPokedexIndex(game: Game, view: PokedexView): Promise<PokedexIndexEntry[]>;
}
```

Implementación: `PokeApiPokedexIndexRepositoryService`, contra el recurso `pokedex` de PokeAPI. Ex-mitad de `PokedexRepository` en el diseño de capa-primero — ver [[../research.md]] Decisión 11 sobre por qué se segrega del detalle por especie (que ahora vive en el módulo `pokemon`, [[pokemon.md]]).

## `PokedexStore` (servicio de aplicación, no un puerto de dominio)

```ts
export interface PokedexStore {
  readonly pokedexView: Signal<PokedexView>;
  readonly filterCriteria: Signal<PokedexFilterCriteria>;
  readonly pokedexIndex: Signal<ReadonlyArray<PokedexIndexEntry>>;
  readonly pokedexDetailsById: Signal<ReadonlyMap<string, PokedexEntry>>;

  /** FR-009: aplica un nuevo criterio de búsqueda/filtro sobre el
   *  índice ya cargado — cliente, sin nueva llamada HTTP. */
  updateFilterCriteria(criteria: PokedexFilterCriteria): void;

  /** FR-006: activa/desactiva un DLC para la vista de Pokédex actual;
   *  dispara una nueva carga de `pokedexIndex`. */
  toggleDlc(dlcId: string): void;

  /** FR-004/FR-017: alterna la vista al Pokédex nacional cuando el
   *  juego activo es elegible (ver `isNationalDexEligible`,
   *  [[../research.md]] Decisión 4). */
  toggleNationalDex(useNationalDex: boolean): void;
}
```

`pokedexDetailsById` se resuelve delegando en `PokemonRepository.fetchPokedexDetails` del módulo `pokemon` ([[pokemon.md]]) para las entradas visibles de `pokedexIndex` — `pokedex` conoce el puerto `PokemonRepository`, nunca la infraestructura interna de `pokemon`.

## Fallback de idioma (FR-018)

Ningún nombre se resuelve aquí directamente — `pokedexIndex` no lleva texto localizado (solo ids/números); el fallback a inglés vive en `pokemon` ([[pokemon.md]]) y `movepool` ([[movepool.md]]), que sí resuelven contenido localizado.
