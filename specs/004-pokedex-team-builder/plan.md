# Implementation Plan: Armador de Equipo y Pokédex del Juego

**Branch**: `004-pokedex-team-builder` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-pokedex-team-builder/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Once a game is selected (`001-select-game`), the user reaches an
"armador de equipo" screen showing 6 team slots and the selected game's
Pokédex (name, number, sprite per entry), filterable by partial name,
type (1 or 2), and introduction generation, with optional National Dex
and per-DLC toggles that switch/extend the underlying list, always
sorted by Pokédex number; selecting an entry fills the next empty slot
(each entry is hoverable/selectable), and a filled slot can be cleared
again. Technical approach: a new `team_builder` bounded context
(domain/application/infrastructure/presentation), built the same
hexagonal/Cubit way as `game_selection`, that (a) fetches Pokédex data
from PokeAPI's `pokedex`/`pokemon-species`/`pokemon` endpoints behind a
new `PokedexRepository` port, (b) persists the roster via a new
`TeamRosterStore` port (`shared_preferences`, mirroring
`SelectedGameStore`), and (c) provides the real `RosterValidityChecker`
implementation that `001-select-game` deliberately left stubbed
(`AlwaysValidRosterChecker`) for this feature to replace. It also wires
the "Continuar" placeholder in `game_selection` to real navigation into
this screen, and relocates the DLC-toggle UI/state `game_selection`
already carried ahead of spec onto this screen, where the spec actually
places it (see research.md items 2–3).

## Technical Context

**Language/Version**: Dart 3.x, bundled with the latest stable Flutter SDK (same as `001-select-game`/`002`/`003`)

**Primary Dependencies**: Flutter SDK (presentation adapter only);
`flutter_bloc` (new `TeamBuilderCubit`, same Cubit pattern as
`GameSelectionCubit`); `http` (new `PokeApiPokedexRepository`, reusing
the existing `http.Client`/base-URL pattern); `shared_preferences` (new
`LocalTeamRosterStore`, same mechanism as `LocalSelectedGameStore`);
`equatable` (new domain entities/value objects) — no new package
dependency is introduced by this feature

**Storage**: Local on-device/browser key-value storage only (via
`shared_preferences`), storing the in-progress roster as one
JSON-encoded list of Pokémon ids under a single key; no backend, no
database

**Testing**: `flutter_test` (widget tests), `bloc_test`
(`TeamBuilderCubit`), `mocktail` (fakes for `PokedexRepository`/
`TeamRosterStore`/the amended `RosterValidityChecker`, so domain and
application tests run without Flutter or network), `integration_test`
(end-to-end armador flow, plus a regression pass over the existing
`game_selection_flow_test.dart` now that "Continuar" really navigates)

**Target Platform**: Android and Web from the existing single Flutter codebase (unchanged)

**Project Type**: Frontend-only mobile+web application — no backend service is introduced by this feature

**Performance Goals**: Pokédex loaded and ready for interaction within
~2s on a typical connection for a regional dex; name/type/generation
filter response perceived as instant (<100ms), since filtering runs
client-side over an already-fetched list (research.md item 11); a
National Dex/DLC toggle change is a new fetch and is allowed to show a
brief loading state

**Constraints**: No backend/server component; must degrade gracefully
with a clear, retryable error when PokeAPI is unreachable (FR-020); team
size is fixed at 6 and enforced client-side (FR-009); National Dex
toggle only offered for 2nd–7th generation games (FR-016); DLC toggles
only offered when `Game.dlcs` is non-empty (FR-018/FR-019)

**Scale/Scope**: One new bounded context (`team_builder`: ~1 page, ~6-8
widgets, 2 new ports + 1 implemented pre-existing port, 4 use cases) plus
a small, low-risk edit to `game_selection`'s presentation layer (remove
the ahead-of-spec DLC-toggle UI/state, wire real navigation). A single
game's Pokédex is at most a few hundred entries (largest national dexes
are ~800-1000); single user per device, no concurrency/multi-device sync

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Simplicity & YAGNI | No new package dependency; reuses the existing HTTP/state-management/local-storage stack. Filtering stays client-side over an already-fetched list rather than adding server-side pagination. The ahead-of-spec DLC-toggle code in `game_selection` is removed rather than kept alongside a second copy in `team_builder` (research.md item 2). | PASS |
| II. Test-First Development | Domain/application layers are plain Dart with all three ports (`PokedexRepository`, `TeamRosterStore`, `RosterValidityChecker`) mockable via `mocktail`; `bloc_test` covers `TeamBuilderCubit`; `integration_test` covers the end-to-end armador flow and a regression pass on the existing game-selection flow. | PASS |
| III. Clear Contracts & Interfaces | Two new explicit ports (`PokedexRepository`, `TeamRosterStore`) plus one pre-existing port now implemented for real (`RosterValidityChecker`), all documented in `contracts/`, independently testable via fakes. | PASS |
| IV. Code Quality & Review | Standard `flutter analyze`/lint gate and required review apply; the `game_selection` edit is small and localized (button handler + removing dead-ahead-of-spec state), reviewable as part of the same change. | PASS |
| V. Observability & Versioning | Fetch failures surface through a typed `PokedexUnavailable` failure (mirroring `GameCatalogUnavailable`) that the presentation layer turns into the FR-020 retry message; a full team surfaces a typed `TeamFullFailure` rather than a silent no-op; app version follows `pubspec.yaml` semantic versioning. | PASS |
| VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE) | New `team_builder` bounded context with its own `domain/` (zero Flutter/HTTP/storage imports), `application/` (use cases depending only on domain + its ports), `infrastructure/`+`presentation/` adapters. It depends on `game_selection`'s already-public domain types (`Game`, `Generation`, `GameDlc`, `TeamBuildingSession`) as an explicit, documented cross-context contract (data-model.md "Reused entities"), and implements — rather than redefines — the `RosterValidityChecker` port `game_selection` already owns. Dependencies point inward only. | PASS |

No violations — the Complexity Tracking table below is intentionally
empty. The `game_selection` presentation edit (removing the ahead-of-spec
DLC toggle, wiring real navigation) is a same-layer, same-context
cleanup of an already-unshipped seam, not a new architectural exception.

**Post-Design re-check** (after Phase 1): `data-model.md` and
`contracts/` confirm the new domain (`PokedexEntry`, `PokemonType`,
`PokedexView`, `PokedexFilterCriteria`, `TeamSlot`, failure types) and
the two new ports (`PokedexRepository`, `TeamRosterStore`) stay
framework-free, with `http`/`shared_preferences`/Flutter confined to the
infrastructure and presentation adapters described in Project Structure;
the `RosterValidityChecker` implementation depends only on
`PokedexRepository`, not on any concrete adapter. All rows above remain
PASS; no new violations introduced by the design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/004-pokedex-team-builder/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
│   ├── pokedex_repository.md
│   ├── team_roster_store.md
│   └── roster_validity_checker_implementation.md
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   ├── game_selection/                              # EXISTING — unchanged except noted below
│   │   ├── entities/team_building_session.dart       # Now actually read/written (this feature)
│   │   └── ports/roster_validity_checker.dart         # Now implemented for real (this feature)
│   │
│   └── team_builder/                                  # NEW bounded context
│       ├── entities/
│       │   └── pokedex_entry.dart                     # PokedexEntry (FR-004, FR-006)
│       ├── value_objects/
│       │   ├── pokemon_type.dart                      # PokemonType (FR-012)
│       │   ├── pokedex_view.dart                       # PokedexView (FR-016–FR-019)
│       │   ├── pokedex_filter_criteria.dart             # PokedexFilterCriteria (FR-011–FR-015)
│       │   └── pokedex_entry_source.dart                # regional/national/dlc(id) tag
│       ├── ports/
│       │   ├── pokedex_repository.dart                  # Port: fetch a game's Pokédex under a view
│       │   └── team_roster_store.dart                   # Port: read/write the persisted roster
│       └── failures/
│           ├── pokedex_failure.dart                      # PokedexUnavailable
│           └── team_full_failure.dart                     # TeamFullFailure
│
├── application/
│   ├── game_selection/                                 # EXISTING — unchanged
│   │
│   └── team_builder/
│       └── use_cases/
│           ├── get_pokedex.dart                          # Loads the active view's entries (FR-003/004/006/016–018)
│           ├── filter_pokedex_entries.dart                # Name/type/generation, AND-combined (FR-011–015)
│           ├── add_pokemon_to_team.dart                   # FR-008, FR-009
│           └── remove_pokemon_from_team.dart              # FR-010
│
├── infrastructure/
│   ├── game_selection/
│   │   └── always_valid_roster_checker.dart              # REMOVED — replaced by the adapter below
│   │
│   └── team_builder/
│       ├── pokeapi_pokedex_repository.dart                # Implements PokedexRepository via PokeAPI
│       ├── local_team_roster_store.dart                   # Implements TeamRosterStore via shared_preferences
│       └── pokedex_roster_validity_checker.dart            # Implements game_selection's RosterValidityChecker
│
└── presentation/
    ├── game_selection/
    │   ├── cubit/game_selection_cubit.dart                # EDITED: remove toggleDlc; "Continuar" → navigate
    │   ├── cubit/game_selection_state.dart                 # EDITED: remove activeDlcIds
    │   └── pages/game_selection_page.dart                  # EDITED: remove DlcToggleList; push TeamBuilderPage
    │
    └── team_builder/
        ├── cubit/
        │   ├── team_builder_cubit.dart                      # Calls use cases, exposes UI state
        │   └── team_builder_state.dart
        ├── pages/
        │   └── team_builder_page.dart                        # Screen: slots + search/filters/toggles + grid
        └── widgets/
            ├── team_slot_row.dart                              # The 6 TeamSlot widgets
            ├── team_slot.dart                                   # One empty/occupied slot
            ├── pokedex_entry_card.dart                          # Hoverable/selectable grid tile (FR-007)
            ├── pokedex_search_bar.dart                           # FR-011 (mirrors GameSearchBar)
            ├── pokedex_type_filter.dart                          # FR-012
            ├── national_dex_toggle.dart                          # FR-016/017
            └── dlc_toggle_list.dart                               # MOVED from presentation/game_selection

test/
├── domain/team_builder/
├── application/team_builder/                             # Use-case tests with faked ports
├── application/game_selection/                            # NEW: pokedex_roster_validity_checker feeds SwitchGame path (regression)
├── infrastructure/team_builder/                            # Adapter tests (HTTP mapping, shared_preferences)
└── presentation/team_builder/                              # Widget + bloc_test coverage

integration_test/
└── team_builder_flow_test.dart                              # End-to-end: open, add/remove, filter, toggle
```

**Structure Decision**: Same single Flutter package as
`001-select-game`/`002`/`003` (mobile + web from one codebase, no
backend). This feature adds one more bounded context
(`team_builder`) alongside the existing `game_selection` and
`language_selection`, following the identical four-layer shape, and
makes one small, same-layer edit to `game_selection`'s presentation code
to fill the navigation seam and remove the ahead-of-spec DLC-toggle
control it was carrying for this feature (research.md items 2–3). The
`GenerationFilter` widget from `presentation/game_selection/widgets/` is
reused as-is (already generic over `Generation`) rather than duplicated.

## Complexity Tracking

*No entries — Constitution Check reported no violations to justify.*
