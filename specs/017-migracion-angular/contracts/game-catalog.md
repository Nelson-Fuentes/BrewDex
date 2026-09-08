# Contract: módulo `game`

## `GameCatalogRepository` (puerto de dominio)

```ts
export interface GameCatalogRepository {
  /** Catálogo completo de juegos seleccionables, con displayName y
   *  generation.label resueltos para languageCode (fallback inglés).
   *  Lanza GameCatalogUnavailable si no se puede obtener — nunca
   *  devuelve una lista parcial en silencio. */
  fetchCatalog(languageCode: string): Promise<Game[]>;
}
```

Implementación: `PokeApiGameCatalogRepositoryService` — construye cada `Game` a partir de `version-group` de PokeAPI, colapsando lanzamientos conjuntos en una sola entrada (FR-005) y anidando sus DLC (`GameDlc`) según el mapa DLC→version-group padre de [[../research.md]] Decisión 4.

## `RosterValidityChecker` (puerto de dominio, declarado aquí, implementado en `team`)

```ts
export interface RosterValidityChecker {
  /** Subconjunto de rosterPokemonIds que sigue siendo válido para game. */
  validFor(game: Game, rosterPokemonIds: string[]): Promise<string[]>;
}
```

Puerto declarado por el módulo `game` pero implementado en `team` usando el `PokemonRepository` del módulo `pokemon` (`PokedexRosterValidityCheckerService`, ver [[pokemon.md]]) — el mismo cruce ya existente en Flutter, donde `game` no conoce el modelo interno de `pokemon`/`team`, solo este contrato.

**Uso**: al confirmar un cambio de juego con roster no vacío (FR-016, Edge Cases), se advierte a la persona y, si confirma, se descarta el roster completo — no hay reconciliación parcial ni fusión entre juegos en esta migración, dado que no hay persistencia que reconciliar entre sesiones (a diferencia de Flutter, donde este puerto también reconciliaba un roster recién leído de almacenamiento).

## `GameStore` (servicio de aplicación, no un puerto de dominio)

```ts
export interface GameStore {
  readonly catalog: Signal<ReadonlyArray<Game>>;
  readonly activeGame: Signal<Game | null>;
  readonly activeDlcIds: Signal<ReadonlySet<string>>;

  /** FR-007/FR-016: si hay roster no vacío, la presentación debe pedir
   *  confirmación (mostrando qué se perderá) ANTES de llamar a este
   *  método — el servicio no vuelve a preguntar. */
  selectGame(game: Game): void;

  toggleDlc(dlcId: string): void;
}
```

## Sin puerto de persistencia

No existe equivalente a `SelectedGameStore` (Flutter) — ver [[../research.md]] Decisión 5. El juego/DLC activos viven solo en el signal `GameStore.activeGame` mientras dura la sesión (FR-015).
