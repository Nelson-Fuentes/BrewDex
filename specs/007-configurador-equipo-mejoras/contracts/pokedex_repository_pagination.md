# Port Contract Amendment: `PokedexRepository` (index + batched details)

Amends `specs/004-pokedex-team-builder/contracts/pokedex_repository.md` (as already amended by `specs/006-selector-pokedex-fixes-2/contracts/pokedex_repository_amendment.md`). This is a **breaking** change to the port's method signature — see `plan.md`'s Constitution Check for why no external migration note is needed (internal port, no consumer outside this repo).

## Before

```dart
abstract class PokedexRepository {
  Future<List<PokedexEntry>> fetchPokedex({
    required Game game,
    required PokedexView view,
    required String languageCode,
  });
}
```

Rule (from the prior contracts): "No partial results" — either the full, correctly-ordered list or a thrown `PokedexUnavailable`.

## After

```dart
abstract class PokedexRepository {
  /// Cheap: ordering + identity only, no per-species HTTP call.
  Future<List<PokedexIndexEntry>> fetchPokedexIndex({
    required Game game,
    required PokedexView view,
  });

  /// Expensive per id: full species/variety/type/sprite resolution,
  /// same enrichment `fetchPokedex` used to always run for everyone.
  Future<List<PokedexEntry>> fetchPokedexDetails({
    required Game game,
    required List<String> pokemonIds,
    required String languageCode,
  });
}
```

### Rules

1. **Ordering source of truth**: `fetchPokedexIndex`'s result is sorted ascending by `pokedexNumber`, exactly as `fetchPokedex` was — same merge/dedup/regional-offset/national-scope logic from the prior contract, just stopping before the per-species enrichment loop.
2. **No partial index**: `fetchPokedexIndex` still either returns the *complete* ordered index for `game`/`view`, or throws `PokedexUnavailable` — it is cheap enough (no per-species calls) that "partial" was never the problem this split addresses.
3. **`fetchPokedexDetails` may return fewer than requested**: if a given `pokemonId` in the input isn't resolvable (should not normally happen for an id that came from this repository's own index, but a defensive caller must not assume a 1:1 result), that id is simply absent from the result rather than the whole call failing — unless *no* id resolves, in which case `PokedexUnavailable` is thrown (mirrors the "don't return an empty list silently on total failure" spirit of the prior contract).
4. **Order of the `fetchPokedexDetails` result is not guaranteed** to match the input `pokemonIds` order (parallel `Future.wait`, same as today) — callers key results by `pokemonId` (`TeamBuilderState.resolvedEntries`), never by list position.
5. **Every other resolution rule from the prior contracts is unchanged**: regional-form principal-variety selection, DLC additive merge, National Dex generation scoping, `_spriteVersionKeyByGameId` overrides, per-form Mega/Gigamax/template classification (now also carrying `typePrimary`/`typeSecondary`/female sprite fields per `data-model.md`).

## Caller contract (`TeamBuilderCubit`)

- `load()` calls `fetchPokedexIndex` once, then `fetchPokedexDetails` for the index's first ~20 ids (FR-006).
- A scroll-driven "near the end of the currently resolved+visible list" signal calls `fetchPokedexDetails` for the next ~20 not-yet-resolved ids from the index, in index order (FR-007); a no-op once every index id is resolved.
- `updateSearch(query)` filters the **index** in-memory by `pokemonId`/displayable slug (case-insensitive substring), then calls `fetchPokedexDetails` for whichever matched ids aren't already in `resolvedEntries` (FR-008) — never falls back to only searching `resolvedEntries`.
- A game/view change (new game selected, National Dex/DLC toggle) discards `index`/`resolvedEntries`/`resolvedCount` for the previous view and starts the same index→first-batch sequence fresh — an in-flight batch for the previous view/game must be safely ignorable if its response arrives after the switch (guard by comparing against the still-current `game`/`view` when the response lands, same pattern `isRefreshingPokedex` already implies).

## Test impact

- `pokeapi_pokedex_repository_test.dart`: split existing "fetches the full pokedex" assertions into an index-shape test and a details-shape test; add a details-subset test (`pokemonIds` narrower than the full index); add a female/shiny-female/type assertion for a non-principal variety's `SelectableForm`.
- `get_pokedex.dart`'s existing test (`GetPokedex`) is replaced by tests for the two new use cases `GetPokedexIndex`/`GetPokedexDetails` (thin pass-through wrappers, same shape as today's `GetPokedex`).
- `team_builder_cubit_test.dart`: initial load resolves only the first batch; scrolling near the end resolves the next batch; search resolves an out-of-window match; a game/view change discards stale in-flight batch results.
