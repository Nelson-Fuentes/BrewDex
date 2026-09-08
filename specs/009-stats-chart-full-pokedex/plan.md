# Implementation Plan: Gráfico de Barras para Estadísticas y Pokédex Completa

**Branch**: `009-stats-chart-full-pokedex` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-stats-chart-full-pokedex/spec.md`

## Summary

Two independent, small changes to the already-shipped `team_builder` armador: (1) the customization card's "Base Stats" section (added in `008-configurador-equipo-correcciones`, currently a plain label/value list) becomes a horizontal bar chart — one proportional bar per stat, built from plain Flutter layout widgets, no charting dependency; (2) `TeamBuilderCubit`'s batched Pokédex loading (`_batchSize = 20`, introduced in `007-configurador-equipo-mejoras` and only reinforced in `008-configurador-equipo-correcciones`'s build-proximity trigger) is replaced by resolving the *entire* active index's detail in the same request `load()`/`_fetchAndApplyView()` already make — the index was always fetched in full up front; only the per-species *detail* resolution was batched, so removing the batch size is a same-shaped, smaller change to the same two methods, not a new loading path.

Because every entry is fully resolved by the time `status` becomes `loaded` (or `isRefreshingPokedex` clears), the scroll/build-proximity "load more" machinery this Cubit and the Pokédex grid sliver carry — `loadMoreIfNeeded`, `_resolveNextBatch`, `isLoadingMore`, `PokedexGridSliver.onLoadMore`, and both `NotificationListener<ScrollNotification>` trigger blocks in `team_builder_page.dart`/`team_builder_two_pane_layout.dart` — has nothing left to trigger and is removed as dead code (Constitution Principle I), rather than kept "just in case." `updateSearch` keeps its existing job of narrowing `filter` — it no longer needs a resolution step, since search only ever matches against entries that are already fully resolved.

## Technical Context

**Language/Version**: Dart (Flutter, `flutter_bloc` state management) — existing project, no new language/runtime.

**Primary Dependencies**: `flutter_bloc`, `equatable`, `http` (already in use); no new package dependencies — the bar chart is built from `Row`/`Expanded`/`FractionallySizedBox`/`DecoratedBox`, the same primitives every other custom visual in this codebase (`PokeballBackground`, `_FormTile`, ...) already uses (Principle I: prefer the standard toolkit over a new dependency for a simple proportional-bar visual).

**Storage**: None affected — `TeamRosterStore` and its persisted shape are unchanged.

**Testing**: `flutter test` — widget tests for the new bar-chart rendering (`test/presentation/team_builder/pokemon_customization_card_test.dart`), Cubit tests asserting `load()`/`_fetchAndApplyView` resolve the full index in one pass (`test/presentation/team_builder/team_builder_cubit_pagination_test.dart`, effectively rewritten since its premise changes), and deletion of now-meaningless batch-specific test cases/files (`test/presentation/team_builder/widgets/pokedex_grid_sliver_lookahead_test.dart`, added in `008-configurador-equipo-correcciones` for the very trigger this feature removes).

**Target Platform**: Flutter multi-platform (Android + Web) — both the compact/medium and expanded (two-pane) layouts share the same `TeamBuilderCubit`/`PokedexGridSliver` code this feature changes, so both get full-load and the bar chart with no layout-specific work.

**Performance Goals**: SC-003 ("every Pokémon findable immediately once the initial load finishes") replaces `007-configurador-equipo-mejoras`'s SC-003 ("first ~20 entries visible in under 1s") — this feature deliberately trades a possibly-longer single loading period (FR-007's loading indicator covers it) for zero partial/placeholder state afterward, per spec.md Assumptions.

**Constraints**: `PokedexRepository.fetchPokedexDetails` already resolves every requested id's HTTP calls in parallel (`Future.wait`, unchanged since `004-pokedex-team-builder`) — passing it the whole index at once (up to ~900 ids for the largest National Dex) increases how many requests are in flight simultaneously at once, not how the port itself works. No port/contract signature changes.

**Project Type**: Single Flutter app (`mobile-app` + `web`), existing Hexagonal/DDD layering — this feature stays entirely inside the existing `team_builder` presentation layer (`TeamBuilderCubit`, `TeamBuilderState`, and a handful of widgets); no domain or application layer change.

**Scale/Scope**: Same National Dex scale as prior features (≈900+ species for the largest eligible games); 6-slot team, unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity & YAGNI**: This plan is net code *removal* on the loading side — `_batchSize`, `loadMoreIfNeeded`, `_resolveNextBatch`, `isLoadingMore`, `PokedexGridSliver.onLoadMore`/`_loadMoreLookahead`, and both scroll-notification trigger blocks all become dead once every entry resolves up front, and are deleted rather than left unused. The bar chart is the smallest widget that satisfies FR-001–FR-004 — plain proportional bars, no new dependency, no configurability beyond what the spec asks for. **PASS**.
- **II. Test-First Development**: Cubit tests asserting "resolves only the first ~20 ids" (the exact premise this feature reverses) are rewritten to assert full-index resolution *before* the Cubit change lands; the lookahead-trigger test file is deleted alongside the widget it tested, not left green-but-meaningless. **PASS** (enforced at task-breakdown/implementation time).
- **III. Clear Contracts & Interfaces**: `TeamBuilderCubit.loadMoreIfNeeded` is a public method being removed — an internal-app breaking change (this Cubit has no consumer outside this codebase), called out here and in `contracts/team_builder_cubit_full_load.md` with its full before/after, per Governance's versioning rule for the app's own version rather than a separately-versioned artifact. **PASS**.
- **IV. Code Quality & Review**: No change.
- **V. Observability & Versioning**: No new failure surface — full-index resolution reuses the exact same `PokedexUnavailable`/retry path `load()`/`_fetchAndApplyView` already have; a failure now fails the *whole* load instead of only the in-flight batch, which is FR-008's explicit requirement (retry the whole thing, not "some was fine"). **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD**: No port/domain change — `GetPokedexIndex`/`GetPokedexDetails` (application) and `PokedexRepository` (domain port)/`PokeApiPokedexRepository` (infrastructure) keep their existing signatures; only how the existing Cubit *calls* the already-existing `GetPokedexDetails` changes (a wider `pokemonIds` argument, not a new capability). The bar chart is presentation-only, same as `PokeballBackground`. **PASS**.

No violations requiring `Complexity Tracking`.

**Post-Phase-1 re-check**: `data-model.md` and `contracts/*.md` confirm the design stayed within the above — no new/changed domain type, one Cubit-internal simplification, one presentation-only widget. **PASS, unchanged.**

## Project Structure

### Documentation (this feature)

```text
specs/009-stats-chart-full-pokedex/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── team_builder_cubit_full_load.md
│   └── stats_bar_chart.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
└── presentation/
    └── team_builder/
        ├── cubit/
        │   ├── team_builder_cubit.dart    # AMENDED: load()/_fetchAndApplyView resolve the full index; loadMoreIfNeeded/_resolveNextBatch/isLoadingMore removed
        │   └── team_builder_state.dart    # AMENDED: isLoadingMore field removed (no longer meaningful — see research.md Decision 2)
        ├── pages/team_builder_page.dart              # AMENDED: scroll-notification "load more" trigger block removed
        └── widgets/
            ├── team_builder_two_pane_layout.dart      # AMENDED: same scroll-notification trigger block removed
            ├── pokedex_pane_slivers.dart               # AMENDED: PokedexGridSliver's onLoadMore/_loadMoreLookahead removed (its build-proximity trigger has nothing left to resolve)
            └── pokemon_customization_card.dart         # AMENDED: _StatsTable replaced by a bar-chart rendering (renamed/reworked, same resolveSlotStats input)

test/  # mirrors the above 1:1; existing structure (test/presentation/team_builder)
```

**Structure Decision**: Pure amendment/simplification of the existing single-Flutter-app `team_builder` presentation layer — no new top-level directory, package, or bounded context, and no domain/application/infrastructure change at all. Every touched file keeps its current location; the loading-side changes are a net deletion of the batching machinery `007`/`008` introduced.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
