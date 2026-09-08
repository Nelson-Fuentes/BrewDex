---

description: "Task list template for feature implementation"
---

# Tasks: Slots 3×2 sin Espacio Desperdiciado, Íconos ×4, Movimientos por Defecto y Filtro Ocultable

**Input**: Design documents from `/specs/012-slots-icons-moves-defaults/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — Constitution Principle II (Test-First Development) requires tests for business logic/public interfaces, following the same pattern as `011-forms-icons-moves`.

**Organization**: Tasks are grouped by user story (spec.md priorities) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)

## Path Conventions

Single Flutter project, Hexagonal/DDD layering (`lib/domain|application|infrastructure|presentation`, `test/` mirrors `lib/`) — unchanged from every prior feature.

---

## Phase 1: Setup

**Purpose**: No shared infrastructure/dependency setup is needed — every story below builds directly on `011-forms-icons-moves`'s already-shipped surface with no new package or cross-cutting scaffolding.

None. Proceed directly to Phase 3 (US1).

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by more than one user story.

None — every user story below touches its own files with no shared blocking prerequisite, same posture as `011`'s tasks.md. Proceed directly to Phase 3.

---

## Phase 3: User Story 1 - Los slots del equipo se ven en una cuadrícula 3×2, sin espacio desperdiciado (Priority: P1) 🎯 MVP

**Goal**: The two-pane/web team-slots grid renders 3 columns × 2 rows, each slot ~1.5× larger than the current (`011`) 2-column version, with no wasted padding around it.

**Independent Test**: Open the armador at a wide viewport — 6 slots in 3×2, no visible dead margin, each slot noticeably larger (quickstart.md Scenario 1).

### Tests for User Story 1 ⚠️

- [X] T001 [P] [US1] Update `test/presentation/team_builder/widgets/team_slot_row_test.dart`: a `TeamSlotRow` with `shrinkWrap: false` pumped inside a `SizedBox` of known width/height renders a `GridView` whose delegate is `SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: X)`, where `X` matches the formula in contracts/team_slots_3x2.md for that `SizedBox`'s dimensions; the `shrinkWrap: true` case still renders `crossAxisCount: 3` with the default square aspect (unchanged)
- [X] T002 [P] [US1] Add/update a test in `test/presentation/team_builder/widgets/team_builder_two_pane_layout_test.dart` (create if it does not already exist) asserting the slots-side subtree contains no `Padding` wider than a small deliberate value between the column's outer bound and `TeamSlotRow`, per contracts/team_slots_3x2.md

### Implementation for User Story 1

- [X] T003 [US1] In `lib/presentation/team_builder/widgets/team_slot_row.dart`, wrap the `shrinkWrap: false` rendering path in a `LayoutBuilder` and replace `GridView.count` with `GridView.builder` + `SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: computed, mainAxisSpacing: 8, crossAxisSpacing: 8)`, computing `childAspectRatio` from `constraints.maxWidth`/`constraints.maxHeight` per the formula in contracts/team_slots_3x2.md; leave the `shrinkWrap: true` path's `GridView.count(crossAxisCount: 3, ...)` unchanged (depends on T001 existing and failing first)
- [X] T004 [US1] In `lib/presentation/team_builder/widgets/team_builder_two_pane_layout.dart`, remove (or reduce to ≤4) the `Padding(all: 16)` wrapping the slots-side `TeamSlotRow` (depends on T002 existing and failing first)
- [X] T005 [US1] Run `flutter test test/presentation/team_builder/widgets/team_slot_row_test.dart test/presentation/team_builder/widgets/team_builder_two_pane_layout_test.dart` and confirm T001/T002 pass

**Checkpoint**: User Story 1 fully functional and independently testable — verify via quickstart.md Scenario 1.

---

## Phase 4: User Story 2 - Los íconos de tipo se ven claramente grandes (×4) (Priority: P1)

**Goal**: Every `PokemonTypeIcon` call site renders exactly 4× its `011` size.

**Independent Test**: Compare icon sizes before/after in all three UI locations (quickstart.md Scenario 2).

### Tests for User Story 2 ⚠️

- [X] T006 [P] [US2] Update `test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart`'s size assertions: type badge 32→128, Tera Type badge 24→96, per contracts/type_icon_sizes_x4.md
- [X] T007 [P] [US2] Update `test/presentation/team_builder/pokemon_customization_card_test.dart`'s type-row and `_WeaknessCell` size assertions: 48→192 and 32→128 respectively, per contracts/type_icon_sizes_x4.md
- [X] T008 [P] [US2] Update `test/presentation/team_builder/pokedex_type_filter_test.dart`'s `_TypeTile` icon-size expectation: 52→208, per contracts/type_icon_sizes_x4.md

### Implementation for User Story 2

- [X] T009 [P] [US2] In `lib/presentation/team_builder/widgets/team_slot.dart`, bump type badge size 32→128 and Tera Type badge 24→96 (depends on T006)
- [X] T010 [P] [US2] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, bump the type-row icon (and wrapping `SizedBox`) 48→192, and `_WeaknessCell`'s icon (and `SizedBox`) 32→128 (depends on T007)
- [X] T011 [P] [US2] In `lib/presentation/team_builder/widgets/pokedex_type_filter.dart`, bump `_TypeTile`'s icon 52→208 and grow its `BoxConstraints` proportionally so the icon is never clipped (depends on T008)
- [X] T012 [US2] Run `flutter test test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart test/presentation/team_builder/pokemon_customization_card_test.dart test/presentation/team_builder/pokedex_type_filter_test.dart` and confirm T006–T008 pass

**Checkpoint**: User Stories 1–2 both independently functional — verify via quickstart.md Scenario 2.

---

## Phase 5: User Story 3 - Los movimientos se llenan automáticamente al agregar un Pokémon (Priority: P1)

**Goal**: Adding a Pokémon to the team auto-fills its 4 move slots with its last (highest-level) level-up moves for the active game.

**Independent Test**: Add a Pokémon with known level-up moves — its 4 slots are pre-filled with the correct moves; a later manual change is never reverted (quickstart.md Scenario 3).

### Tests for User Story 3 ⚠️

- [X] T013 [P] [US3] Contract test in `test/infrastructure/team_builder/pokeapi_movepool_repository_test.dart`: `fetchDefaultMoveset` on a fixture with level-up moves at levels 1/15/36/50/58 (target game) returns exactly `[level15Move, level36Move, level50Move, level58Move]` ascending, dropping level 1; a move whose only target-game entry is `machine` (TM) is excluded even if it's level-up in another game; a variety with no level-up moves for the target game returns `[]` — per contracts/default_moveset.md
- [X] T014 [US3] Test in `test/presentation/team_builder/team_builder_cubit_moves_test.dart`: `addPokemon('bulbasaur')` against a fixture `GetDefaultMoveset` mock returning 4 moves results in the new roster entry's `moveIds` matching those 4 ids; a subsequent `selectMove`/`clearMoveSlot` on that slot is never reverted by a second automatic assignment — per contracts/default_moveset.md

### Implementation for User Story 3

- [X] T015 [US3] Add `fetchDefaultMoveset({varietyId, game, languageCode})` to `lib/domain/team_builder/ports/movepool_repository.dart`, per data-model.md
- [X] T016 [US3] Implement `fetchDefaultMoveset` in `lib/infrastructure/team_builder/pokeapi_movepool_repository.dart`: reuse the existing `pokemon/{varietyId}` fetch, filter `moves[].version_group_details[]` by `version_group.name == game.id && move_learn_method.name == 'level-up'`, keep each move's highest qualifying `level_learned_at`, sort ascending, take the last 4, resolve full `Move` detail via the existing `_fetchMove` (depends on T013 existing and failing first, T015)
- [X] T017 [P] [US3] Create `lib/application/team_builder/use_cases/get_default_moveset.dart` (`GetDefaultMoveset`), mirroring `get_movepool.dart`'s shape exactly, per data-model.md (depends on T015)
- [X] T018 [US3] Wire `GetDefaultMoveset` into `TeamBuilderCubit`'s constructor (optional param, same `null`-safe posture as `getMovepool`) in `lib/presentation/team_builder/cubit/team_builder_cubit.dart`, and extend `addPokemon` to resolve it for the newly-appended roster entry and set that entry's `moveIds` (padded to 4) before persisting/emitting — a `PokedexUnavailable` here must not fail the add itself, per contracts/default_moveset.md (depends on T014 existing and failing first, T016, T017)
- [X] T019 [US3] Wire `GetDefaultMoveset` into the `TeamBuilderCubit` construction site in `lib/presentation/game_selection/pages/game_selection_page.dart`, mirroring how `getMovepool` is already wired there
- [X] T020 [US3] Run `flutter test test/infrastructure/team_builder/pokeapi_movepool_repository_test.dart test/presentation/team_builder/team_builder_cubit_moves_test.dart` and confirm T013/T014 pass

**Checkpoint**: User Stories 1–3 all independently functional — verify via quickstart.md Scenario 3.

---

## Phase 6: User Story 4 - El filtro por tipo en la selección de movimientos está oculto por defecto (Priority: P2)

**Goal**: `MoveSelectionSheet`'s type filter starts hidden, revealed by a toggle; hiding it again clears the active filter.

**Independent Test**: Open the sheet — no filter visible; toggle on — filter appears and works; toggle off — filter hides and full list reappears (quickstart.md Scenario 4).

### Tests for User Story 4 ⚠️

- [X] T021 [US4] Update `test/presentation/team_builder/pokemon_customization_card_test.dart`'s (or a new dedicated `move_selection_sheet_test.dart`'s) move-selection-sheet tests: a freshly-opened sheet shows no type-filter tile; toggling a new switch on reveals the tiles and filters as before; selecting a type then toggling the switch off hides the tiles AND restores the full unfiltered list — per contracts/move_type_filter_toggle.md

### Implementation for User Story 4

- [X] T022 [US4] In `lib/presentation/team_builder/widgets/move_selection_sheet.dart`, add a `_showTypeFilter` bool (default `false`) to `_MoveSelectionSheetState`, a `Switch`/`SwitchListTile` toggling it, gate the existing type-filter `Wrap` on it, and clear `_typeFilter` in the same `setState` when turning it off, per contracts/move_type_filter_toggle.md (depends on T021 existing and failing first)
- [X] T023 [US4] Run the tests touched by T021 and confirm they pass

**Checkpoint**: User Stories 1–4 all independently functional — verify via quickstart.md Scenario 4.

---

## Phase 7: User Story 5 - Cada movimiento ocupa todo el ancho de la tarjeta (Priority: P2)

**Goal**: The 4 move-slot tiles in the customization card span the card's full width, stacked vertically.

**Independent Test**: Open a card with filled move slots — each tile spans the card's content width, stacked top-to-bottom (quickstart.md Scenario 5).

### Tests for User Story 5 ⚠️

- [X] T024 [US5] Update `test/presentation/team_builder/pokemon_customization_card_test.dart`'s Moves-section tests: a pumped card's 4 move-slot tiles measure the card's content width (not a fixed 160), and their vertical positions are strictly increasing (top-to-bottom), per contracts/full_width_move_slots.md

### Implementation for User Story 5

- [X] T025 [US5] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, replace the Moves section's `Wrap` with a `Column` of full-width `_MoveSlotTile`s (remove `_MoveSlotTile`'s fixed `width: 160`), with vertical spacing between them, per contracts/full_width_move_slots.md (depends on T024 existing and failing first)
- [X] T026 [US5] Run the tests touched by T024 and confirm they pass

**Checkpoint**: All 5 user stories independently functional — verify via quickstart.md Scenario 5.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Full-suite validation across every story, matching the closing step of every prior feature in this repo.

- [X] T027 Run `flutter test` for the entire suite and confirm no regressions beyond the one pre-existing, unrelated `test/widget_test.dart` failure — 428/428 pass plus that one known failure. Along the way, fixed two pre-existing tests (`team_slot_test.dart`, `official_type_icons_rendering_test.dart`) that pumped `TeamSlot` inside a tiny fixed 100×100 `SizedBox` — a fixture size that predates the ×4 icon growth and started overflowing; grown to 400×400 since it was never about those tests' own assertions.
- [X] T028 Run `flutter analyze` and confirm no new findings beyond the pre-existing baseline — confirmed identical (4 pre-existing info lints + 1 pre-existing `test/widget_test.dart` error)
- [ ] T029 Walk through quickstart.md's 5 manual validation scenarios end-to-end in a running app instance (left for the user, per the established pattern in every prior feature this session)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** / **Foundational (Phase 2)**: Both empty — proceed directly to Phase 3.
- **User Stories (Phases 3–7)**: All 5 are mutually independent — no user story's implementation tasks depend on another story's tasks completing first.
- **Polish (Phase 8)**: Depends on every user story phase being complete.

### User Story Dependencies

- **US1 (P1)**, **US2 (P1)**, **US4 (P2)**, **US5 (P2)**: No dependency on any other story.
- **US3 (P1)**: No dependency on any other story's *tasks*, but its `TeamBuilderCubit` constructor change (T018) touches the same class `011`'s `getMovepool`/`selectMove`/`clearMoveSlot` already live in — implement sequentially with care if working on US3 and any earlier `011`-era Cubit change concurrently, though no rebase conflict is expected since this only adds a new optional constructor param and extends `addPokemon`.

### Within Each User Story

- Tests written and failing before their corresponding implementation task, per Constitution Principle II.
- Port method before infrastructure adapter before application use case before Cubit wiring (US3's T015 → T016 → T017 → T018 → T019).

### Parallel Opportunities

- T001 and T002 (different files) can run in parallel within US1.
- T006, T007, T008 (different test files) can run in parallel within US2; their corresponding implementation tasks T009, T010, T011 (different files) can then also run in parallel.
- T013 (repository test) can run in parallel with drafting T014 (Cubit test) within US3, though T016 depends on T013 first and T018 depends on T014 first.
- Once Phase 2 completes (immediately, since it's empty), all 5 user story phases can be worked in parallel across contributors.

---

## Parallel Example: User Story 2

```bash
# Launch all three icon-size tests together:
Task: "Update type badge/Tera size assertions in test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart"
Task: "Update type row/weakness cell size assertions in test/presentation/team_builder/pokemon_customization_card_test.dart"
Task: "Update type filter tile size assertion in test/presentation/team_builder/pokedex_type_filter_test.dart"

# Then launch all three corresponding size bumps together:
Task: "Bump TeamSlot icon sizes in lib/presentation/team_builder/widgets/team_slot.dart"
Task: "Bump PokemonCustomizationCard icon sizes in lib/presentation/team_builder/widgets/pokemon_customization_card.dart"
Task: "Bump PokedexTypeFilter icon size in lib/presentation/team_builder/widgets/pokedex_type_filter.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001–T005).
2. **STOP and VALIDATE**: quickstart.md Scenario 1.
3. Deploy/demo if ready — this alone fixes the most visible layout complaint (wasted space, wrong grid shape).

### Incremental Delivery

1. Add US1 → validate → demo (MVP).
2. Add US2 → validate → demo (×4 icons).
3. Add US3 → validate → demo (default movesets — the most valuable functional addition).
4. Add US4 → validate → demo (hideable filter).
5. Add US5 → validate → demo (full-width move slots).

### Parallel Team Strategy

With multiple contributors: assign US1–US5 to different contributors in parallel — none touches another story's files except the shared `pokemon_customization_card_test.dart`/`pokemon_customization_card.dart` (US2 and US5 both touch these, in disjoint sections — coordinate if working concurrently).

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Every user story is independently completable and testable, per spec.md.
- Tests are written first and MUST fail before their implementation task, per Constitution Principle II.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
