# Implementation Plan: Mejoras al Configurador de Equipo Pokémon

**Branch**: `007-configurador-equipo-mejoras` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-configurador-equipo-mejoras/spec.md`

## Summary

Six independently-shippable improvements to the existing `team_builder` armador: (1) drop the game-switch confirmation/removal-notice dialogs in favor of an unconditional reset on every game selection; (2) a two-pane desktop layout (team slots left, Pokédex right, independent scroll) that only applies at the app's existing `expanded` breakpoint; (3) batch/infinite-scroll loading of the Pokédex (~20 at a time) instead of eagerly resolving every species before showing anything, plus a search path that is not limited to the already-resolved batch; (4) a sprite-resolution fix so shiny/gender sprites follow the *selected form*, not just the principal one; (5) a reusable Pokébola-shaped background with a state-driven accent color, used in the Pokédex grid, team slots, and the customization card; (6) type badges (plus a new, user-editable Tera Type for Escarlata/Púrpura) shown on both team slots and the customization card, and a visual redesign of the customization card to the user-supplied reference layout.

The main technical risk is #3: `PokeApiPokedexRepository.fetchPokedex` today resolves **every** species' full detail (species + principal variety + types + forms + cosmetic variants — several sequential/parallel HTTP calls each) before returning anything, which is the actual cause of the slow National Dex load, not just "one big list". Fixing it requires splitting the port into a cheap index fetch and a batchable per-species detail fetch (research.md Decision 3).

## Technical Context

**Language/Version**: Dart (Flutter, `flutter_bloc` state management) — existing project, no new language/runtime.

**Primary Dependencies**: `flutter_bloc`, `equatable`, `http` (already in use by `team_builder`/`game_selection`); no new package dependencies are introduced by this feature.

**Storage**: `TeamRosterStore` (existing local persistence port/adapter) — unchanged shape, only what gets written changes (game switch always writes an empty roster; `RosterEntry` gains one optional field).

**Testing**: `flutter test` — unit tests for domain/application (`test/domain/team_builder`, `test/application/team_builder`, `test/domain/game_selection`), widget tests for presentation (`test/presentation/team_builder`, `test/presentation/game_selection`), matching the existing per-layer test tree.

**Target Platform**: Flutter multi-platform (Android + Web are the active build targets in this repo); this feature's web-only layout requirement (User Story 2) targets the Flutter **web** build specifically, gated by the existing `ScreenSize.expanded` breakpoint rather than by platform detection — a wide browser window and a wide desktop-class window both get the two-pane layout, consistent with how `Breakpoints`/`ResponsiveLayout` already work elsewhere in the app.

**Performance Goals**: First ~20 Pokédex entries visible in under 1s regardless of dex size (SC-003); no perceptible pause when scrolling through a full National Dex (SC-004).

**Constraints**: PokeAPI has no partial-name search endpoint (research.md Decision 3) — "consulta directa a la API" (FR-008) is satisfied by resolving against the full, cheaply-fetched species **index** (id/slug only) rather than a live per-keystroke network search, since no such endpoint exists to call. Web-only layout change (FR-003–FR-005) must not alter compact/medium behavior at all.

**Project Type**: Single Flutter app (`mobile-app` + `web`), existing Hexagonal/DDD layering (`lib/domain`, `lib/application`, `lib/infrastructure`, `lib/presentation`) — this feature adds to the existing `team_builder` and `game_selection` bounded contexts, no new bounded context.

**Scale/Scope**: National Dex ≈ 900+ species for the largest eligible games; team size is fixed at 6 slots (`kMaxTeamSize`, unchanged).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity & YAGNI**: The game-switch reset (User Story 1) actually **removes** code — `GameSelectionCubit.requestGameSwitch/cancelGameSwitch/confirmGameSwitch`, `GameSelectionState.pendingGameSwitch/rosterRemovalNotice`, both `AlertDialog`s in `game_selection_page.dart`, and the `SwitchGame` reconciliation use case all become dead once every selection is an unconditional reset — see research.md Decision 1. Tera Type (User Story 5) is scoped to exactly what FR-016a–c need (one field, one picker), not a general "battle mechanics" system. **PASS**.
- **II. Test-First Development**: Every existing test file touched by a changed use case/widget gets its assertions updated *before* the implementation change (tasks.md will sequence red→green per file); the sprite-resolution bug fix (User Story 4) ships with a regression test reproducing the current wrong-sprite behavior first. **PASS** (enforced at task-breakdown/implementation time).
- **III. Clear Contracts & Interfaces**: `PokedexRepository.fetchPokedex` is replaced by two narrower methods (`fetchPokedexIndex`, `fetchPokedexDetails`) — a breaking change to an internal port. Called out explicitly here and in `contracts/pokedex_repository_pagination.md`; this port has no consumer outside this codebase (it's an internal Hexagonal port, not a published package/API), so the semantic-versioning rule in Governance applies to the *app's* own version, not to a separately-versioned artifact — no external migration note is needed, only an in-repo one (this plan + the contract doc). **PASS**.
- **IV. Code Quality & Review**: No change.
- **V. Observability & Versioning**: The batched repository logs the same `PokedexUnavailable`-on-failure pattern already used by `PokeApiPokedexRepository`, per-batch instead of once. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD**: All new fields/methods stay in the existing layers they belong to — `SelectableForm`/`RosterEntry` (domain value objects, still framework-free), `PokedexRepository` (domain port) implemented by `PokeApiPokedexRepository` (infrastructure), `TeamBuilderCubit`/`GameSelectionCubit` (application-facing orchestration) — no new dependency crosses inward. The Pokébola-background widget and the two-pane layout are pure presentation (Flutter-only), same as `AdaptiveScaffold`/`ResponsiveLayout` today. **PASS**.

No violations requiring `Complexity Tracking`.

**Post-Phase-1 re-check**: `data-model.md` and `contracts/*.md` confirm the design stayed within the above — every new/amended type is a plain value object or an existing port/state class extended in place; the one breaking contract change (`PokedexRepository`) is documented with its full migration in `contracts/pokedex_repository_pagination.md` as promised above. **PASS, unchanged.**

## Project Structure

### Documentation (this feature)

```text
specs/007-configurador-equipo-mejoras/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── pokedex_repository_pagination.md
│   ├── game_switch_reset.md
│   ├── tera_type.md
│   └── pokeball_background.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   ├── game_selection/
│   │   ├── entities/team_building_session.dart      # unchanged shape
│   │   └── use_cases/... (application layer, see below) — SwitchGame removed
│   └── team_builder/
│       ├── entities/pokedex_entry.dart               # unchanged shape
│       ├── ports/pokedex_repository.dart              # AMENDED: index + details methods
│       ├── value_objects/
│       │   ├── roster_entry.dart                      # AMENDED: + teraType
│       │   ├── selectable_form.dart                   # AMENDED: + typePrimary/typeSecondary/female sprites
│       │   └── pokedex_index_entry.dart               # NEW: lightweight {pokemonId, pokedexNumber, sourceTag}
│       └── failures/pokedex_failure.dart              # unchanged
├── application/
│   ├── game_selection/use_cases/
│   │   ├── select_game.dart                           # AMENDED: always resets roster
│   │   └── switch_game.dart                           # REMOVED (dead once reset is unconditional)
│   └── team_builder/use_cases/
│       ├── get_pokedex_index.dart                     # NEW
│       ├── get_pokedex_details.dart                   # NEW (batch)
│       ├── search_pokedex.dart                        # NEW (index-backed, FR-008)
│       └── add_pokemon_to_team.dart                   # AMENDED: sets default teraType (FR-016a)
├── infrastructure/
│   └── team_builder/pokeapi_pokedex_repository.dart    # AMENDED: split index/detail fetch, per-form type+gender data
└── presentation/
    ├── game_selection/
    │   ├── cubit/ (game_selection_cubit.dart, game_selection_state.dart)  # AMENDED: drop pending/removal fields+methods
    │   └── pages/game_selection_page.dart               # AMENDED: dialogs removed
    └── team_builder/
        ├── cubit/ (team_builder_cubit.dart, team_builder_state.dart)      # AMENDED: index/details/infinite-scroll state
        ├── widgets/
        │   ├── pokeball_background.dart                 # NEW
        │   ├── slot_sprite_resolution.dart               # AMENDED: form-aware shiny/gender + new slot-type resolver
        │   ├── team_slot.dart                            # AMENDED: pokeball bg + type badges
        │   ├── pokedex_entry_card.dart                   # AMENDED: pokeball bg
        │   ├── pokemon_customization_card.dart           # REDESIGNED (reference layout) + type/Tera row
        │   ├── tera_type_picker.dart                     # NEW
        │   └── team_builder_two_pane_layout.dart         # NEW (web-only split; page picks this vs. existing CustomScrollView)
        └── pages/team_builder_page.dart                  # AMENDED: picks two-pane vs. single-column body by ScreenSize

test/  # mirrors the above 1:1, existing structure (test/domain, test/application, test/infrastructure, test/presentation)
```

**Structure Decision**: Pure extension of the existing single-Flutter-app, four-layer (`domain`/`application`/`infrastructure`/`presentation`) structure already in place for `team_builder` and `game_selection` — no new top-level directory, package, or bounded context. New files land beside their existing siblings in the same bounded context; amended files keep their current location and public shape as much as possible (only `PokedexRepository`'s method signatures actually break).

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
