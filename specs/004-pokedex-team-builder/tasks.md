---

description: "Task list template for feature implementation"
---

# Tasks: Armador de Equipo y Pokédex del Juego

**Input**: Design documents from `/specs/004-pokedex-team-builder/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The project constitution's Principle II (Test-First Development, NON-NEGOTIABLE-style "MUST") and `plan.md`'s Constitution Check both commit this feature to red-green-refactor for domain/application logic, so test tasks are mandatory here, not optional.

**Organization**: Tasks are grouped by user story (from `spec.md`) to enable independent implementation and testing of each story, layered per the hexagonal/Clean/DDD structure from `plan.md` (`domain` → `application` → `infrastructure`/`presentation`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- File paths below are relative to the repository root and follow the layout in `plan.md`'s Project Structure section.

## Path Conventions

Single Flutter project (frontend-only, mobile + web from one codebase, no backend — see `plan.md`), new `team_builder` bounded context alongside the existing `game_selection`:
- `lib/domain/team_builder/`, `lib/application/team_builder/`, `lib/infrastructure/team_builder/`, `lib/presentation/team_builder/`
- `test/domain/team_builder/`, `test/application/team_builder/`, `test/infrastructure/team_builder/`, `test/presentation/team_builder/`
- `integration_test/`
- A small number of tasks edit existing `lib/{application,infrastructure,presentation}/game_selection/` files — called out explicitly where they occur.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bounded-context scaffolding for `team_builder`

- [X] T001 Create the `team_builder` bounded-context folders — `lib/domain/team_builder/{entities,value_objects,ports,failures}/`, `lib/application/team_builder/use_cases/`, `lib/infrastructure/team_builder/`, `lib/presentation/team_builder/{cubit,pages,widgets}/`, `test/{domain,application,infrastructure,presentation}/team_builder/` — per the layout in `plan.md`
- [X] T002 Confirm `pubspec.yaml` already covers this feature's dependencies (`flutter_bloc`, `http`, `shared_preferences`, `equatable`; dev: `bloc_test`, `mocktail`, `integration_test` — all added by `001-select-game`, no new dependency per `plan.md`/`research.md` item 10); run `flutter pub get`
- [X] T003 [P] Confirm `analysis_options.yaml`'s existing lint configuration already covers the new `team_builder` folders (no changes expected) by running `flutter analyze` on the empty scaffold from T001

**Checkpoint**: `flutter pub get` and `flutter analyze` both run cleanly with the empty `team_builder` scaffold in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New domain types, the two new ports, their infrastructure adapters, the real `RosterValidityChecker` implementation, and composition-root wiring that every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create `PokedexEntry` entity (`pokemonId`, `displayName`, `pokedexNumber`, `spriteUrl`, `typePrimary`, `typeSecondary`, `introducedGeneration`, `sourceTag`, with the validation rules from `data-model.md`) in `lib/domain/team_builder/entities/pokedex_entry.dart`, using `equatable`
- [X] T005 [P] Create `PokemonType` value object (`id`, `label`, equality by `id`) in `lib/domain/team_builder/value_objects/pokemon_type.dart`
- [X] T006 [P] Create `PokedexEntrySource` value type (`regional`, `national`, `dlc(String dlcId)`) in `lib/domain/team_builder/value_objects/pokedex_entry_source.dart`
- [X] T007 [P] Create `PokedexView` value object (`useNationalDex`, `activeDlcIds`, with the validation rule from `data-model.md`) in `lib/domain/team_builder/value_objects/pokedex_view.dart`
- [X] T008 [P] Create `PokedexFilterCriteria` value object (`searchText`, `type`, `generation`) in `lib/domain/team_builder/value_objects/pokedex_filter_criteria.dart`
- [X] T009 [P] Create the `PokedexUnavailable` failure type in `lib/domain/team_builder/failures/pokedex_failure.dart`
- [X] T010 [P] Create the `TeamFullFailure` failure type in `lib/domain/team_builder/failures/team_full_failure.dart`
- [X] T011 [P] Define the `PokedexRepository` port (`Future<List<PokedexEntry>> fetchPokedex({required Game game, required PokedexView view, required String languageCode})`, throwing `PokedexUnavailable`, sorted-output/view-determines-numbering/DLC-additive/id-stability contract rules) in `lib/domain/team_builder/ports/pokedex_repository.dart` per `contracts/pokedex_repository.md`
- [X] T012 [P] Define the `TeamRosterStore` port (`readRosterPokemonIds`, `writeRosterPokemonIds`) in `lib/domain/team_builder/ports/team_roster_store.dart` per `contracts/team_roster_store.md`
- [X] T013 [P] Unit test `PokeApiPokedexRepository`'s mapping from PokeAPI `pokedex`/`pokedex/national`/`pokemon-species`/`pokemon` JSON to `List<PokedexEntry>` — regional-only, national-replaces-regional, DLC merged on top, sprite fallback chain (research.md items 6, 7, 9) — in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`, using a fake `http.Client`
- [X] T014 Implement `PokeApiPokedexRepository` (implements `PokedexRepository` against `pokeapi.co`'s `pokedex`/`pokemon-species`/`pokemon` endpoints, per research.md items 6, 7, 9) in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` — depends on T004–T012, T013
- [X] T015 [P] Unit test `LocalTeamRosterStore` (read returns `[]` pre-write, write/read roundtrip preserves order) in `test/infrastructure/team_builder/local_team_roster_store_test.dart`, using `shared_preferences`'s in-memory test mock
- [X] T016 Implement `LocalTeamRosterStore` (implements `TeamRosterStore` using `shared_preferences`, JSON-encoded list under one key, mirroring `LocalSelectedGameStore`) in `lib/infrastructure/team_builder/local_team_roster_store.dart` — depends on T012, T015
- [X] T017 [P] Unit test `PokedexRosterValidityChecker` (valid subset = ids present in the game's regional + all-DLC obtainable set regardless of UI toggle state; propagates `PokedexUnavailable`) in `test/infrastructure/team_builder/pokedex_roster_validity_checker_test.dart`, faking `PokedexRepository`
- [X] T018 Implement `PokedexRosterValidityChecker` (implements the *existing* `domain/game_selection/ports/roster_validity_checker.dart` port, per `contracts/roster_validity_checker_implementation.md`) in `lib/infrastructure/team_builder/pokedex_roster_validity_checker.dart`, and delete `lib/infrastructure/game_selection/always_valid_roster_checker.dart` — depends on T011, T014, T017
- [X] T019 Wire `PokeApiPokedexRepository`, `LocalTeamRosterStore`, and `PokedexRosterValidityChecker` into the composition root (`lib/app_dependencies.dart`/`lib/main.dart`) — replace the `AlwaysValidRosterChecker` default, add `pokedexRepository`/`teamRosterStore` fields, and read the persisted roster from `LocalTeamRosterStore` each time the game-selection route builds to seed `GameSelectionCubit.initialRosterPokemonIds` (research.md item 4) — depends on T014, T016, T018

**Checkpoint**: New domain types, both new ports, both new adapters, and the real `RosterValidityChecker` all exist, are unit-tested, and are wired into the composition root — user story implementation can now begin.

---

## Phase 3: User Story 1 - Ver el armador de equipo y la Pokédex del juego seleccionado (Priority: P1) 🎯 MVP

**Goal**: A user who has selected a game reaches the armador and sees 6 team slots (empty, or pre-populated from a prior session) plus the game's regional Pokédex — name, number, sprite per entry, sorted ascending by number (FR-001–FR-006).

**Independent Test**: Select a game, tap "Continuar", confirm 6 slots and the regional Pokédex render correctly, sorted, with a placeholder for any missing sprite; reopen with a roster already in progress and confirm slots are pre-filled (quickstart.md scenario 1).

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T020 [P] [US1] Unit test `GetPokedex` use case (fetches the regional-only view by default, returns the sorted list, surfaces `PokedexUnavailable` on failure) in `test/application/team_builder/get_pokedex_test.dart`, mocking `PokedexRepository`
- [X] T021 [P] [US1] `bloc_test` for `TeamBuilderCubit`'s initial load (loading → loaded-with-6-slots-and-entries, slots pre-filled from `TeamRosterStore`, error state) in `test/presentation/team_builder/team_builder_cubit_test.dart`, mocking `GetPokedex` and `TeamRosterStore`

### Implementation for User Story 1

- [X] T022 [US1] Implement `GetPokedex` use case in `lib/application/team_builder/use_cases/get_pokedex.dart` — depends on T020 (failing test), T011
- [X] T023 [US1] Implement `TeamBuilderState` (loading/loaded/error variants; 6 `TeamSlot`s derived from the roster; pokedex entries) and `TeamBuilderCubit` (loads the game's regional Pokédex via T022 and the current roster via `TeamRosterStore` on init) in `lib/presentation/team_builder/cubit/` — depends on T021 (failing test), T022, T016
- [X] T024 [P] [US1] Implement `TeamSlot` widget (renders one slot's sprite+name when occupied, an empty placeholder otherwise) in `lib/presentation/team_builder/widgets/team_slot.dart`
- [X] T025 [P] [US1] Implement `TeamSlotRow` widget (renders the 6 `TeamSlot` widgets in order) in `lib/presentation/team_builder/widgets/team_slot_row.dart` — depends on T024
- [X] T026 [P] [US1] Implement `PokedexEntryCard` widget (renders name/number/sprite, with the FR-005 placeholder image when `spriteUrl` is `null`) in `lib/presentation/team_builder/widgets/pokedex_entry_card.dart`
- [X] T027 [US1] Implement `TeamBuilderPage` (renders `TeamSlotRow` + a grid of `PokedexEntryCard`s from `TeamBuilderCubit`'s state, with the retryable error UI for `PokedexUnavailable` per FR-020) in `lib/presentation/team_builder/pages/team_builder_page.dart` — depends on T023, T025, T026
- [X] T028 [US1] Replace the "Continuar" button's placeholder SnackBar in `lib/presentation/game_selection/pages/game_selection_page.dart` with `Navigator.push` to `TeamBuilderPage(game: state.activeGame!)` (research.md item 3) — depends on T027 — also added a `RepositoryProvider<AppDependencies>` in `main.dart` so the lazily-pushed route can build its own `TeamBuilderCubit`, and `GameSelectionCubit.refreshRoster()` to resync after returning
- [X] T029 [US1] Integration test covering Acceptance Scenarios 1.1–1.3 (fresh armador shows 6 empty slots + regional dex sorted by number, a prior roster pre-fills the correct slots, a missing sprite shows the placeholder) in `integration_test/team_builder_flow_test.dart` — depends on T028 — ⚠️ written and analyzer-clean, but NOT executed in this environment (web target unsupported for `flutter test integration_test`, no Android emulator/device or Linux desktop support configured — same caveat as `001-select-game`'s T023/T033/T040)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Agregar y quitar Pokémon de los espacios del equipo (Priority: P2)

**Goal**: Selecting a hoverable Pokédex entry fills the next empty slot; a filled slot can be cleared; a 7th addition is blocked with clear feedback (FR-007–FR-010).

**Independent Test**: With US1 available, select several Pokémon and confirm they fill slots in order picked; remove one and confirm its slot empties while others stay put; attempt a 7th with all slots full and confirm it's blocked (quickstart.md scenario 2).

### Tests for User Story 2 ⚠️

- [X] T030 [P] [US2] Unit test `AddPokemonToTeam` use case (fills the next empty slot in order, throws `TeamFullFailure` when all 6 are occupied, persists the new roster via `TeamRosterStore`) in `test/application/team_builder/add_pokemon_to_team_test.dart`
- [X] T031 [P] [US2] Unit test `RemovePokemonFromTeam` use case (clears the occupying slot, persists the new roster) in `test/application/team_builder/remove_pokemon_from_team_test.dart`
- [X] T032 [P] [US2] `bloc_test` for `TeamBuilderCubit`'s add/remove flow, including the team-full rejection feedback, in `test/presentation/team_builder/team_builder_cubit_roster_test.dart`

### Implementation for User Story 2

- [X] T033 [P] [US2] Implement `AddPokemonToTeam` use case in `lib/application/team_builder/use_cases/add_pokemon_to_team.dart` — depends on T030 (failing test), T012
- [X] T034 [P] [US2] Implement `RemovePokemonFromTeam` use case in `lib/application/team_builder/use_cases/remove_pokemon_from_team.dart` — depends on T031 (failing test), T012 — removes by slot index rather than by id, since duplicate species are allowed (spec Assumptions) and index removal is unambiguous
- [X] T035 [US2] Extend `TeamBuilderCubit` with `addPokemon`/`removePokemon` methods (call T033/T034, emit team-full feedback) — depends on T032 (failing test), T033, T034
- [X] T036 [US2] Add hover state (`MouseRegion`+`InkWell`, mirroring `GameCard`'s pattern) and tap-to-add / "already in team" indication to `PokedexEntryCard` (FR-007, FR-008) — depends on T026 (US1), T035
- [X] T037 [US2] Add tap-to-remove behavior to `TeamSlot` for an occupied slot (FR-010) — depends on T024 (US1), T035
- [X] T038 [US2] Integration test covering Acceptance Scenarios 2.1–2.4 (add fills the next slot, adding at 6/6 is blocked, remove frees the slot, hover shows a distinct state) in `integration_test/team_builder_flow_test.dart` — depends on T036, T037 — ⚠️ same execution caveat as T029 (analyzer-clean, not run in this environment)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Buscar y filtrar la Pokédex (Priority: P3)

**Goal**: The Pokédex can be narrowed by partial name, by type (type 1 or type 2), and by introduction generation, combinable, always sorted by number, with a clear no-matches state (FR-011–FR-015).

**Independent Test**: With the Pokédex loaded, filter by name, then by type, then combine with generation, and confirm each narrows correctly and sorted; search for nonsense text and confirm the no-matches state with a clear action (quickstart.md scenario 3).

### Tests for User Story 3 ⚠️

- [X] T039 [P] [US3] Unit test `FilterPokedexEntries` use case (partial case-insensitive name match, type-1-or-type-2 match, generation match, all three AND-combined, order preserved) in `test/application/team_builder/filter_pokedex_entries_test.dart`

### Implementation for User Story 3

- [X] T040 [US3] Implement `FilterPokedexEntries` use case in `lib/application/team_builder/use_cases/filter_pokedex_entries.dart` — depends on T039 (failing test)
- [X] T041 [US3] Extend `TeamBuilderState`/`TeamBuilderCubit` with search text, type filter, and generation filter state, recomputing visible entries via T040 on each change, plus a no-matches flag and a clear-filters action (FR-015) — depends on T023 (US1), T040
- [X] T042 [P] [US3] Implement `PokedexSearchBar` widget (mirrors `GameSearchBar`) in `lib/presentation/team_builder/widgets/pokedex_search_bar.dart`
- [X] T043 [P] [US3] Implement `PokedexTypeFilter` widget (chip list over `PokemonType`, mirrors `GenerationFilter`'s pattern) in `lib/presentation/team_builder/widgets/pokedex_type_filter.dart`
- [X] T044 [US3] Wire `PokedexSearchBar`, `PokedexTypeFilter`, and the *reused* `GenerationFilter` widget (from `presentation/game_selection/widgets/generation_filter.dart`, already generic over `Generation`) into `TeamBuilderPage`, including the no-matches empty state and clear action — depends on T027 (US1), T041, T042, T043
- [X] T045 [US3] Integration test covering Acceptance Scenarios 3.1–3.5 (name/type/generation filters individually and combined, no-matches state with clear action) in `integration_test/team_builder_flow_test.dart` — depends on T044 — ⚠️ same execution caveat as T029/T038 (analyzer-clean, not run in this environment)

**Checkpoint**: User Stories 1, 2, and 3 are all independently functional.

---

## Phase 6: User Story 4 - Alternar Pokédex Nacional y Pokémon de DLC (Priority: P4)

**Goal**: For an eligible game (2nd–7th generation), a National Dex toggle swaps the list/numbering; for a game with DLC, one toggle per DLC merges its Pokémon in; neither toggle appears when not applicable (FR-016–FR-019).

**Independent Test**: Open the armador for an eligible game and confirm the National Dex toggle works both ways; open it for an ineligible game and confirm the toggle is absent; open it for a game with/without DLC and confirm the DLC toggle(s) presence matches (quickstart.md scenario 4).

### Tests for User Story 4 ⚠️

- [X] T046 [P] [US4] Unit test for the National-Dex-eligibility rule (generation ids `generation-ii` through `generation-vii` eligible, all others — including `generation-i` and `generation-viii`+ — not) in `test/domain/team_builder/national_dex_eligibility_test.dart`
- [X] T047 [P] [US4] `bloc_test` for `TeamBuilderCubit`'s toggle flow (National Dex toggle re-fetches with the national view when eligible, is a no-op/hidden signal when not; a DLC toggle re-fetches with that DLC merged in) in `test/presentation/team_builder/team_builder_cubit_view_test.dart`

### Implementation for User Story 4

- [X] T048 [US4] Implement the National-Dex-eligibility pure function (used by both the Cubit and `TeamBuilderPage` to decide whether to offer the toggle) in `lib/domain/team_builder/value_objects/pokedex_view.dart` — depends on T046 (failing test) — implemented during Foundational (T007) since `PokeApiPokedexRepository`/`PokedexRosterValidityChecker` already needed it; T046 confirms it green here
- [X] T049 [US4] Extend `TeamBuilderCubit` with `toggleNationalDex`/`toggleDlc` methods (update the active `PokedexView`, re-invoke `GetPokedex`, re-apply active filters from US3) — depends on T047 (failing test), T048, T022 (US1), T041 (US3)
- [X] T050 [P] [US4] Implement `NationalDexToggle` widget in `lib/presentation/team_builder/widgets/national_dex_toggle.dart`
- [X] T051 [US4] Move `DlcToggleList` from `lib/presentation/game_selection/widgets/dlc_toggle_list.dart` to `lib/presentation/team_builder/widgets/dlc_toggle_list.dart` (no behavior change — relocated per research.md item 2)
- [X] T052 [US4] Remove the ahead-of-spec DLC-toggle UI/state from `game_selection`: delete `toggleDlc` from `lib/presentation/game_selection/cubit/game_selection_cubit.dart`, `activeDlcIds` from `lib/presentation/game_selection/cubit/game_selection_state.dart`, and the `DlcToggleList` usage from `lib/presentation/game_selection/pages/game_selection_page.dart` — depends on T051 — also updated `test/presentation/game_selection/game_selection_compact_layout_test.dart` and `game_selection_touch_target_test.dart`, which had (correctly, at the time) asserted the old DLC-toggle UI from `002-material-design-ui`
- [X] T053 [US4] Wire `NationalDexToggle` (shown only when T048's rule is `true` for the active game) and the relocated `DlcToggleList` (shown only when `game.dlcs` is non-empty) into `TeamBuilderPage` — depends on T027 (US1), T049, T050, T051
- [X] T054 [US4] Integration test covering Acceptance Scenarios 4.1–4.5 (National Dex toggle on/off for an eligible game, toggle absent for an ineligible game, DLC toggle presence/absence and effect) in `integration_test/team_builder_flow_test.dart` — depends on T053 — ⚠️ same execution caveat as T029/T038/T045 (analyzer-clean, not run in this environment)

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and validation that span all four stories, plus the regression risk from touching `game_selection`

- [X] T055 [P] Run `flutter analyze` across `lib/` and `test/` and resolve all findings — clean throughout, re-verified after every subsequent change
- [X] T056 [P] Add structured logging for `PokedexUnavailable` and `TeamRosterStore` write failures in the infrastructure adapters (Constitution Principle V) in `lib/infrastructure/team_builder/` — `PokeApiPokedexRepository`/`LocalTeamRosterStore` log via `developer.log` on every failure path (mirroring `001-select-game`'s adapters)
- [X] T057 [P] Verify the hexagonal boundary holds for the new context: `grep -rl "package:flutter\|package:http\|package:shared_preferences" lib/domain/team_builder lib/application/team_builder` returns no matches (Constitution Principle VI) — confirmed, no matches
- [X] T058 Regression-check `integration_test/game_selection_flow_test.dart` still passes given the "Continuar" navigation change (T028) and the DLC-toggle removal (T052) — update the test if it asserted the now-removed SnackBar/DLC-toggle behavior — confirmed by inspection this file never taps "Continuar" while enabled (only asserts `onPressed` nullness), so it needed no change; two `002-material-design-ui` widget tests *did* assert the old DLC-toggle UI and were updated (`game_selection_compact_layout_test.dart`, `game_selection_touch_target_test.dart`) — found and fixed via the full `flutter test` run, not left to this task alone
- [X] T059 Run the full manual validation pass from `quickstart.md` (all 6 scenarios) and record the results — ⚠️ NOT fully done: this sandbox has no display/emulator, so the 6 manual UI scenarios could not be walked by hand (same constraint as `001-select-game`'s T044). Substituted with `flutter build web --release` (✅ succeeded) and `flutter build apk --debug` (✅ succeeded) as compile-level validation on both target platforms, plus all 168 passing automated tests (unit/bloc/infrastructure/widget) exercising the same scenarios at that level. A real manual (or device-based `integration_test`) pass is still recommended before shipping.
- [X] T060 [P] Bump `pubspec.yaml`'s version per the constitution's semantic versioning policy (Principle V) for this feature's release — bumped `0.2.0+2` → `0.3.0+3` (MINOR: new backward-compatible feature)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; reuses `TeamBuilderPage`/`TeamBuilderCubit`/`TeamSlot`/`PokedexEntryCard` from US1 (T036, T037 build on T024, T026) but its use cases are independently testable per T030–T032
- **User Story 3 (Phase 5)**: Depends on Foundational; extends the same Cubit/page from US1 (T041, T044 build on T023, T027) but its use case is independently testable per T039
- **User Story 4 (Phase 6)**: Depends on Foundational; extends the same Cubit/page from US1 and re-applies US3's filters (T049 builds on T022, T041) but its domain rule and widgets are independently testable per T046–T047
- **Polish (Phase 7)**: Depends on all four user stories being complete

### Within Each User Story

- Tests are written and MUST FAIL before their corresponding implementation task
- Domain/application (use cases) before presentation (Cubit, widgets, pages)
- Story implementation complete and checkpoint-verified before moving to the next priority

### Parallel Opportunities

- T004–T012 (domain entities/value objects/failures/ports) can all run in parallel
- T013, T015, T017 (adapter unit tests) can run in parallel with each other and with T004–T012
- T020–T021 (US1 tests) can run in parallel; T024, T025, T026 (widgets) can run in parallel with each other and with T022–T023
- T030–T032 (US2 tests) can run in parallel; T033–T034 (use cases) can run in parallel
- T042–T043 (US3 widgets) can run in parallel
- T046–T047 (US4 tests) can run in parallel; T050 (widget) can run in parallel with T048–T049
- T055–T057 and T060 in Polish can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch both tests for User Story 1 together:
Task: "Unit test GetPokedex use case in test/application/team_builder/get_pokedex_test.dart"
Task: "bloc_test for TeamBuilderCubit in test/presentation/team_builder/team_builder_cubit_test.dart"

# Launch independent widget pieces together:
Task: "Implement TeamSlot widget in lib/presentation/team_builder/widgets/team_slot.dart"
Task: "Implement PokedexEntryCard widget in lib/presentation/team_builder/widgets/pokedex_entry_card.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md scenario 1 and the T029 integration test
5. Demo if ready — this alone satisfies FR-001–FR-006

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → MVP demo (view the armador)
3. Add User Story 2 → validate independently (add/remove team members) → demo
4. Add User Story 3 → validate independently (search/filter) → demo
5. Add User Story 4 → validate independently (National Dex/DLC toggles) → demo
6. Polish → final quickstart.md pass across all four stories, plus the `game_selection` regression check

### Parallel Team Strategy

With multiple developers, once Foundational (Phase 2) is done:
- Developer A: User Story 1 (Phase 3)
- Developer B: User Story 2 (Phase 4) — can start its use-case work (T030–T034) immediately after Foundational, then integrates with T024/T026 once available
- Developer C: User Story 3 (Phase 5) — same pattern, integrates with T023/T027 once available
- Developer D: User Story 4 (Phase 6) — its domain rule (T046, T048) can start immediately after Foundational; the Cubit/UI wiring (T049, T053) needs US1 (and ideally US3) landed first

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Domain and application tests use `mocktail` fakes for all three ports (`PokedexRepository`, `TeamRosterStore`, and the existing `RosterValidityChecker`) — no network or Flutter binding required
- Verify each test fails before implementing the task that makes it pass
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- US2, US3, and US4 share `TeamBuilderPage`/`TeamBuilderCubit` with US1 by extension rather than duplication, per Constitution Principle I (Simplicity & YAGNI) — avoid introducing separate pages per story
- T028, T051, and T052 are the only tasks in this feature that edit existing `game_selection` files; keep those edits scoped exactly as described (navigation handler; widget relocation; dead-state removal) to avoid regressing `001-select-game`'s own acceptance scenarios
