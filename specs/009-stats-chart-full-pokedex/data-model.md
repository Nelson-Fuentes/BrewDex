# Data Model: Gráfico de Barras para Estadísticas y Pokédex Completa

No new or amended domain entity, value object, or port. This feature is a presentation-layer rendering change (bar chart) plus a Cubit-internal simplification (full-index resolution instead of batched). This document records the one state-shape *removal* and the presentation-only addition.

## Amended: `TeamBuilderState` (presentation state) — field removed

`lib/presentation/team_builder/cubit/team_builder_state.dart`

- **Removed field**: `isLoadingMore` (`bool`) — no longer meaningful once `load()`/`_fetchAndApplyView` resolve the full index in one pass (research.md Decision 3): there is no "a batch is resolving in the background while some entries are already visible" state left to flag. `copyWith`'s `isLoadingMore` parameter and its entry in `props` are removed with it.
- **Unchanged**: `status` (`TeamBuilderStatus`), `isRefreshingPokedex`, `resolvedEntries`, `index`, and every other field/getter — `resolvedCount`, `visibleIndexEntries`, `slots`, etc. all keep their exact current shape and meaning; `resolvedCount` simply always equals `index.length` once `status == loaded` (a natural consequence of full resolution, not a new invariant this feature has to enforce anywhere).

## Amended: `TeamBuilderCubit` (presentation orchestration) — methods removed, two amended

`lib/presentation/team_builder/cubit/team_builder_cubit.dart`

- **Removed**: `loadMoreIfNeeded()`, `_resolveNextBatch(...)`, `_batchSize` constant — no caller has anything left to trigger them for (research.md Decision 3).
- **Amended**: `load()` — resolves `_getPokedexDetails` for the *entire* `index` instead of `index.take(_batchSize)` unioned with roster ids (the union becomes redundant: every roster id is already part of the full index being resolved).
- **Amended**: `_fetchAndApplyView(PokedexView view)` — same change, for the National Dex/DLC-toggle refetch path.
- **Amended**: `updateSearch(String query)` — keeps updating `filter` (unchanged); drops the trailing `_resolveNextBatch(state.visibleIndexEntries)` call it used to make, since nothing a search could match is ever unresolved once `status == loaded`.
- **Unchanged**: every other public method (`addPokemon`, `removePokemon`, `updateRosterEntry`, `setActiveSlot`/`clearActiveSlot`, `toggleNationalDex`, `toggleDlc`, `updateTypeFilter`, `updateGenerationFilter`, `clearFilters`) — none of them touched the batching machinery being removed.

## Amended: `PokedexGridSliver` (presentation widget) — parameter removed

`lib/presentation/team_builder/widgets/pokedex_pane_slivers.dart`

- **Removed**: `onLoadMore` constructor parameter and the `_loadMoreLookahead`-triggered `WidgetsBinding.instance.addPostFrameCallback` block inside its `SliverChildBuilderDelegate.builder` (added in `008-configurador-equipo-correcciones`, research.md Decision 2, specifically to make the batching this feature removes more reliable — its entire reason to exist goes with the batching). `buildPokedexPaneSlivers`'s own `onLoadMore` parameter is removed with it, and both call sites (`team_builder_page.dart`, `team_builder_two_pane_layout.dart`) drop the argument and their `NotificationListener<ScrollNotification>` wrapper (nothing left for either trigger path to call once the grid never has an unresolved placeholder tile to begin with).

## New (presentation-only): the Base Stats bar chart

`lib/presentation/team_builder/widgets/pokemon_customization_card.dart`

- `_StatsTable` (008's plain label/value list) is replaced by `_StatsBarChart` — same inputs (`AppLocalizations l10n`, `PokemonStats stats`), same six rows, each now rendered as **label + proportional horizontal bar + numeric value** instead of **label + numeric value**. No new domain type: `PokemonStats` (008-configurador-equipo-correcciones) is read exactly as before, only the render differs. The fixed reference maximum (255, research.md Decision 2) is a private constant local to this widget — not a domain concept, since no other part of the app needs to know the franchise's base-stat ceiling.
