# Contract: `TeamBuilderCubit` resolves the whole Pokédex index up front

**Amends**: `lib/presentation/team_builder/cubit/team_builder_cubit.dart`, `lib/presentation/team_builder/cubit/team_builder_state.dart`, `lib/presentation/team_builder/widgets/pokedex_pane_slivers.dart`, `lib/presentation/team_builder/pages/team_builder_page.dart`, `lib/presentation/team_builder/widgets/team_builder_two_pane_layout.dart`.

## Rule

1. Once `TeamBuilderState.status == TeamBuilderStatus.loaded`, every entry in `TeamBuilderState.index` MUST already have a corresponding entry in `TeamBuilderState.resolvedEntries` — `resolvedCount == index.length` always holds at that point. The same holds once `TeamBuilderState.isRefreshingPokedex` transitions back to `false` after a National Dex/DLC toggle.
2. `TeamBuilderCubit` MUST NOT expose any method whose sole purpose is resolving *more* of an already-`loaded` index (no `loadMoreIfNeeded`-shaped method) — there is nothing left to load more of.
3. A widget that renders the Pokédex grid MUST NOT need a "this tile isn't resolved yet" placeholder branch for any entry once `status == loaded` — `resolvedEntries[indexEntry.pokemonId]` is guaranteed non-null for every `indexEntry` in `index` at that point. (A transient placeholder is still legitimate *while* `status == loading`/`isRefreshingPokedex == true` — Rule 1 only binds once that resolves.)
4. `updateSearch`/type/generation filtering MUST work against the fully-resolved set only — no out-of-window/not-yet-resolved id case remains to special-case.

## Before (violated)

```text
load() resolves index.take(20) + roster ids
  -> status: loaded, but most of `index` has no resolvedEntries entry
  -> PokedexGridSliver renders a placeholder tile for every unresolved index entry
  -> scrolling near the bottom / a tile nearing the end of the built range
     -> loadMoreIfNeeded() -> resolves 20 more
  -> repeat until every id happens to have been triggered
```

## After (this contract)

```text
load() resolves the *entire* index in the same call
  -> status: loaded implies index.length == resolvedEntries.length
  -> PokedexGridSliver never renders a placeholder tile once status == loaded
  -> no loadMoreIfNeeded, no scroll/build-proximity trigger exists anymore
```

`_fetchAndApplyView` (the National Dex/DLC toggle path) follows the identical rule, gated by `isRefreshingPokedex` instead of `status`.

## Verification

A Cubit test calls `load()` against an index fixture larger than the old batch size (e.g. 30+ entries) and asserts `resolvedCount == index.length` immediately after the single `load()` call resolves — no `loadMoreIfNeeded()` call involved. A widget test renders `PokedexGridSliver` (or the full grid via `TeamBuilderPage`) against a `loaded` state and asserts zero placeholder tiles are present.
