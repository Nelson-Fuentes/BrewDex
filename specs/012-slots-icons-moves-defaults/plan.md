# Implementation Plan: Slots 3×2 sin Espacio Desperdiciado, Íconos ×4, Movimientos por Defecto y Filtro Ocultable

**Branch**: `012-slots-icons-moves-defaults` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-slots-icons-moves-defaults/spec.md`

## Summary

Five follow-on corrections to the `team_builder` customization/armador surface delivered in `010`/`011`: (1) the two-pane/web team-slots grid switches from a 2-column square layout to a measured 3×2 grid (`LayoutBuilder` + computed `childAspectRatio`) with its surrounding padding removed, so each slot reads ~1.5× larger; (2) every `PokemonTypeIcon` call site's fixed size is multiplied by 4 from its current value; (3) adding a Pokémon to the team now auto-fills its 4 move slots with the last (highest-level) moves it learns by level-up in the active game, via a new `MovepoolRepository.fetchDefaultMoveset` method; (4) the move-selection sheet's type filter starts hidden, revealed by a toggle; (5) each move slot in the customization card spans the card's full width instead of a fixed-width tile in a wrap.

## Technical Context

**Language/Version**: Dart 3.8.1, Flutter stable — unchanged.

**Primary Dependencies**: `flutter_bloc`, `equatable`, `http` — unchanged, no new dependency.

**Storage**: `RosterEntry.moveIds` persistence unchanged — only *when* it's populated changes (now also at add-time).

**Testing**: `flutter_test`, `bloc_test` — unchanged.

**Target Platform**: Flutter multi-platform — User Story 1 specifically targets the web/desktop layout.

**Project Type**: Single Flutter application, Hexagonal/DDD layered — unchanged structure.

**Performance Goals**: `fetchDefaultMoveset` adds one extra per-add-to-team resolution pass (reusing the same already-open `pokemon/{varietyId}` fetch pattern `fetchMovepool` already uses) — bounded to the single Pokémon just added, never the whole roster or dex.

**Constraints**: PokeAPI remains the sole external data source; domain/application layers stay framework-free (Principle VI).

**Scale/Scope**: Extends the existing `team_builder` context only. New surface: 1 port method (`fetchDefaultMoveset`) + its adapter implementation, 1 new application use case (`GetDefaultMoveset`), layout changes to `TeamSlotRow`/`TeamBuilderTwoPaneLayout`/`PokemonCustomizationCard`/`MoveSelectionSheet`, icon-size constant bumps at 5 call sites (unchanged from `011`'s list).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

- **I. Simplicity & YAGNI**: Icon sizes are a flat ×4 multiply of already-established constants (Decision 2); the 3×2 grid math is a direct formula, no generic layout engine introduced (Decision 1); the type-filter toggle reuses the same local-`StatefulWidget`-state pattern already used elsewhere (Decision 5). **PASS**.
- **II. Test-First Development**: Every contract states its own test expectations; `fetchDefaultMoveset` (new business logic) ships with contract tests before the Cubit wiring that consumes it. **PASS** (enforced at `/speckit-tasks`/`/speckit-implement`).
- **III. Clear Contracts & Interfaces**: `fetchDefaultMoveset` is documented as a new, minimal, independently-testable port method (contracts/default_moveset.md) — kept separate from `fetchMovepool` specifically to avoid overloading one method with two different response shapes/semantics (research.md Decision 3). **PASS**.
- **IV/V. Code Quality & Review / Observability & Versioning**: No change to review/versioning process; `PokeApiMovepoolRepository`'s new method follows the same `developer.log`/`PokedexUnavailable` failure pattern already established. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)**: `fetchDefaultMoveset` lives on the existing domain-defined `MovepoolRepository` port; only `PokeApiMovepoolRepository` (infrastructure) parses PokeAPI's `move_learn_method`/`level_learned_at` fields. `GetDefaultMoveset` (application) orchestrates the port + `ActiveLanguageReader`, mirroring `GetMovepool`. `TeamBuilderCubit` (presentation) composes it into `addPokemon` the same way it already composes multiple use cases in `load()`. No dependency points outward. **PASS**.

No violations requiring the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
specs/012-slots-icons-moves-defaults/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── team_slots_3x2.md
│   ├── type_icon_sizes_x4.md
│   ├── default_moveset.md
│   ├── move_type_filter_toggle.md
│   └── full_width_move_slots.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Single Flutter project, Hexagonal/DDD layering — unchanged top-level structure:

```text
lib/
├── domain/team_builder/
│   └── ports/movepool_repository.dart                    # AMENDED: + fetchDefaultMoveset
├── application/team_builder/use_cases/
│   └── get_default_moveset.dart                            # NEW (mirrors get_movepool.dart)
├── infrastructure/team_builder/
│   └── pokeapi_movepool_repository.dart                    # AMENDED: implements fetchDefaultMoveset
├── app_dependencies.dart                                    # unchanged shape (movepoolRepository already wired in 011)
└── presentation/team_builder/
    ├── cubit/team_builder_cubit.dart                         # AMENDED: addPokemon resolves + applies default moveset
    └── widgets/
        ├── team_slot_row.dart                                # AMENDED: LayoutBuilder + computed childAspectRatio, 3 columns
        ├── team_builder_two_pane_layout.dart                  # AMENDED: remove/reduce slots-side padding
        ├── team_slot.dart                                     # AMENDED: icon sizes ×4
        ├── pokemon_customization_card.dart                    # AMENDED: icon sizes ×4, Moves section Wrap→Column full-width
        ├── pokedex_type_filter.dart                           # AMENDED: icon size ×4
        └── move_selection_sheet.dart                          # AMENDED: hideable type filter (toggle)

test/
├── infrastructure/team_builder/
│   └── pokeapi_movepool_repository_test.dart                  # AMENDED: fetchDefaultMoveset contract tests
├── presentation/team_builder/
│   ├── widgets/team_slot_row_test.dart                         # AMENDED: 3×2 + childAspectRatio math
│   ├── team_builder_cubit_moves_test.dart                       # AMENDED: addPokemon default-moveset tests
│   ├── pokemon_customization_card_test.dart                     # AMENDED: icon sizes, full-width move slots
│   ├── pokedex_type_filter_test.dart                             # AMENDED: icon size
│   └── widgets/team_slot_pokeball_and_types_test.dart            # AMENDED: icon sizes
```

**Structure Decision**: Extends the existing single-project Hexagonal/DDD layout — no new project, no new bounded context. The new port method follows the exact shape of the existing `fetchMovepool`/`GetMovepool` pair already established in `011`.

## Complexity Tracking

*No violations — table omitted per template instructions.*
