# Implementation Plan: Correcciones del Configurador de Equipo y la Pokédex

**Branch**: `008-configurador-equipo-correcciones` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-configurador-equipo-correcciones/spec.md`

## Summary

Eight bug-fixes/small additions on top of the already-shipped `team_builder` armador (built by `004-pokedex-team-builder` through `007-configurador-equipo-mejoras`): (1) the expanded/desktop team-slots column stops being a fixed 320px, shrink-wrapped island and fills its available space; (2) the Pokédex's scroll-driven batch resolution is made to keep resolving until the list is actually scrollable/exhausted, instead of depending only on discrete scroll-notification deltas; (3) type badges switch from the per-generation "in-game HUD" icon set to a single, generation-independent official type-icon set; (4) the `PokemonCustomizationCard` bottom sheet is made reactive to the live `TeamBuilderCubit` state instead of rendering a frozen snapshot — which is also the root cause behind three of the other reported bugs; (5) a single-fixed-gender species (`gender_rate` 0 or 8) gets its one legitimate gender auto-applied instead of being silently left with no gender at all; (6)/(7) combining Shiny with a Mega/Gigamax/alternate form, and the card reflecting a newly-chosen form in full, are both fixed by (4) — the sprite/type resolution logic that combines them was already correct, it just never reached the screen because every `onChanged` call composed off the same stale opening-time snapshot; (8) the customization card gains a new base-stats section, sourced from a new `pokemon.stats` read already available on the same HTTP response the repository fetches per form.

The single highest-leverage fix is (4): `TeamBuilderPage._openCustomizationCard` opens `PokemonCustomizationCard` as a plain `StatelessWidget` inside `showModalBottomSheet`'s `builder`, with `entry`/`rosterEntry` captured once from `state.slots[slotIndex]` at open time and never refreshed. Every field control's `onChanged` derives its new `RosterEntry` via `rosterEntry.copyWith(...)` off that same frozen object, so each tap silently discards whatever the *previous* tap in the same card session persisted (research.md Decision 4) — this reads to a user as "the gender toggle doesn't work", "shiny reverts when Mega is picked", and "the card doesn't show the new form", because in every case it is the same field-loss mechanism, just triggered by a different pair of controls.

## Technical Context

**Language/Version**: Dart (Flutter, `flutter_bloc` state management) — existing project, no new language/runtime.

**Primary Dependencies**: `flutter_bloc`, `equatable`, `http` (already in use by `team_builder`); no new package dependencies are introduced by this feature. Base stats and the official type-icon set are both read from HTTP responses the repository already fetches or can fetch from the same two already-integrated sources (PokeAPI's `pokemon` resource, `github.com/PokeAPI/sprites`).

**Storage**: `TeamRosterStore` (existing local persistence port/adapter) — unchanged shape; `RosterEntry.gender` gains an auto-applied value for single-fixed-gender species at add-time, still persisted the same way.

**Testing**: `flutter test` — unit tests for domain/application (`test/domain/team_builder`, `test/application/team_builder`), widget tests for presentation (`test/presentation/team_builder`), matching the existing per-layer test tree. Each bug fix ships with a regression test that reproduces the reported wrong behavior first (Constitution Principle II) — in particular a widget test that opens the customization card, taps two different controls in sequence, and asserts both changes are still present in the persisted `RosterEntry`.

**Target Platform**: Flutter multi-platform (Android + Web). User Story 2 (team column fills free space) is scoped to the existing `ScreenSize.expanded` two-pane layout (`TeamBuilderTwoPaneLayout`, web/desktop), same as `007-configurador-equipo-mejoras`; every other story applies to both the compact/medium and expanded layouts, since the customization card, sprite/type/stat resolution, and Pokédex batching are shared code, not layout-specific.

**Performance Goals**: No regression to the existing "first ~20 entries visible in under 1s" behavior (007's SC-003); Pokédex batch resolution must still converge to the full dex without requiring an unbounded number of user scroll gestures near the exact bottom pixel.

**Constraints**: No new PokeAPI endpoints — base stats (`pokemon.stats`) and the official type icons (`github.com/PokeAPI/sprites/sprites/types/generation-ix/<any-modern-game>/`) are both already-reachable data on infrastructure this adapter already calls, per Principle I (prefer existing dependencies/integrations over adding new ones).

**Project Type**: Single Flutter app (`mobile-app` + `web`), existing Hexagonal/DDD layering (`lib/domain`, `lib/application`, `lib/infrastructure`, `lib/presentation`) — this feature amends the existing `team_builder` bounded context only, no new bounded context.

**Scale/Scope**: Same scale as `007-configurador-equipo-mejoras` (National Dex ≈ 900+ species for the largest eligible games; 6-slot team, unchanged).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity & YAGNI**: The reactive-card fix (Decision 4) is the smallest change that removes the stale-snapshot bug — rewiring the existing `showModalBottomSheet` call site with a `BlocBuilder`-fed slot lookup, not a new state-management layer. Base stats add exactly one new value object (`PokemonStats`, 6 fixed ints) and one new field, no generic "stats system". **PASS**.
- **II. Test-First Development**: Every fix ships with a regression test reproducing the current wrong behavior first (see Technical Context/Testing). **PASS** (enforced at task-breakdown/implementation time).
- **III. Clear Contracts & Interfaces**: `PokedexRepository.fetchPokedexDetails`'s return type (`PokedexEntry`) gains a `baseStats` field and `SelectableForm` gains its own `baseStats` — additive, non-breaking (existing callers that don't read the new field are unaffected). `contracts/pokemon_customization_card_reactivity.md` documents the modal-sheet's new state-reading contract. **PASS**.
- **IV. Code Quality & Review**: No change.
- **V. Observability & Versioning**: No new failure surface — stats/type-icon parsing reuses `_getJson`'s existing `PokedexUnavailable` failure path; no partial-failure state is introduced. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD**: `PokemonStats` is a plain, framework-free domain value object (mirrors `PokemonType`); `PokeApiPokedexRepository` (infrastructure) is the only place that parses PokeAPI's `stats` JSON or builds a type-icon URL. The reactive-card fix stays entirely in `lib/presentation` (a `BlocBuilder` wiring change) — no new dependency crosses inward. **PASS**.

No violations requiring `Complexity Tracking`.

**Post-Phase-1 re-check**: `data-model.md` and `contracts/*.md` confirm the design stayed within the above — every new/amended type is a plain value object or an existing port/state class extended in place; no breaking contract change. **PASS, unchanged.**

## Project Structure

### Documentation (this feature)

```text
specs/008-configurador-equipo-correcciones/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── pokemon_customization_card_reactivity.md
│   ├── official_type_icons.md
│   └── pokemon_base_stats.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   └── team_builder/
│       ├── entities/pokedex_entry.dart                 # AMENDED: + baseStats
│       ├── value_objects/
│       │   ├── pokemon_stats.dart                       # NEW: plain 6-stat value object
│       │   ├── selectable_form.dart                     # AMENDED: + baseStats
│       │   └── roster_entry.dart                        # unchanged shape (gender default now set earlier, see application layer)
│       └── ports/pokedex_repository.dart                # unchanged signatures (additive field only)
├── application/
│   └── team_builder/use_cases/
│       └── add_pokemon_to_team.dart                     # AMENDED: auto-applies gender for a single-fixed-gender species (FR-006/FR-007)
├── infrastructure/
│   └── team_builder/pokeapi_pokedex_repository.dart      # AMENDED: reads pokemon.stats into PokemonStats for the principal variety and every SelectableForm
└── presentation/
    └── team_builder/
        ├── widgets/
        │   ├── type_icon_resolution.dart                 # AMENDED: single official icon set (no per-generation branching) + new public PokemonTypeIcon widget (FR-004)
        │   ├── pokemon_type_icons.dart                    # unchanged (still the network-failure fallback)
        │   ├── pokedex_type_filter.dart                   # AMENDED: renders via the new shared PokemonTypeIcon instead of its own private _TypeIcon
        │   ├── team_slot.dart                             # AMENDED: type row renders via PokemonTypeIcon instead of a bare Material Icon
        │   ├── team_builder_two_pane_layout.dart          # AMENDED: slots column fills available space (FR-003)
        │   ├── team_slot_row.dart                         # AMENDED: grid expands to fill its column instead of shrink-wrapping
        │   ├── pokedex_pane_slivers.dart                  # AMENDED: chained batch resolution until scrollable/exhausted (FR-001/FR-002)
        │   └── pokemon_customization_card.dart            # AMENDED: type row via PokemonTypeIcon; reads live roster entry via callback instead of only the frozen constructor field; + base-stats section (FR-004, FR-011/FR-012)
        ├── pages/team_builder_page.dart                    # AMENDED: `_openCustomizationCard` re-derives entry/rosterEntry from the live Cubit state on every rebuild (FR-005, FR-008–FR-010)
        └── cubit/team_builder_cubit.dart                   # unchanged public surface (existing `updateRosterEntry`/`state` already sufficient)

test/  # mirrors the above 1:1, existing structure (test/domain, test/application, test/infrastructure, test/presentation)
```

**Structure Decision**: Pure extension/repair of the existing single-Flutter-app, four-layer structure already in place for `team_builder` — no new top-level directory, package, or bounded context. Every amended file keeps its current location and public shape; the one additive domain change (`PokemonStats`, `PokedexEntry.baseStats`, `SelectableForm.baseStats`) is backward-compatible with every existing caller.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
