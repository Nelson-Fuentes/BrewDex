---

description: "Task list template for feature implementation"
---

# Tasks: Formas por Juego, Reparación de Megaevolución, Slots más Grandes, Íconos y Movimientos

**Input**: Design documents from `/specs/011-forms-icons-moves/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — Constitution Principle II (Test-First Development) requires tests for business logic/public interfaces, and Principle II explicitly requires a regression test for the User Story 2 bug fix.

**Organization**: Tasks are grouped by user story (spec.md priorities) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)

## Path Conventions

Single Flutter project, Hexagonal/DDD layering (`lib/domain|application|infrastructure|presentation`, `test/` mirrors `lib/`) — unchanged from every prior feature.

---

## Phase 1: Setup

**Purpose**: Verify the live PokeAPI ids research.md's Decision 1 assumes, before any code depends on them.

- [X] T001 Verify live against `GET https://pokeapi.co/api/v2/version-group?limit=100` the exact `version-group` (i.e. `Game.id`) spellings for every game listed in data-model.md's `kMegaEvolutionEnabledGameIds`/`kGigamaxEnabledGameIds` (`x-y`, `omega-ruby-alpha-sapphire`, `sun-moon`, `ultra-sun-ultra-moon`, `legends-za`, `sword-shield`); correct data-model.md if any spelling differs from what PokeAPI actually returns

**Checkpoint**: Confirmed game-id spellings ready for Phase 3 (US1).

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by more than one user story.

None — every user story below touches its own files with no shared blocking prerequisite (spec.md's user stories are independent by design; the one piece of genuinely new shared vocabulary, the `Move` value object, is needed only by User Story 5 and is created within that story's own phase). Proceed directly to Phase 3.

**Checkpoint**: N/A — no foundational phase blocks the user stories below.

---

## Phase 3: User Story 1 - Solo se ofrecen formas que existen en el juego activo (Priority: P1) 🎯 MVP

**Goal**: Mega Evolution/Gigamax stop appearing as selectable options in a `PokedexEntry` resolved for a game whose generation/version doesn't actually have that mechanic.

**Independent Test**: Open a Mega-capable Pokémon's customization card under "Rojo Fuego/Verde Hoja" — no Mega button; under "X/Y" — Mega button appears (quickstart.md Scenario 1).

### Tests for User Story 1 ⚠️

- [X] T002 [P] [US1] Unit test `kMegaEvolutionEnabledGameIds`/`kGigamaxEnabledGameIds` membership for the games listed in contracts/form_availability_by_game.md's example table, in `test/domain/team_builder/value_objects/form_availability_test.dart`
- [X] T003 [US1] Repository test in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`: a fixture species with both a Mega and a Gigamax variety resolved against a `firered-leafgreen`-like `Game` yields `megaForm == null && gigamaxForm == null`; resolved against an `x-y`-like `Game` yields `megaForm != null`; resolved against a `sword-shield`-like `Game` yields `gigamaxForm != null && megaForm == null` (contracts/form_availability_by_game.md Test Expectations)

### Implementation for User Story 1

- [X] T004 [P] [US1] Create `lib/domain/team_builder/value_objects/form_availability.dart` with `const Set<String> kMegaEvolutionEnabledGameIds` and `const Set<String> kGigamaxEnabledGameIds` per data-model.md (using the ids verified in T001)
- [X] T005 [US1] Amend `_classifyOtherVarieties` in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` so a variety classified `mega` is only assigned to `megaForm` when `game.id ∈ kMegaEvolutionEnabledGameIds`, and a variety classified `gigamax` is only assigned to `gigamaxForm` when `game.id ∈ kGigamaxEnabledGameIds` — otherwise the variety is dropped entirely (never falls back into `selectableForms`), per contracts/form_availability_by_game.md (depends on T004)
- [X] T006 [US1] Run `flutter test test/domain/team_builder/value_objects/form_availability_test.dart test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` and confirm T002/T003 pass

**Checkpoint**: User Story 1 fully functional and independently testable — verify via quickstart.md Scenario 1.

---

## Phase 4: User Story 2 - Se puede volver a la forma base después de activar Megaevolución (Priority: P1)

**Goal**: The Mega/Gigamax buttons toggle their own state instead of only ever forcing it on, fixing the "stuck in Mega form" bug.

**Independent Test**: Activate Mega, then deactivate it from the same button, repeated 5 times — the Pokémon reverts to base form every time (quickstart.md Scenario 2, SC-002).

### Tests for User Story 2 ⚠️

> Written first — this regression test MUST fail against the current always-`true` `onPressed`, then pass once T008 lands.

- [X] T007 [US2] Widget test in `test/presentation/team_builder/pokemon_customization_card_test.dart`: pump a Mega-capable entry, tap the Mega button, assert `megaActive == true`; tap it again, assert `megaActive == false` and that the rendered sprite/types/stats match the base form's — repeat the tap-toggle cycle a third time and assert `megaActive == true` again (contracts/mega_gigamax_toggle.md Test Expectations)

### Implementation for User Story 2

- [X] T008 [US2] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, change the Mega `_StateIconButton.onPressed` to `onChanged(rosterEntry.copyWith(megaActive: !rosterEntry.megaActive, gigamaxActive: false))` and the Gigamax one to `onChanged(rosterEntry.copyWith(gigamaxActive: !rosterEntry.gigamaxActive, megaActive: false))`, per contracts/mega_gigamax_toggle.md (depends on T007 existing and failing first)
- [X] T009 [US2] Run `flutter test test/presentation/team_builder/pokemon_customization_card_test.dart` and confirm T007 passes

**Checkpoint**: User Stories 1 and 2 both independently functional — verify via quickstart.md Scenario 2.

---

## Phase 5: User Story 3 - Los espacios del equipo se ven mucho más grandes en la versión web (Priority: P1)

**Goal**: Each of the 6 team slots in the two-pane/web layout renders at least double its previous area.

**Independent Test**: Compare a rendered `TeamSlot`'s measured size in the two-pane layout before/after — at least double (quickstart.md Scenario 3, SC-003).

### Tests for User Story 3 ⚠️

- [X] T010 [P] [US3] Test in `test/presentation/team_builder/widgets/team_slot_row_test.dart` (create if it does not already exist): a `TeamSlotRow` with `shrinkWrap: false` renders a `GridView` with `crossAxisCount == 2`; a `TeamSlotRow` with `shrinkWrap: true` (default) still renders `crossAxisCount == 3`, per contracts/team_slot_sizing.md

### Implementation for User Story 3

- [X] T011 [US3] In `lib/presentation/team_builder/widgets/team_slot_row.dart`, change `GridView.count`'s `crossAxisCount` to `shrinkWrap ? 3 : 2` (depends on T010 existing and failing first)
- [X] T012 [US3] Run `flutter test test/presentation/team_builder/widgets/team_slot_row_test.dart` and confirm T010 passes

**Checkpoint**: User Stories 1–3 all independently functional — verify via quickstart.md Scenario 3.

---

## Phase 6: User Story 4 - Los íconos de tipo son grandes, claros y con la calidad oficial de Escarlata/Púrpura (Priority: P2)

**Goal**: Every `PokemonTypeIcon` call site (team slot, customization card type row and weakness table, Pokédex type filter) renders considerably larger, still resolving the Scarlet/Violet source.

**Independent Test**: Compare icon sizes before/after in all three UI locations (quickstart.md Scenario 4, SC-004).

### Tests for User Story 4 ⚠️

- [X] T013 [P] [US4] Update the size assertion in `test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart` (`shows the selected form's types, up to 2`) from `expect(typeIcon.size, 20)` to `expect(typeIcon.size, 32)`, and add/adjust an assertion for the Tera Type badge's size (16 → 24), per contracts/type_icon_sizes.md
- [X] T014 [P] [US4] Update `test/presentation/team_builder/pokemon_customization_card_test.dart`'s existing type-row and `_WeaknessCell` size assertions (if present) to 48 and 32 respectively, adding them if not already covered, per contracts/type_icon_sizes.md
- [X] T015 [P] [US4] Update `test/presentation/team_builder/pokedex_type_filter_test.dart`'s `_TypeTile` icon-size expectation from 40 to 52, per contracts/type_icon_sizes.md

### Implementation for User Story 4

- [X] T016 [P] [US4] In `lib/presentation/team_builder/widgets/team_slot.dart`, bump the type badge `PokemonTypeIcon` size from 20 to 32 and the Tera Type badge from 16 to 24 (depends on T013)
- [X] T017 [P] [US4] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, bump the type-row `PokemonTypeIcon` size (and its wrapping `SizedBox`) from 36 to 48, and `_WeaknessCell`'s icon (and its `SizedBox`) from 24 to 32 (depends on T014)
- [X] T018 [P] [US4] In `lib/presentation/team_builder/widgets/pokedex_type_filter.dart`, bump `_TypeTile`'s `PokemonTypeIcon` size from 40 to 52 and grow its `BoxConstraints(minHeight: 48, minWidth: 64)` proportionally so the larger icon is never clipped (depends on T015)
- [X] T019 [US4] Run `flutter test test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart test/presentation/team_builder/pokemon_customization_card_test.dart test/presentation/team_builder/pokedex_type_filter_test.dart` and confirm T013–T015 pass

**Checkpoint**: User Stories 1–4 all independently functional — verify via quickstart.md Scenario 4.

---

## Phase 7: User Story 5 - Elegir y ver los movimientos de un Pokémon en la tarjeta (Priority: P1)

**Goal**: A new Movimientos section in the customization card with 4 move slots, backed by a per-game-filtered movepool, with a type-filterable selection sheet.

**Independent Test**: Open a Pokémon's card in a specific game, fill a move slot from only that game's learnable moves, see name/type/PP/power/description; switching to a game where that move isn't learnable clears the slot (quickstart.md Scenario 5, SC-005/SC-006).

### Tests for User Story 5 ⚠️

- [X] T020 [P] [US5] Unit test for the `Move` value object (field access, id-only equality) in `test/domain/team_builder/value_objects/move_test.dart`, per data-model.md
- [X] T021 [P] [US5] Contract test for `PokeApiMovepoolRepository` in `test/infrastructure/team_builder/pokeapi_movepool_repository_test.dart`: a fixture `pokemon` body with two `moves[]` entries (one whose `version_group_details` includes the target `version-group`, one that doesn't) returns only the first; a fixture `move` body with `power: null` yields `Move.power == null`; an empty `moves[]` returns `[]` without throwing; a simulated network failure throws `PokedexUnavailable` — per contracts/movepool_repository.md
- [X] T022 [US5] Cubit test in `test/presentation/team_builder/team_builder_cubit_moves_test.dart` (repo convention: flat files under `test/presentation/team_builder/`, not a `cubit/` subdirectory): selecting a move into an empty slot updates `RosterEntry.moveIds`; selecting a move already present in another slot moves it instead of duplicating it (FR-013); resolving the movepool clears a previously-selected move no longer present in it (FR-015); a form change that switches variety re-triggers movepool resolution — per data-model.md's State Transitions
- [X] T023 [US5] Widget test in `test/presentation/team_builder/pokemon_customization_card_test.dart`: a card pumped with `RosterEntry.moveIds == [moveA.id, null, null, null]` renders one filled tile (name/type/pp/power/description) and three empty tiles; tapping an empty tile opens the move-selection sheet showing the fixture-injected movepool; tapping a type filter tile narrows the list and tapping it again clears the filter; tapping a candidate move closes the sheet and updates `moveIds` via `onChanged` — per contracts/move_slots_ui.md

### Implementation for User Story 5

- [X] T024 [P] [US5] Create `lib/domain/team_builder/value_objects/move.dart` with the `Move` value object (`id`, `displayName`, `type`, `pp`, `power`, `description`), per data-model.md (depends on T020 existing and failing first)
- [X] T025 [US5] Add `moveIds` (`List<String?>`, fixed length 4, default `[null, null, null, null]`) to `lib/domain/team_builder/value_objects/roster_entry.dart`'s constructor, `copyWith`, `toJson` (only serialized when at least one entry is non-null), `fromJson`, and `props`, per data-model.md
- [X] T026 [P] [US5] Create `lib/domain/team_builder/ports/movepool_repository.dart` with the `MovepoolRepository` abstract interface, per contracts/movepool_repository.md (depends on T024)
- [X] T027 [US5] Implement `lib/infrastructure/team_builder/pokeapi_movepool_repository.dart` (`PokeApiMovepoolRepository`) against `pokemon/{varietyId}` and `move/{name}`, filtering by `version_group_details[].version_group.name == game.id`, resolving localized name/description with English fallback (mirroring `PokeApiPokedexRepository`'s `_resolveLocalizedName`/`_getJson` conventions), per contracts/movepool_repository.md (depends on T021 existing and failing first, T026). Also added `GetMovepool` application use case (mirrors `GetPokedexDetails`) and wired `movepoolRepository` through `AppDependencies`.
- [X] T028 [US5] Add active-slot movepool state (resolved `List<Move>` + loading/error status) to `lib/presentation/team_builder/cubit/team_builder_state.dart`, per data-model.md
- [X] T029 [US5] Add `fetchMovepoolForActiveSlot`, `selectMove({slotIndex, moveSlotPosition, moveId})` (replacing any other slot already holding that move), and `clearMoveSlot({slotIndex, moveSlotPosition})` methods to `lib/presentation/team_builder/cubit/team_builder_cubit.dart`, wired to `MovepoolRepository` via `GetMovepool` (optional constructor param, `null`-safe no-op for every pre-existing call site not wired for Moves); `updateRosterEntry` re-triggers movepool resolution when the active slot's resolved variety id changes (covers both the form picker and the Mega/Gigamax toggle from US2), and clears any `moveIds` entry absent from a freshly-resolved movepool, per data-model.md's State Transitions (depends on T022 existing and failing first, T027, T028)
- [X] T030 [US5] Create `lib/presentation/team_builder/widgets/move_selection_sheet.dart`: a `showModalBottomSheet` content widget showing a type-filter row (black-tile/select-again-to-clear, mirroring `PokedexTypeFilter`'s interaction) and a list of candidate moves (name/type/pp/power/description each), tap-to-select, per contracts/move_slots_ui.md (depends on T024)
- [X] T031 [US5] Add the Movimientos section to `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`: 4 slot tiles (empty/filled per contracts/move_slots_ui.md) positioned after "Estados Especiales" and before "Quitar del equipo", each tap opening `MoveSelectionSheet` scoped to that slot index; wired `team_builder_page.dart` to call `fetchMovepoolForActiveSlot` on card open and pass `movepool`/`movepoolLoading`/`onSelectMove`/`onClearMoveSlot` through (depends on T023 existing and failing first, T029, T030)
- [X] T032 [P] [US5] Add new l10n keys for the Movimientos section (`customizationCardMovesLabel`, `customizationCardMoveSlotEmptyLabel`, `customizationCardMovePowerNotApplicable`, `moveSelectionSheetTitle`, `moveSelectionSheetPpLabel`, `moveSelectionSheetPowerLabel`, `moveSelectionSheetEmptyLabel`) to `lib/l10n/app_en.arb` and all 9 other locale ARB files (es, de, fr, it, ja, ko, zh, zh_Hans, zh_Hant), regenerated via `flutter gen-l10n`, satisfying `test/l10n/arb_completeness_test.dart`
- [X] T033 [US5] Run `flutter test test/domain/team_builder/value_objects/move_test.dart test/infrastructure/team_builder/pokeapi_movepool_repository_test.dart test/presentation/team_builder/team_builder_cubit_moves_test.dart test/presentation/team_builder/pokemon_customization_card_test.dart test/l10n/arb_completeness_test.dart` and confirm all pass (42/42 in the customization card file alone)

**Checkpoint**: All 5 user stories independently functional — verify via quickstart.md Scenario 5.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Full-suite validation across every story, matching the closing step of every prior feature in this repo (008–010).

- [X] T034 Run `flutter test` for the entire suite and confirm no regressions beyond the one pre-existing, unrelated `test/widget_test.dart` failure — 419/419 pass plus that one known failure (also caught and fixed two pre-existing tests, `pokeapi_pokedex_repository_test.dart`'s Charizard fixture and `pokeapi_pokedex_repository_pagination_test.dart`'s Mega-form fixture, that asserted `megaForm`/`gigamaxForm` non-null against a `red-blue` game — correctly ineligible under US1's new gating, updated to use `x-y`/`sword-shield`-like games instead)
- [X] T035 Run `flutter analyze` and confirm no new findings beyond the 4 pre-existing `curly_braces_in_flow_control_structures` info-level lints (plus the 1 pre-existing `test/widget_test.dart` error) — confirmed identical baseline, no new findings
- [ ] T036 Walk through quickstart.md's 5 manual validation scenarios end-to-end in a running app instance (left for the user, per the established pattern in every prior feature this session)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Empty — no blocking prerequisite shared across stories.
- **User Stories (Phases 3–7)**: Each depends only on Phase 1 (US1 needs T001's verified ids; US2–US5 have no Phase 1 dependency and could start immediately). All 5 are mutually independent — no user story's implementation tasks depend on another story's tasks completing first, matching spec.md's "most stories should be independent" default.
- **Polish (Phase 8)**: Depends on every user story phase being complete.

### User Story Dependencies

- **US1 (P1)**: Depends on T001 (Setup) only.
- **US2 (P1)**: No dependency on any other story.
- **US3 (P1)**: No dependency on any other story.
- **US4 (P2)**: No dependency on any other story.
- **US5 (P1)**: No dependency on any other story — note T029 also happens to touch the same "form/game change" invalidation path US2's toggle fix affects, but T029 reads `megaActive`/`gigamaxActive` only after T008 already lands correctly; implement US2 before US5 if working sequentially to avoid re-testing movepool invalidation against the pre-fix toggle bug, though the two remain independently deliverable.

### Within Each User Story

- Tests written and failing before their corresponding implementation task, per Constitution Principle II.
- Domain value objects/ports before infrastructure adapters before presentation wiring (US5's T024 → T026/T027 → T028/T029 → T030/T031).

### Parallel Opportunities

- T002 and T003 (different files) can run in parallel within US1.
- T013, T014, T015 (different test files) can run in parallel within US4; their corresponding implementation tasks T016, T017, T018 (different files) can then also run in parallel.
- T020, T021 (different files) can run in parallel within US5; T024 and T026 can run in parallel once their tests exist.
- T032 (l10n) can run in parallel with any other US5 task once T031 has decided on final key names.
- Once Phase 1 completes, all 5 user story phases (3–7) can be worked in parallel by different contributors.

---

## Parallel Example: User Story 4

```bash
# Launch all three icon-size tests together:
Task: "Update type badge size assertion in test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart"
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

1. Complete Phase 1: Setup (T001).
2. Complete Phase 3: User Story 1 (T002–T006).
3. **STOP and VALIDATE**: quickstart.md Scenario 1.
4. Deploy/demo if ready — this alone fixes the most visible correctness bug (Mega Evolution offered in Generation III games).

### Incremental Delivery

1. Setup → Foundation ready (no foundational phase needed).
2. Add US1 → validate → demo (MVP).
3. Add US2 → validate → demo (fixes the Mega revert bug).
4. Add US3 → validate → demo (bigger team slots on web).
5. Add US4 → validate → demo (bigger type icons).
6. Add US5 → validate → demo (Moves feature — largest increment, self-contained).

### Parallel Team Strategy

With multiple contributors, once Phase 1 (T001) is done: assign US1–US5 to different contributors in parallel — none of them touches another story's files except the shared, purely-additive l10n ARB files (T032), which merge cleanly.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Every user story is independently completable and testable, per spec.md.
- Tests are written first and MUST fail before their implementation task, per Constitution Principle II — explicitly called out per-task above rather than left implicit.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
