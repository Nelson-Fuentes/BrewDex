---

description: "Task list template for feature implementation"
---

# Tasks: Correcciones de Configurador de Equipo (Tipos, Tarjeta, Legends Z-A y Cobertura)

**Input**: Design documents from `/specs/014-team-configurator-fixes-2/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — Constitution Principle II (Test-First Development) requires a failing-first regression test for every bug fix and tests for new public behavior, same pattern as `011`–`013`.

**Organization**: Tasks are grouped by user story (spec.md priorities) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US9)

## Path Conventions

Single Flutter project, Hexagonal/DDD layering (`lib/domain|application|infrastructure|presentation`, `test/` mirrors `lib/`) — unchanged from every prior feature.

---

## Phase 1: Setup

**Purpose**: No shared infrastructure/dependency setup is needed — every story below fixes/extends already-shipped surface with no new package.

None. Proceed directly to Phase 3 (US1).

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by more than one user story.

None — each story below touches its own file set with no shared blocking prerequisite (US6's `PokemonTypeIcon` change is consumed by US6's own two call sites only; no other story reads it). Proceed directly to Phase 3.

---

## Phase 3: User Story 1 - Los movimientos no se pierden al activar Dinamax o Mega (Priority: P1) 🎯 MVP

**Goal**: `TeamBuilderCubit.fetchMovepoolForActiveSlot` fetches the movepool for the *base* variety id, never the active Mega/Gigamax variety id, so `moveIds` is never wiped by a Mega/Dinamax toggle.

**Independent Test**: Assign 4 moves to a roster Pokémon, toggle Mega (or Dinamax/Gigamax) on and off — `moveIds` stays identical throughout (quickstart.md US1).

### Tests for User Story 1 ⚠️

- [X] T001 [US1] In `test/presentation/team_builder/team_builder_cubit_moves_test.dart` (actual path — `cubit/` subfolder doesn't exist under `test/presentation/team_builder/`), replaced the pre-existing "refetches the movepool when the active slot switches to its Mega form" test (which asserted the *buggy* `pikachu-mega` call) with a corrected version asserting `GetMovepool` is invoked with the base `varietyId` (`'pikachu'`), plus a new test asserting `moveIds` survive the Mega toggle end-to-end — per contracts/preserve_moves_on_mega_dynamax.md
- [X] T002 [P] [US1] In the same test file, added a control test proving switching to a genuinely different `formVarietyId` (not Mega/Gigamax) still clears a `moveIds` entry no longer learnable on the new form — guards against regressing the `011-forms-icons-moves` behavior this fix sits alongside

### Implementation for User Story 1

- [X] T003 [US1] In `lib/presentation/team_builder/cubit/team_builder_cubit.dart`'s `fetchMovepoolForActiveSlot`, `varietyId` now resolves to the base variety id (`entry.pokemonId`) only when `rosterEntry.megaActive || rosterEntry.gigamaxActive`; a plain alternate-form switch still uses `resolveSlotVarietyId(entry, rosterEntry)` unchanged (contracts/preserve_moves_on_mega_dynamax.md, research.md Decision 3 — contract doc updated to match this more precise condition)
- [X] T004 [US1] Ran `flutter test test/presentation/team_builder/team_builder_cubit_moves_test.dart` (13/13 pass) and the full `test/presentation/team_builder/` suite (150/150 pass, no regressions)

**Checkpoint**: User Story 1 fully functional and independently testable — verify via quickstart.md US1.

---

## Phase 4: User Story 2 - La tabla de Análisis de Cobertura vuelve a ser visible (Priority: P1)

**Goal**: `CoverageAnalysisPage` wraps its body in a vertical `SingleChildScrollView` so the (18+ row) `CoverageTable` is always reachable regardless of viewport height.

**Independent Test**: Open Coverage Analysis at a viewport shorter than the table's natural height — the last row is reachable by scrolling instead of being clipped off-screen (quickstart.md US2).

### Tests for User Story 2 ⚠️

- [X] T005 [US2] In `test/presentation/team_builder/coverage_analysis_page_test.dart` (actual path — no `pages/` subfolder under `test/`), added a regression test at a constrained `tester.view.physicalSize` (400×300): asserts a vertical `Scrollable` wraps the page body with real `maxScrollExtent` and is actually draggable — per contracts/coverage_analysis_page_scroll.md (an initial version asserting row-text-presence passed even against the unfixed code, since `find.text` matches clipped-off-screen widgets too — the vertical-`Scrollable`-with-extent assertion is what actually goes red/green)

### Implementation for User Story 2

- [X] T006 [US2] In `lib/presentation/team_builder/pages/coverage_analysis_page.dart`, wrapped `body: const CoverageTable()` in `SingleChildScrollView(child: CoverageTable())` (vertical, default axis) — `AdaptiveScaffold` and `CoverageTable`'s existing horizontal `SingleChildScrollView` untouched (contracts/coverage_analysis_page_scroll.md)
- [X] T007 [US2] Ran `flutter test test/presentation/team_builder/coverage_analysis_page_test.dart` — 2/2 pass

**Checkpoint**: User Story 2 fully functional and independently testable — verify via quickstart.md US2.

---

## Phase 5: User Story 3 - Feraligatr tiene movimientos en Leyendas Pokémon Z-A (Priority: P1)

**Goal**: `PokeApiMovepoolRepository` falls back to the closest available game's move data for a species when the primary game's version-group filter yields zero moves (confirmed data gap for Legends Z-A).

**Independent Test**: `fetchMovepool(varietyId: 'feraligatr', game: legendsZaGame, ...)` against a fixture with empty `legends-za` `version_group_details` but non-empty fallback-game entries returns a non-empty list (quickstart.md US3).

### Tests for User Story 3 ⚠️

- [X] T008 [P] [US3] In `test/infrastructure/team_builder/pokeapi_movepool_repository_test.dart`, added fixture-based regression tests: zero `version_group_details` entries for `legends-za` (but non-empty for other games) falls back to the union of every known move; `legends-za` entries already present are unaffected (no fallback); and the fallback is scoped to `legends-za` only (an unrelated game with zero matches still returns `[]`) — per contracts/legends_za_movepool_fallback.md
- [X] T009 [P] [US3] In the same test file, added the Feraligatr-specific regression test (both `fetchMovepool` and `fetchDefaultMoveset`) named in contracts/legends_za_movepool_fallback.md's Test Expectations

### Implementation for User Story 3

- [X] T010 [US3] In `lib/infrastructure/team_builder/pokeapi_movepool_repository.dart`, added `_movepoolFallbackGameIds = {'legends-za'}` and the fallback to `fetchMovepool`: when the `game.id`-filtered move list (`_movesLearnableIn`) is empty and `game.id` is fallback-enabled, falls back to `_allKnownMoves` (union across every game), logged via `developer.log` — per contracts/legends_za_movepool_fallback.md (updated to reflect the "union across every game" strategy actually implemented, simpler than picking one "closest" game)
- [X] T011 [US3] Applied the same fallback to `fetchDefaultMoveset`, extracting its per-game level-up computation into `_highestLevelUpMoves({required matchesGame})` so both the exact-match pass and the `matchesGame: (_) => true` fallback pass share one implementation
- [X] T012 [US3] Ran `flutter test test/infrastructure/team_builder/pokeapi_movepool_repository_test.dart` — 11/11 pass; `flutter analyze` on the changed file — no issues

**Checkpoint**: User Story 3 fully functional and independently testable — verify via quickstart.md US3.

---

## Phase 6: User Story 4 - La Mega Evolución está disponible en Leyendas Pokémon Z-A (Priority: P1)

**Goal**: Legends Z-A's `mega-dimension` Pokédex source is treated as always-active rather than an opt-in DLC toggle, so a Mega-capable roster Pokémon shows the Mega option by default in that game.

**Independent Test**: Fetching Legends Z-A's Pokédex for a species with a known Mega form resolves a non-null `megaForm` without the caller explicitly opting `mega-dimension` into `activeDlcIds` (quickstart.md US4).

### Tests for User Story 4 ⚠️

- [X] T013 [US4] In `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`, added a regression test in the existing "DLC (FR-018)" group: fetching Legends Z-A's Pokédex (with `mega-dimension` in `game.dlcs`) merges in a species only present in `mega-dimension`'s Pokédex, with `view: const PokedexView()` — i.e. `activeDlcIds` left empty/default — per contracts/legends_za_mega_availability.md
- [X] T014 [P] [US4] In the same test file, added a non-regression test confirming a Sword/Shield-shaped game with `the-isle-of-armor` still requires an explicit `activeDlcIds` opt-in (a 404 on `version-group/the-isle-of-armor/` in the mock proves it's never fetched without opt-in) — unaffected by this change

### Implementation for User Story 4

- [X] T015 [US4] In `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart`'s `_resolveDexRefs`, `validDlcIds` now intersects `game.dlcs` against `view.activeDlcIds.union(alwaysActiveDlcIds)`, where `alwaysActiveDlcIds = {'mega-dimension'}` only when `game.id == 'legends-za'` (`{}` otherwise) — documented inline as the one intentional exception to the opt-in DLC model (contracts/legends_za_mega_availability.md, research.md Decision 4)
- [X] T016 [P] [US4] Determined unnecessary after reading `pokemon_customization_card.dart`: its Mega button is gated purely on `entry.megaForm != null`, with no game-specific check of its own — and `PokeApiPokedexRepository`'s existing `kMegaEvolutionEnabledGameIds.contains(game.id)` classification gate (already covering `legends-za`, unchanged by this feature) is the only other gate, already exercised generically by `011-forms-icons-moves`' existing megaForm-classification tests. T013 alone closes the actual gap (the DLC data reaching that classification step at all); no separate widget-level test was needed on top of it.
- [X] T017 [US4] Ran `flutter test test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` — 35/35 pass; `flutter analyze` on the changed file — no issues

**Checkpoint**: User Story 4 fully functional and independently testable — verify via quickstart.md US4.

---

## Phase 7: User Story 5 - Tipos correctos en juegos de 5ª generación o anteriores (Priority: P1)

**Goal**: `PokeApiPokedexRepository` reads `pokemon.past_types` and uses the type set in effect for the active game's generation, so Fairy-type Pokémon show their pre-Fairy type(s) in Generation V-or-earlier games.

**Independent Test**: A Clefairy-shaped fixture resolves `typePrimary == Normal` for a Generation V game and `typePrimary == Fairy` for a Generation VI+ game (quickstart.md US5).

### Tests for User Story 5 ⚠️

- [X] T018 [US5] In `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`, added a regression test group: a Clefairy fixture (`types: [Fairy]`, `past_types: [{generation: generation-vi, types: [Normal]}]`) resolves `typePrimary.id == 'normal'`/`typeSecondary == null` for `game` (red-blue, generation-i) and `typePrimary.id == 'fairy'` for `xyGame` (generation-vi) — per contracts/pre_fairy_type_generations.md
- [X] T019 [P] [US5] In the same test group, added a test confirming a Charmander fixture with no `pastTypes` resolves `pokemon.types` unchanged (`fire`)
- [X] T020 [P] [US5] Determined unnecessary after reading `team_builder_cubit.dart`'s constructor: `game` is a constructor-only, immutable field — "switching the active game" necessarily constructs a new `TeamBuilderPage`/`TeamBuilderCubit` for the new game (never mutates an existing one in place), whose fresh `load()` re-fetches `resolvedEntries` from the repository fixed in T021 for the *new* game's generation. FR-007's "se actualizan" therefore falls out of the existing architecture with no cubit-level reconciliation code — verified by inspection, not by a test that would just be re-testing a mock's canned response.

### Implementation for User Story 5

- [X] T021 [US5] In `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart`, added `_resolveTypeRefs(pokemonBody, game)` — reads `pokemon.past_types`, reuses the existing `generationOrdinal` helper (via a throwaway `Generation` built from each entry's generation name — no extra request), and picks the smallest-ordinal entry still greater than `game`'s own ordinal; `_buildEntry` now calls it instead of reading `pokemonBody['types']` directly (contracts/pre_fairy_type_generations.md)
- [X] T022 [US5] N/A — folded into T020's finding (game-switch propagation needs no additional wiring)
- [X] T023 [US5] Ran `flutter test test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` — 38/38 pass; `flutter analyze` on the changed file — no issues

**Checkpoint**: User Story 5 fully functional and independently testable — verify via quickstart.md US5.

---

## Phase 8: User Story 6 - Tamaño de tipos consistente en slots y tarjeta (Priority: P2)

**Goal**: `PokemonTypeIcon` pins both `width` and `height` to `size`, so a non-square source icon can't render wider than intended — fixing both "two types don't fit one row on web" (team slot) and "card badges are smaller than the slot's" (customization card, whose redundant wrapping `SizedBox` is removed).

**Independent Test**: At a representative web viewport, a two-type Pokémon's slot renders both badges in one row with no overflow, and the same Pokémon's customization card renders its badges at the same size as the slot's (quickstart.md US6).

### Tests for User Story 6 ⚠️

- [X] T024 [P] [US6] In `test/presentation/team_builder/type_icon_resolution_test.dart` (actual path — the codebase's existing pre-013 pattern for testing `PokemonTypeIcon` in isolation, chosen over the existing pixel-position assertion in `team_slot_pokeball_and_types_test.dart`, which already passed pre-fix because the test env's failed `NetworkImage` falls back to a bundled, inherently-square `Icon` — it can't exercise a width-vs-height asymmetry that only a real, non-square network image triggers): added a regression test asserting the underlying `Image` widget's `width` AND `height` both equal `size` (`width` was `null` pre-fix) — per contracts/standard_type_badge_dimensions.md
- [X] T025 [P] [US6] In `test/presentation/team_builder/pokemon_customization_card_test.dart`, added a regression test (same `Image.width`/`Image.height` structural assertion, for the same reason as T024) proving the card's type badge is no longer squeezed narrower than the slot's

### Implementation for User Story 6

- [X] T026 [US6] In `lib/presentation/team_builder/widgets/type_icon_resolution.dart`'s `PokemonTypeIcon`, added `width: size` alongside the existing `height: size` on the `Image.network` call (contracts/standard_type_badge_dimensions.md, data-model.md)
- [X] T027 [P] [US6] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, removed the now-redundant `SizedBox(width: kStandardTypeIconSize, height: kStandardTypeIconSize, child: ...)` wrapper around the type row's `PokemonTypeIcon`, leaving the bare `PokemonTypeIcon(type: type, size: kStandardTypeIconSize)`
- [X] T028 [US6] Ran `flutter test test/presentation/team_builder/` — 153/153 pass; `flutter analyze` on both changed files — no issues

**Checkpoint**: User Story 6 fully functional and independently testable — verify via quickstart.md US6.

---

## Phase 9: User Story 7 - La imagen del Pokémon en la tarjeta se ve notoriamente más grande (Priority: P2)

**Goal**: The customization card's sprite grows from `168×168` to `224×224`, with the rest of the card's content still fully legible.

**Independent Test**: The card's sprite is visibly larger than `013`'s size, with name/types/moves/actions still unclipped (quickstart.md US7).

### Tests for User Story 7 ⚠️

- [X] T029 [US7] In `test/presentation/team_builder/pokemon_customization_card_test.dart` (actual path — no `widgets/` subfolder under `test/presentation/team_builder/`), updated the pre-existing `013` sprite-size test (168) to assert `224`, plus that the name text, a `PokemonTypeIcon`, and "Quitar del equipo" are all still present (contracts/sticky_form_action_row.md)

### Implementation for User Story 7

- [X] T030 [US7] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, changed the sprite `SizedBox(width: 168, height: 168, ...)` to `224×224` (contracts/sticky_form_action_row.md)
- [X] T031 [US7] Ran `flutter test test/presentation/team_builder/pokemon_customization_card_test.dart` — 44/44 pass

**Checkpoint**: User Story 7 fully functional and independently testable — verify via quickstart.md US7.

---

## Phase 10: User Story 8 - Eficacia de defensa en la tabla de cobertura (Priority: P2)

**Goal**: `CoverageTable` gains a `pokemonTypes` parameter and a defense-efficacy `DataColumn` computed from `type_effectiveness_chart.dart`, and `CoverageAnalysisPage` threads the currently-displayed card's resolved types through to it.

**Independent Test**: With a known single- or two-type Pokémon's types passed in, each attacking-type row shows the correct 0/0.5/1/2/4 multiplier, cross-checked against known matchups (quickstart.md US8).

### Tests for User Story 8 ⚠️

- [X] T032 [US8] In `test/presentation/team_builder/widgets/coverage_table_test.dart`, added regression tests per contracts/coverage_defense_column.md: a single-type `pokemonTypes` (`[Water]`) renders correct `0.5`/`1`/`2` values across known matchups; a two-type combination with a known double-weakness (`[Ice, Flying]` vs. Rock) renders `4`; a combination with a cancelling `0.5`×`2` renders `1`; a combination including an immunity renders `0`; `pokemonTypes: null`/empty omits the defense column entirely (read via the `DataTable` widget's own `columns`/`rows`, since `DataColumn`/`DataCell` aren't part of the widget tree `find.byType` can see)
- [X] T033 [P] [US8] In the same test file, added a test that changing `pokemonTypes` (simulating a different card's Pokémon) re-renders the column with the new values (FR-014)
- [X] T034 [P] [US8] In `test/presentation/team_builder/coverage_analysis_page_test.dart` (actual path), added tests that the page threads a given `pokemonTypes` straight through to `CoverageTable`, and defaults to `null` when unset

### Implementation for User Story 8

- [X] T035 [US8] In `lib/presentation/team_builder/widgets/coverage_table.dart`, added the `pokemonTypes` parameter and the defense-efficacy `DataColumn`/cell computation, reusing `typeEffectivenessAgainst` from `type_effectiveness_chart.dart` (no new effectiveness table) plus a `_formatMultiplier` helper for clean `0`/`0.5`/`1`/`2`/`4` text
- [X] T036 [US8] Added the `coverageAnalysisDefenseColumnHeader` key (translated per locale, e.g. "Eficacia de defensa" in `app_es.arb`) to all 10 `lib/l10n/*.arb` files, ran `flutter gen-l10n` to regenerate `lib/l10n/generated/`, and confirmed `dart run tool/check_arb_completeness.dart` reports full coverage
- [X] T037 [US8] In `lib/presentation/team_builder/pages/coverage_analysis_page.dart`, added the `pokemonTypes` parameter, threaded to `CoverageTable`; in `lib/presentation/team_builder/pages/team_builder_page.dart`, the app-bar action now reads the active slot (if any) from `TeamBuilderCubit.state` and resolves its types via the existing `resolveSlotTypes` before navigating, so opening Coverage Analysis while a customization card is open reflects that card's Pokémon (data-model.md's `CoverageAnalysisPage` section)
- [X] T038 [US8] Ran `flutter test test/presentation/team_builder/` — 161/161 pass; `flutter analyze lib/presentation/team_builder` — no new issues (3 pre-existing lint infos, unrelated files)

**Checkpoint**: User Story 8 fully functional and independently testable — verify via quickstart.md US8.

---

## Phase 11: User Story 9 - Botones de Mega/Dinamax/Shiny sticky (Priority: P3)

**Goal**: The Mega/Dinamax/Shiny toggle row moves into the customization card's existing fixed footer, stacked above "Quitar del equipo", so both stay visible while the card's body scrolls.

**Independent Test**: On a card with enough content to require scrolling, the Mega/Dinamax/Shiny row and "Quitar del equipo" both remain hit-testable after scrolling the body (quickstart.md US9).

### Tests for User Story 9 ⚠️

- [X] T039 [US9] In `test/presentation/team_builder/pokemon_customization_card_test.dart`, added a regression test (same drag/scroll technique `013` used for the sticky "Quitar del equipo" test): after scrolling, both the Mega button and "Quitar del equipo" keep their pre-scroll position and don't overlap each other — per contracts/sticky_form_action_row.md

### Implementation for User Story 9

- [X] T040 [US9] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, moved the Mega/Dinamax/Shiny toggle `if` block out of the scrollable body `Column` and into the fixed footer's `Column`, stacked above "Quitar del equipo" (contracts/sticky_form_action_row.md) — no change to the toggle row's own widgets/behavior
- [X] T041 [US9] Ran `flutter test test/presentation/team_builder/` — 162/162 pass, no regressions (including US7's and `013`'s sticky-footer tests)

**Checkpoint**: User Story 9 fully functional and independently testable — verify via quickstart.md US9. All nine user stories now complete.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [X] T042 [P] Ran `flutter analyze` — 4 pre-existing `curly_braces_in_flow_control_structures` infos, none in code this feature touched; no new warnings introduced
- [X] T043 Ran the full `flutter test` suite — 464/464 pass, no regressions across `001`–`013`'s existing tests
- [~] T044 Not run — no running app instance/browser available in this environment to walk quickstart.md's manual scenarios by hand; every scenario's underlying behavior is covered by an automated regression test added in T001–T041 instead (see each user story's Tests subsection above for the specific test). Recommend a manual pass through quickstart.md before/at release as a final sanity check.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — empty, proceed directly to Phase 3.
- **Foundational (Phase 2)**: None — empty, proceed directly to Phase 3.
- **User Stories (Phase 3–11)**: Each is independent of the others (no shared blocking prerequisite) and may proceed in any order or in parallel if staffed. Priority order (P1 first) is US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8 → US9.
- **Polish (Phase 12)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1–US5 (P1)**: Each independent — no dependency on any other story.
- **US6–US8 (P2)**: Each independent. US8 (defense column) reads `type_effectiveness_chart.dart` only — no dependency on US2 (page scroll fix), though both touch `coverage_analysis_page.dart`; implement US2 first if working sequentially to avoid a same-file merge, but neither blocks the other's own tests/logic.
- **US9 (P3)**: Independent, though it and US7 both edit `pokemon_customization_card.dart` — implement in either order, but not truly in parallel by two people without coordinating that one file (same caveat `013` already noted for that file).

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle II).
- Repository/cubit changes before widget changes that consume them (e.g. US8: `coverage_table.dart` before `coverage_analysis_page.dart`).
- Story complete before moving to the next priority, if working sequentially.

### Parallel Opportunities

- US1–US9 can each be assigned to a different contributor in parallel once picked up — coordinate on `pokemon_customization_card.dart` (US6, US7, US9 all touch it, in disjoint sections) and `coverage_analysis_page.dart` (US2, US8); every other story's files are untouched by any other story.
- Within a story, test tasks marked [P] can run in parallel; within US3–US5's implementation, the repository fixes are single-file and sequential with their own tests but independent across stories.

---

## Parallel Example: User Story 1

```bash
# Tests for User Story 1:
Task: "Add Mega/Dinamax move-preservation regression test in test/presentation/team_builder/cubit/team_builder_cubit_test.dart"
Task: "Add form-switch-still-clears-moves control test in the same file"

# Then, once both fail for the right reason:
Task: "Fix fetchMovepoolForActiveSlot's varietyId in lib/presentation/team_builder/cubit/team_builder_cubit.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001–T004).
2. **STOP and VALIDATE**: quickstart.md US1 — the most disruptive bug (silent data loss) is fixed.
3. Deploy/demo if ready.

### Incremental Delivery

1. Add US1 → validate → demo (MVP: moves survive Mega/Dinamax).
2. Add US2 → validate → demo (Coverage Analysis reachable again).
3. Add US3 → validate → demo (Feraligatr, and any similarly-affected species, usable in Legends Z-A).
4. Add US4 → validate → demo (Mega Evolution available in Legends Z-A).
5. Add US5 → validate → demo (correct pre-Fairy types in old-generation games).
6. Add US6 → validate → demo (type badges fit two-per-row on web, card matches slot).
7. Add US7 → validate → demo (bigger card sprite).
8. Add US8 → validate → demo (defense-efficacy column).
9. Add US9 → validate → demo (sticky Mega/Dinamax/Shiny row).

### Parallel Team Strategy

With multiple contributors: assign US1–US9 to different contributors in parallel — coordinate on `pokemon_customization_card.dart` (US6/US7/US9) and `coverage_analysis_page.dart` (US2/US8) as noted above; every other story's files are untouched by any other story.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Every user story is independently completable and testable, per spec.md.
- Tests are written first and MUST fail before their implementation task, per Constitution Principle II.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
