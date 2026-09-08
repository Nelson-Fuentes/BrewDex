---

description: "Task list template for feature implementation"
---

# Tasks: Gráfico de Barras para Estadísticas y Pokédex Completa

**Input**: Design documents from `/specs/009-stats-chart-full-pokedex/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — Constitution Principle II requires updated/new tests for behavior this feature changes, and plan.md's Technical Context/Testing section commits to `flutter test` coverage for both stories.

**Organization**: Tasks are grouped by user story (US1, US2 — matching `spec.md`'s numbering, both Priority P1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- File paths are exact, relative to the repo root

## Path Conventions

Existing single Flutter app; this feature touches only `lib/presentation/team_builder/` and its mirrored `test/presentation/team_builder/` tree — no domain/application/infrastructure changes.

---

## Phase 1: Setup

No new project, dependency, or tooling setup — this feature amends existing `team_builder` presentation code in place (plan.md Technical Context: no new dependencies).

- [X] T001 Run `flutter test` at the repo root to confirm a clean baseline before any change in this feature (expect the one pre-existing, unrelated `test/widget_test.dart` failure noted in `008-configurador-equipo-correcciones`'s tasks.md — everything else should pass) — confirmed: 361 tests, 360 pass, only the known pre-existing failure

---

## Phase 2: Foundational

No cross-story blocking prerequisites — US1 (bar chart) and US2 (full Pokédex load) touch disjoint files (`pokemon_customization_card.dart` only vs. the Cubit/state/sliver/page/two-pane-layout files) and can be implemented and tested fully independently, in either order.

**Checkpoint**: No foundational work to wait on — proceed straight to either user story phase.

---

## Phase 3: User Story 1 - Ver las estadísticas base como gráfico de barras (Priority: P1)

**Goal**: The customization card's Base Stats section renders each of the six stats as a horizontal bar proportional to a shared fixed scale (255), with its label and exact value, instead of a plain text list (research.md Decisions 1–2, contracts/stats_bar_chart.md).

**Independent Test**: Open any Pokémon's customization card; each stat shows a proportional bar, a higher-value stat's bar is visibly longer than a lower-value one's, and switching to an alternate form updates all six bars in place.

### Tests for User Story 1

- [X] T002 [P] [US1] Added a new group to `test/presentation/team_builder/pokemon_customization_card_test.dart` asserting via `FractionallySizedBox.widthFactor` (simpler and more direct than `tester.getSize`, since the fill's `widthFactor` *is* the proportionality contract): (a) a higher-value stat's factor exceeds a lower-value one's and stays below 1.0, (b) a `0`-value stat's factor is still `> 0`, (c) a value at/above 255 clamps to exactly `1.0` — contracts/stats_bar_chart.md Verification
- [X] T003 [P] [US1] Extended the existing 008 form-change stats test in the same file to additionally capture and compare all six `FractionallySizedBox.widthFactor`s before/after the form change (not just the numeric text)
- **Discovered during T002/T003**: the taller bar-chart section pushed several existing 008-era controls (Shiny, Mega, Género, and two Forma-thumbnail taps) below the default 800×600 test viewport in `pokemon_customization_card_test.dart` and `pokemon_customization_card_reactivity_test.dart`; added `tester.ensureVisible(...)` before each affected tap in both files (7 call sites total) — not a new task, but necessary to keep both files green

### Implementation for User Story 1

- [X] T004 [US1] Replaced `_StatsTable` with `_StatsBarChart` (+ private `_StatBarRow`) in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` — same inputs (`AppLocalizations l10n`, `PokemonStats stats`), each row now a label + a `Stack`-based proportional bar (`Container` track + `FractionallySizedBox` fill, `ClipRRect`-rounded) + numeric value, built from plain layout widgets (no new dependency) per contracts/stats_bar_chart.md
- [X] T005 [US1] Added the private `_maxBaseStat = 255` reference constant and the `widthFactor` computation (`(value / maxValue).clamp(_minFillFraction, 1.0)`, `_minFillFraction = 0.02` guaranteeing a `0`-value stat still renders a visible sliver) in the same file (research.md Decision 2)
- [ ] T006 [US1] Manually verify (quickstart.md Scenario 1) against a species with a clearly lopsided stat spread that the bar-length comparison reads correctly at a glance

**Checkpoint**: User Story 1 is independently functional and testable — the customization card shows a real bar chart.

---

## Phase 4: User Story 2 - Pokédex disponible completa desde el principio (Priority: P1)

**Goal**: `load()`/`_fetchAndApplyView` resolve every entry of the active Pokédex index in the same single call they already make, instead of a 20-id batch — and the now-dead batch-trigger machinery (`loadMoreIfNeeded`, `_resolveNextBatch`, `isLoadingMore`, the grid's build-proximity trigger, both scroll-notification listeners) is deleted, not left unreachable (research.md Decisions 3–4, contracts/team_builder_cubit_full_load.md).

**Independent Test**: Open a game's National Dex; once the loading indicator clears, every tile (including the very last one) is already a real, tappable Pokémon with no placeholder anywhere, and a search for a species near the end of the list resolves instantly.

### Tests for User Story 2

- [X] T007 [P] [US2] Rewrote `test/presentation/team_builder/team_builder_cubit_pagination_test.dart`: `load()` resolves the entire index (25-entry fixture, larger than the old 20-id batch) in a single `getPokedexDetails` call; `updateSearch` no longer triggers any resolution of its own; the stale-in-flight-*view* discard test (unrelated to batching) stays and still passes
- [X] T008 [P] [US2] Updated `test/presentation/team_builder/team_builder_state_pagination_test.dart` — dropped the `isLoadingMore` group (field removed); every other assertion (`resolvedCount`, `visibleIndexEntries`, including the still-legitimate "unresolved entry matches by raw id" case, since `TeamBuilderState`'s filtering code itself is unchanged) kept as-is
- [X] T009 [P] [US2] Deleted `test/presentation/team_builder/widgets/pokedex_grid_sliver_lookahead_test.dart` in full
- [X] T010 [P] [US2] Rewrote `test/presentation/team_builder/team_builder_page_infinite_scroll_test.dart`: two scenarios (30-species short dex, 200-species large dex) both asserting full resolution with **zero** scroll gestures — replacing the old "short resolves without scroll / large needs a scroll" split
- [X] T011 [P] [US2] Updated `test/presentation/team_builder/widgets/team_builder_two_pane_layout_test.dart` — removed the `onLoadMore: () {}` argument from all three `TeamBuilderTwoPaneLayout` construction sites

### Implementation for User Story 2

- [X] T012 [US2] In `lib/presentation/team_builder/cubit/team_builder_cubit.dart`: amended `load()` to resolve `_getPokedexDetails` for the entire `index` (the roster-id union was dropped as redundant); amended `_fetchAndApplyView` the same way (kept skipping ids already resolved from a prior view, since that's a legitimate no-op-avoidance, not a batch limit); `updateSearch` is now a plain synchronous `emit` with no resolution step; deleted `loadMoreIfNeeded`, `_resolveNextBatch`, and the `_batchSize` constant
- [X] T013 [US2] In `lib/presentation/team_builder/cubit/team_builder_state.dart`: removed the `isLoadingMore` field, its `copyWith` parameter, and its `props` entry; updated the `resolvedEntries` doc comment to describe the new full-resolution invariant instead of "batch/search accumulation"
- [X] T014 [US2] In `lib/presentation/team_builder/widgets/pokedex_pane_slivers.dart`: removed `PokedexGridSliver.onLoadMore`/`_loadMoreLookahead` and its `addPostFrameCallback` trigger block; removed `buildPokedexPaneSlivers`'s `onLoadMore` parameter and both call sites' arguments to `PokedexGridSliver`. **Also removed during implementation** (a direct consequence, not separately tasked): `_PokedexPlaceholderTile` — once `load()`/`_fetchAndApplyView` only ever emit `index`+`resolvedEntries` together and fully resolved, `resolvedEntries[id]` is guaranteed non-null for every rendered tile, so the placeholder branch was truly unreachable; replaced with a defensive `SizedBox.shrink()` fallback documented as "should be unreachable" rather than deleting the null-check entirely
- [X] T015 [P] [US2] In `lib/presentation/team_builder/pages/team_builder_page.dart`: removed the `NotificationListener<ScrollNotification>` wrapper around the compact/medium `CustomScrollView` and the `onLoadMore` argument
- [X] T016 [P] [US2] In `lib/presentation/team_builder/widgets/team_builder_two_pane_layout.dart`: removed the same `NotificationListener<ScrollNotification>` wrapper, the `onLoadMore` constructor parameter, and its argument
- [ ] T017 [US2] Manually verify (quickstart.md Scenario 2) that a National Dex load shows a clear loading indicator, then resolves completely with zero placeholder tiles at any scroll position, and that rapidly re-toggling National Dex/DLC doesn't leave stale or mismatched data

**Checkpoint**: User Story 2 is independently functional — the Pokédex is either fully loaded or clearly loading, never partially placeholder-filled.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T018 Ran `flutter analyze` (whole project, including `integration_test/`) — no findings introduced by this feature; the 4 remaining infos are pre-existing (`curly_braces_in_flow_control_structures` in code this feature didn't touch or only shifted line numbers in)
- [X] T019 Ran the full `flutter test` suite — 359 tests, 358 pass; the 1 failure is the same pre-existing `test/widget_test.dart` baseline issue noted since `008-configurador-equipo-correcciones`'s T001
- [ ] T020 Walk through every scenario in `quickstart.md` manually (`flutter run -d chrome` or equivalent) and confirm each matches its "Expected" outcome

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first.
- **Foundational (Phase 2)**: Empty — no cross-story blocking work.
- **User Stories (Phase 3–4)**: US1 and US2 touch disjoint files and have no dependency on each other — either can be done first, or both in parallel by different developers.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### Within User Story 2

T007–T011 (tests) can be written in parallel with each other; T012 (the Cubit change) is the one task everything else in US2 implementation depends on — T013 is independent of T012 but small enough to do alongside it; T014 depends on T012 (its `onLoadMore` removal only makes sense once nothing calls it); T015/T016 depend on both T012 and T014.

### Parallel Opportunities

- US1 and US2 can be implemented fully in parallel (different developers, disjoint files).
- Within US1: T002/T003 (tests) are parallel with each other; T004/T005 are sequential (same file, same widget).
- Within US2: T007–T011 (tests, 5 different files) are all parallel with each other; T015/T016 are parallel with each other once T012/T014 land.

---

## Parallel Example: User Story 2 test updates

```bash
# All five test-file updates for US2 can be worked on simultaneously —
# each touches a different file and none depends on the others:
Task: "Rewrite team_builder_cubit_pagination_test.dart's full-load assertion"
Task: "Update team_builder_state_pagination_test.dart (drop isLoadingMore)"
Task: "Delete pokedex_grid_sliver_lookahead_test.dart"
Task: "Update team_builder_page_infinite_scroll_test.dart (no-scroll-needed assertion)"
Task: "Update team_builder_two_pane_layout_test.dart (drop onLoadMore arg)"
```

---

## Implementation Strategy

### MVP First

Both stories are P1 and independent — there is no meaningful "MVP subset" smaller than both. Recommended order (arbitrary, since they don't depend on each other): **US2 first** (it's the larger, more mechanical change and unblocks confidently deleting dead code before touching visuals), then **US1**.

### Incremental Delivery

1. Complete Setup.
2. US2 → validate (quickstart.md Scenario 2) → demo (Pokédex loads fully, no more batching).
3. US1 → validate (quickstart.md Scenario 1) → demo (stats render as bars) — **feature complete**.
4. Polish: `flutter analyze`, full `flutter test`, full quickstart walkthrough.

### Parallel Team Strategy

With two developers: one takes US1 (`pokemon_customization_card.dart` and its test only), the other takes US2 (the Cubit/state/sliver/page/two-pane-layout files and their five test files) — zero file overlap, no coordination needed until Polish.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps each task to its `spec.md` user story for traceability.
- Verify each new/updated test fails (or, for a deletion, that the code path it tested is actually gone) before its corresponding implementation task, then passes after (Constitution Principle II).
- Commit after each task or logical group; stop at either story's checkpoint to validate independently.
