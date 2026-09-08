# Implementation Plan: Selección de Juego para el Constructor de Equipos

**Branch**: `001-select-game` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-select-game/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Users must pick which Pokémon game (version-group) their team will target
before any team-building action is available, using an interactive
search/generation-filter selector instead of a flat scrollable list, with
the selection remembered locally between sessions and automatically
reconciled if changed mid-build. Technical approach: a frontend-only
Flutter application (Android + Web from one codebase) that fetches the
game catalog from PokeAPI's `version-group`/`generation` endpoints,
structured per the project constitution as a hexagonal/Clean/DDD "game
selection" bounded context — a framework-free domain and application
layer orchestrating two ports (a game-catalog repository and a
selected-game store), with Flutter/HTTP/local-storage code confined to
infrastructure and presentation adapters.

## Technical Context

**Language/Version**: Dart 3.x, bundled with the latest stable Flutter SDK

**Primary Dependencies**: Flutter SDK (presentation adapter only);
`flutter_bloc` (Cubit-based application-layer orchestration, keeps
use-case flow out of widgets); `http` (PokeAPI HTTP client, infrastructure
adapter); `shared_preferences` (local persistence adapter — SharedPreferences
on Android, `window.localStorage` on Web); `equatable` (value equality for
domain entities/value objects without codegen)

**Storage**: Local on-device/browser key-value storage only (via
`shared_preferences`), storing just the last-selected game's identifier;
no backend, no database

**Testing**: `flutter_test` (widget tests), `bloc_test` (Cubit/application
layer), `mocktail` (fakes for the repository/store ports so domain and
application tests run without Flutter or network), `integration_test`
(end-to-end flows on-device/browser)

**Target Platform**: Android and Web from a single Flutter codebase (no
iOS/desktop targets in this feature)

**Project Type**: Frontend-only mobile+web application — no backend
service is introduced by this feature

**Performance Goals**: Catalog loaded and ready for interaction within
~2s on a typical connection; search/generation-filter response perceived
as instant (<100ms), since filtering runs client-side over an
already-fetched, small catalog

**Constraints**: No backend/server component (explicit user decision);
no user accounts/authentication; must degrade gracefully with a clear,
retryable error when PokeAPI is unreachable (FR-012); the single
codebase must behave correctly on both the Android and Web targets

**Scale/Scope**: Small, mostly-static catalog — PokeAPI currently exposes
roughly 20-25 version-groups across roughly 9-10 generations; single user
per device, no concurrency or multi-device sync concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Simplicity & YAGNI | Stack is minimal: one state-management library (`flutter_bloc`), one HTTP client (`http`), one local-storage package (`shared_preferences`). No backend, no database, no caching layer beyond an in-memory session cache — all deliberately deferred until a real need appears. | PASS |
| II. Test-First Development | Domain and application layers are plain Dart with the ports mocked via `mocktail`, so use cases can be tested red-green-refactor without Flutter or network access; `bloc_test` covers the Cubit; `integration_test` covers the end-to-end flow. | PASS |
| III. Clear Contracts & Interfaces | Two explicit ports are defined by the domain/application layers — `GameCatalogRepository` and `SelectedGameStore` — documented in `contracts/`, independently testable via fakes. | PASS |
| IV. Code Quality & Review | Standard `flutter analyze`/lint gate and required review apply as project-wide workflow; no exception introduced by this feature. | PASS |
| V. Observability & Versioning | Fetch/store failures are surfaced through a typed failure in the domain (`GameCatalogFailure`) that the presentation layer logs and turns into the user-facing retry message from FR-012; app version follows `pubspec.yaml` semantic versioning. | PASS |
| VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE) | Feature is scoped as its own bounded context (`game_selection`) with `domain/` (zero Flutter/HTTP/storage imports), `application/` (use cases depending only on domain + the two ports), and `infrastructure/` + `presentation/` adapters implementing/consuming those ports. Dependencies point inward only; see Project Structure. | PASS |

No violations — the Complexity Tracking table below is intentionally empty.

**Post-Design re-check** (after Phase 1): `data-model.md` and
`contracts/` confirm the domain (`Game`, `Generation`, `GameCatalog`,
`TeamBuildingSession`, failure types) and the two ports
(`GameCatalogRepository`, `SelectedGameStore`) stay framework-free, with
`http`/`shared_preferences`/Flutter confined to the infrastructure and
presentation adapters described in Project Structure. All rows above
remain PASS; no new violations introduced by the design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/001-select-game/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── game_catalog_repository.md
│   └── selected_game_store.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   └── game_selection/
│       ├── entities/
│       │   └── game.dart                    # Game entity (id, display name, generation)
│       ├── value_objects/
│       │   └── generation.dart               # Generation value object
│       ├── ports/
│       │   ├── game_catalog_repository.dart  # Port: fetch the game catalog
│       │   └── selected_game_store.dart       # Port: read/write the persisted selection
│       └── failures/
│           └── game_catalog_failure.dart      # Typed domain failures (e.g. unavailable)
│
├── application/
│   └── game_selection/
│       └── use_cases/
│           ├── get_game_catalog.dart          # Loads the catalog (FR-001, FR-012)
│           ├── search_games.dart              # Name-based filtering (FR-004)
│           ├── filter_games_by_generation.dart # Generation filtering (FR-005)
│           ├── select_game.dart               # Sets the active selection (FR-003, FR-007, FR-008)
│           └── switch_game.dart                # Reconciles an in-progress team on change (FR-009–FR-011)
│
├── infrastructure/
│   └── game_selection/
│       ├── pokeapi_game_catalog_repository.dart # Implements GameCatalogRepository via PokeAPI
│       └── local_selected_game_store.dart        # Implements SelectedGameStore via shared_preferences
│
└── presentation/
    └── game_selection/
        ├── cubit/
        │   ├── game_selection_cubit.dart      # Calls use cases, exposes UI state
        │   └── game_selection_state.dart
        ├── pages/
        │   └── game_selection_page.dart        # Screen wiring search bar, filter, list/grid
        └── widgets/
            ├── game_card.dart
            ├── game_search_bar.dart
            └── generation_filter.dart

test/
├── domain/game_selection/
├── application/game_selection/                 # Use-case tests with faked ports
├── infrastructure/game_selection/               # Adapter tests (e.g. HTTP mapping)
└── presentation/game_selection/                 # Widget + bloc_test coverage

integration_test/
└── game_selection_flow_test.dart                 # End-to-end: select, search, filter, switch
```

**Structure Decision**: Single Flutter package (mobile + web from one
codebase, no backend), organized as one bounded context per feature
(`game_selection`) with the four hexagonal layers — `domain`,
`application`, `infrastructure`, `presentation` — each a subfolder so
future bounded contexts (e.g. team building) can be added the same way
without entangling with this one. This is the "single project" shape
appropriate for a frontend-only app; the web/backend and mobile/API
template options do not apply since there is no backend service.

## Complexity Tracking

*No entries — Constitution Check reported no violations to justify.*
