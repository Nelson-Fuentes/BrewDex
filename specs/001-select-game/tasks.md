---

description: "Task list template for feature implementation"
---

# Tasks: Selección de Juego para el Constructor de Equipos

**Input**: Design documents from `/specs/001-select-game/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The project constitution's Principle II (Test-First Development, NON-NEGOTIABLE-style "MUST") and `plan.md`'s Constitution Check both commit this feature to red-green-refactor for domain/application logic, so test tasks are mandatory here, not optional.

**Organization**: Tasks are grouped by user story (from `spec.md`) to enable independent implementation and testing of each story, layered per the hexagonal/Clean/DDD structure from `plan.md` (`domain` → `application` → `infrastructure`/`presentation`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths below are relative to the repository root and follow the layout in `plan.md`'s Project Structure section.

## Path Conventions

Single Flutter project (frontend-only, mobile + web from one codebase, no backend — see `plan.md`):
- `lib/domain/game_selection/`, `lib/application/game_selection/`, `lib/infrastructure/game_selection/`, `lib/presentation/game_selection/`
- `test/domain/game_selection/`, `test/application/game_selection/`, `test/infrastructure/game_selection/`, `test/presentation/game_selection/`
- `integration_test/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the Flutter project skeleton (if not already initialized) and the `game_selection` bounded-context folders — `lib/domain/game_selection/{entities,value_objects,ports,failures}/`, `lib/application/game_selection/use_cases/`, `lib/infrastructure/game_selection/`, `lib/presentation/game_selection/{cubit,pages,widgets}/`, `test/{domain,application,infrastructure,presentation}/game_selection/`, `integration_test/` — per the layout in `plan.md`
- [X] T002 Add dependencies to `pubspec.yaml`: `flutter_bloc`, `http`, `shared_preferences`, `equatable`; dev dependencies: `flutter_test`, `bloc_test`, `mocktail`, `integration_test`, `flutter_lints`; then run `flutter pub get`
- [X] T003 [P] Configure `analysis_options.yaml` with `flutter_lints` (or the project's chosen lint set) so `flutter analyze` is runnable from Phase 1 onward

**Checkpoint**: `flutter pub get` and `flutter analyze` both run cleanly on an empty scaffold.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain types, ports, and their infrastructure adapters that every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create `Game` entity (`id`, `displayName`, `generation`, with the validation rules from `data-model.md`) in `lib/domain/game_selection/entities/game.dart`, using `equatable` for value equality
- [X] T005 [P] Create `Generation` value object (`id`, `label`, equality by `id`) in `lib/domain/game_selection/value_objects/generation.dart`
- [X] T006 [P] Create the `GameCatalogUnavailable` failure type in `lib/domain/game_selection/failures/game_catalog_failure.dart`
- [X] T007 [P] Define the `GameCatalogRepository` port (`Future<List<Game>> fetchCatalog()`, throwing `GameCatalogUnavailable`) in `lib/domain/game_selection/ports/game_catalog_repository.dart` per `contracts/game_catalog_repository.md`
- [X] T008 [P] Define the `SelectedGameStore` port (`readSelectedGameId`, `writeSelectedGameId`) in `lib/domain/game_selection/ports/selected_game_store.dart` per `contracts/selected_game_store.md`
- [X] T009 [P] Unit test `PokeApiGameCatalogRepository`'s mapping from PokeAPI `version-group`/`generation` JSON to `List<Game>` (pairing resolved into one `Game` per FR-002, generation attached) in `test/infrastructure/game_selection/pokeapi_game_catalog_repository_test.dart`, using a fake `http.Client`
- [X] T010 Implement `PokeApiGameCatalogRepository` (implements `GameCatalogRepository` using `http` against `pokeapi.co`'s `version-group`/`generation` endpoints, per research.md item 5) in `lib/infrastructure/game_selection/pokeapi_game_catalog_repository.dart` — depends on T004, T005, T006, T007, T009
- [X] T011 [P] Unit test `LocalSelectedGameStore` (read returns null pre-write, write is idempotent) in `test/infrastructure/game_selection/local_selected_game_store_test.dart`, using `shared_preferences`'s in-memory test mock
- [X] T012 Implement `LocalSelectedGameStore` (implements `SelectedGameStore` using `shared_preferences` under a namespaced key) in `lib/infrastructure/game_selection/local_selected_game_store.dart` — depends on T008, T011
- [X] T013 Wire `PokeApiGameCatalogRepository` and `LocalSelectedGameStore` into the app's composition root (e.g. `lib/main.dart` or a small `lib/app_dependencies.dart`), providing both ports to the presentation layer

**Checkpoint**: Domain types, both ports, and both adapters exist and are unit-tested — user story implementation can now begin.

---

## Phase 3: User Story 1 - Elegir un juego para construir un equipo (Priority: P1) 🎯 MVP

**Goal**: A user can see the full game catalog, pick exactly one game, have it become the active selection gating team-building, and have that selection remembered on return (FR-001, FR-003, FR-007, FR-008).

**Independent Test**: Open the app fresh, confirm the catalog loads and no team-building action is reachable, pick a game, confirm it becomes the active selection; relaunch and confirm it's remembered (quickstart.md scenarios 1–2).

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T014 [P] [US1] Unit test `GetGameCatalog` use case (returns catalog on success, surfaces `GameCatalogUnavailable` on failure, reads persisted selection to mark the active game) in `test/application/game_selection/get_game_catalog_test.dart`, mocking `GameCatalogRepository` and `SelectedGameStore` with `mocktail`
- [X] T015 [P] [US1] Unit test `SelectGame` use case (persists the chosen game id via `SelectedGameStore`, rejects an id not present in the current catalog) in `test/application/game_selection/select_game_test.dart`
- [X] T016 [P] [US1] `bloc_test` for `GameSelectionCubit`'s initial load → select flow (loading → loaded-with-catalog → game-selected states) in `test/presentation/game_selection/game_selection_cubit_test.dart`, mocking the two use cases

### Implementation for User Story 1

- [X] T017 [US1] Implement `GetGameCatalog` use case in `lib/application/game_selection/use_cases/get_game_catalog.dart` — depends on T014 (failing test), T007, T008
- [X] T018 [US1] Implement `SelectGame` use case in `lib/application/game_selection/use_cases/select_game.dart` — depends on T015 (failing test), T007, T008
- [X] T019 [US1] Implement `GameSelectionState` (loading/loaded/error/game-selected variants) and `GameSelectionCubit` (calls `GetGameCatalog` on init, `SelectGame` on user pick) in `lib/presentation/game_selection/cubit/` — depends on T016 (failing test), T017, T018
- [X] T020 [P] [US1] Implement `GameCard` widget (renders one `Game`'s `displayName`, tappable) in `lib/presentation/game_selection/widgets/game_card.dart`
- [X] T021 [US1] Implement `GameSelectionPage` (renders loading/error/list-of-`GameCard` states from the Cubit, blocks navigation to team-building until a game is selected per FR-007) in `lib/presentation/game_selection/pages/game_selection_page.dart` — depends on T019, T020
- [X] T022 [US1] Add the retryable error UI for `GameCatalogUnavailable` (FR-012) to `game_selection_page.dart` — depends on T021
- [X] T023 [US1] Integration test covering Acceptance Scenarios 1.1–1.3 (first-time selection, confirming active selection, returning with a remembered selection) in `integration_test/game_selection_flow_test.dart` — depends on T021, T022 — ⚠️ written and analyzer-clean, but NOT executed in this environment (no Android emulator/device and no Linux desktop support configured; web is unsupported by `flutter test integration_test`). Run with a connected Android device/emulator, or `flutter drive` + chromedriver for web, before considering US1 done.

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Encontrar un juego rápidamente entre muchas opciones (Priority: P2)

**Goal**: A user can narrow the catalog by typing a partial name and/or picking a generation filter, with a clear no-matches state (FR-004, FR-005, FR-006).

**Independent Test**: With the catalog loaded, type a partial name and confirm only matches remain; switch to a generation filter and confirm the same; search for nonsense text and confirm the no-matches state with a clear action (quickstart.md scenario 3).

### Tests for User Story 2 ⚠️

- [X] T024 [P] [US2] Unit test `SearchGames` use case (partial, case-insensitive name matching against a `List<Game>`) in `test/application/game_selection/search_games_test.dart`
- [X] T025 [P] [US2] Unit test `FilterGamesByGeneration` use case (filters a `List<Game>` by `Generation.id`, composes with an already-applied search) in `test/application/game_selection/filter_games_by_generation_test.dart`
- [X] T026 [P] [US2] `bloc_test` for `GameSelectionCubit`'s search/filter state updates, including the no-matches state, in `test/presentation/game_selection/game_selection_cubit_search_filter_test.dart`

### Implementation for User Story 2

- [X] T027 [P] [US2] Implement `SearchGames` use case in `lib/application/game_selection/use_cases/search_games.dart` — depends on T024
- [X] T028 [P] [US2] Implement `FilterGamesByGeneration` use case in `lib/application/game_selection/use_cases/filter_games_by_generation.dart` — depends on T025
- [X] T029 [US2] Extend `GameSelectionState`/`GameSelectionCubit` to hold search text and the active generation filter, recomputing visible games via T027/T028 on each change — depends on T026, T027, T028
- [X] T030 [P] [US2] Implement `GameSearchBar` widget in `lib/presentation/game_selection/widgets/game_search_bar.dart`
- [X] T031 [P] [US2] Implement `GenerationFilter` widget in `lib/presentation/game_selection/widgets/generation_filter.dart`
- [X] T032 [US2] Wire `GameSearchBar` and `GenerationFilter` into `GameSelectionPage`, including the no-matches empty state and a "clear search/filter" action (FR-006) — depends on T021 (US1), T029, T030, T031
- [X] T033 [US2] Integration test covering Acceptance Scenarios 2.1–2.3 (name search narrows results, generation filter narrows results, no-match state with clear action) in `integration_test/game_selection_flow_test.dart` — depends on T032 — ⚠️ same execution caveat as T023 (analyzer-clean, not run on a device in this environment)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Cambiar el juego con un equipo ya en progreso (Priority: P3)

**Goal**: Switching the active game reconciles an in-progress team automatically — invalid Pokémon are removed with a notice, valid teams are left untouched, and a cancelled switch changes nothing (FR-009, FR-010, FR-011).

**Independent Test**: Using test fixtures for an in-progress roster (the real team-building feature is out of scope — see `data-model.md`), switch games and confirm invalid entries are removed with a notice, valid-only teams are preserved, and cancelling a switch leaves everything unchanged (quickstart.md scenario 4).

### Tests for User Story 3 ⚠️

- [X] T034 [P] [US3] Unit tests for `SwitchGame` use case — preserves a fully-valid roster unchanged (FR-011), removes invalid roster entries and returns a removal notice (FR-010), leaves state unchanged when the switch is cancelled — in `test/application/game_selection/switch_game_test.dart`, faking the roster-validity port
- [X] T035 [P] [US3] `bloc_test` for `GameSelectionCubit`'s switch-game flow, including cancel, in `test/presentation/game_selection/game_selection_cubit_switch_test.dart`

### Implementation for User Story 3

- [X] T036 [P] [US3] Define the `TeamBuildingSession` entity (`activeGame`, `rosterPokemonIds`) in `lib/domain/game_selection/entities/team_building_session.dart` and the `RosterValidityChecker` port (checks which roster ids remain valid for a given `Game`, owned by the future team-building context per `data-model.md`) in `lib/domain/game_selection/ports/roster_validity_checker.dart`
- [X] T037 [US3] Implement `SwitchGame` use case (reconciles `TeamBuildingSession.rosterPokemonIds` against the new `Game` via `RosterValidityChecker`, builds the removal notice, persists the new selection via `SelectedGameStore`) in `lib/application/game_selection/use_cases/switch_game.dart` — depends on T034 (failing test), T036
- [X] T038 [US3] Extend `GameSelectionCubit`/`GameSelectionState` with the switch-game flow (confirm, cancel, removal-notice state) — depends on T035 (failing test), T037
- [X] T039 [US3] Add the "change game" entry point, confirmation step, and removal-notice display to `GameSelectionPage` (or a dedicated dialog/widget) — depends on T021 (US1), T038 — also added `AlwaysValidRosterChecker` (placeholder `RosterValidityChecker` adapter, since the real team-building context doesn't exist yet) and wired `SwitchGame` into `AppDependencies`/`main.dart`
- [X] T040 [US3] Integration test covering Acceptance Scenarios 3.1–3.3 (valid team preserved, invalid entries removed with notice, cancelled switch changes nothing) in `integration_test/game_selection_flow_test.dart` — depends on T039 — ⚠️ same execution caveat as T023/T033 (analyzer-clean, not run on a device in this environment)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and validation that span all three stories

- [X] T041 [P] Run `flutter analyze` across `lib/` and `test/` and resolve all findings — clean throughout, re-verified after every subsequent change
- [X] T042 [P] Add structured logging for `GameCatalogUnavailable` and store-write failures in the infrastructure adapters (Constitution Principle V) in `lib/infrastructure/game_selection/`
- [X] T043 [P] Verify the hexagonal boundary holds: `grep -rl "package:flutter\|package:http\|package:shared_preferences" lib/domain lib/application` returns no matches (Constitution Principle VI) — confirmed, no matches
- [~] T044 Run the full manual validation pass from `quickstart.md` (all 5 scenarios) and record the results — ⚠️ NOT fully done: this sandbox has no display/emulator, so the 5 manual UI scenarios could not be walked by hand. Substituted with `flutter build web --release` (✅ succeeded) and `flutter build apk --debug` (✅ succeeded, after pinning `ndkVersion` in `android/app/build.gradle.kts` to clear a `shared_preferences_android` NDK-version warning) as compile-level validation on both target platforms, plus the 38 passing automated tests that exercise the same scenarios at the unit/bloc/infrastructure level. A real manual (or device-based `integration_test`) pass is still recommended before shipping.
- [X] T045 [P] Set the initial `pubspec.yaml` version per the constitution's semantic versioning policy (Principle V) — set to `0.1.0+1` (pre-1.0, single feature shipped so far)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; reuses `GameSelectionPage`/`GameSelectionCubit` from US1 (T021, T029 build on T019) but its use cases and widgets are independently testable per T024–T026
- **User Story 3 (Phase 5)**: Depends on Foundational; reuses `GameSelectionPage`/`GameSelectionCubit` from US1 (T039 builds on T021) but its use case and domain additions are independently testable per T034–T035
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- Tests are written and MUST FAIL before their corresponding implementation task
- Domain/application (use cases) before presentation (Cubit, widgets, pages)
- Story implementation complete and checkpoint-verified before moving to the next priority

### Parallel Opportunities

- T004–T008 (domain entities/ports) can all run in parallel
- T009 and T011 (adapter unit tests) can run in parallel with each other and with T004–T008
- T014–T016 (US1 tests) can run in parallel; T020 (widget) can run in parallel with T017–T019
- T024–T026 (US2 tests) can run in parallel; T027–T028 (use cases) can run in parallel; T030–T031 (widgets) can run in parallel
- T034–T035 (US3 tests) can run in parallel; T036 can run in parallel with US1/US2 work once Foundational is done
- T041–T043 and T045 in Polish can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test GetGameCatalog use case in test/application/game_selection/get_game_catalog_test.dart"
Task: "Unit test SelectGame use case in test/application/game_selection/select_game_test.dart"
Task: "bloc_test for GameSelectionCubit in test/presentation/game_selection/game_selection_cubit_test.dart"

# Launch independent implementation pieces together:
Task: "Implement GameCard widget in lib/presentation/game_selection/widgets/game_card.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md scenarios 1–2 and the T023 integration test
5. Demo if ready — this alone satisfies FR-001, FR-003, FR-007, FR-008

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → MVP demo
3. Add User Story 2 → validate independently (search/filter) → demo
4. Add User Story 3 → validate independently (game switching) → demo
5. Polish → final quickstart.md pass across all three stories

### Parallel Team Strategy

With multiple developers, once Foundational (Phase 2) is done:
- Developer A: User Story 1 (Phase 3)
- Developer B: User Story 2 (Phase 4) — can start once T019/T021 land, since it extends the same Cubit/page
- Developer C: User Story 3 (Phase 5) — can start its domain/use-case work (T034–T037) immediately after Foundational, then integrates with T021 once available

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Domain and application tests use `mocktail` fakes for both ports — no network or Flutter binding required
- Verify each test fails before implementing the task that makes it pass
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- US2 and US3 share `GameSelectionPage`/`GameSelectionCubit` with US1 by extension rather than duplication, per Constitution Principle I (Simplicity & YAGNI) — avoid introducing separate pages per story
