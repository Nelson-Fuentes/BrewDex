# Implementation Plan: Formas por Juego, Reparación de Megaevolución, Slots más Grandes, Íconos y Movimientos

**Branch**: `011-forms-icons-moves` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-forms-icons-moves/spec.md`

## Summary

Five corrections/additions to the `team_builder` bounded context's customization card and armador layout: (1) gate Mega Evolution/Gigamax (and, where data allows, other alternate forms) by the active game via hand-maintained allow-lists, since PokeAPI carries no "playable in this version-group" field for forms; (2) fix the Mega/Gigamax buttons to actually toggle instead of only ever activating; (3) shrink the team-slots grid's column count from 3 to 2 in the two-pane/web layout so each tile roughly doubles in area; (4) raise the fixed icon sizes at every `PokemonTypeIcon` call site (the image source — Escarlata/Púrpura Gen IX icons — is already correct, set in `008`); (5) add a new Movimientos section to the customization card: 4 move slots, a new `MovepoolRepository` port resolving a Pokémon's learnset filtered to the exact active `version-group`/`Game.id` (PokeAPI's `pokemon.moves[].version_group_details`), and a move-selection sheet showing name/type/PP/power/description per candidate, filterable by type.

## Technical Context

**Language/Version**: Dart 3.8.1 (per `pubspec.yaml`), Flutter stable.

**Primary Dependencies**: `flutter_bloc` (Cubit pattern, unchanged), `equatable`, `http` (PokeAPI client, unchanged) — no new external dependency introduced; the Moves feature reuses the exact same `http`/JSON approach `PokeApiPokedexRepository` already uses.

**Storage**: `RosterEntry`'s existing JSON-based local persistence (unchanged mechanism) — extended with one new field (`moveIds`), following the same "only non-default fields serialized" convention already in place.

**Testing**: `flutter_test` (widget/unit), `bloc_test` where already used for `TeamBuilderCubit` — unchanged from prior features.

**Target Platform**: Flutter multi-platform (mobile + web) — this feature specifically targets a web/desktop-layout bug (User Story 3) alongside cross-platform fixes/additions.

**Project Type**: Single Flutter application, Hexagonal/DDD layered (`lib/domain`, `lib/application`, `lib/infrastructure`, `lib/presentation`) — unchanged structure, no new project.

**Performance Goals**: No new hard numeric target; the Moves feature MUST NOT be fetched eagerly for the whole Pokédex (research.md Decision 6) — bounded to one variety's learnset fetched on demand, matching the cost profile `009-stats-chart-full-pokedex` already established as acceptable for per-species enrichment.

**Constraints**: PokeAPI remains the sole external data source (Constitution — only `infrastructure` adapters may know its shapes); domain/application layers stay framework-free (Principle VI, non-negotiable).

**Scale/Scope**: Extends the existing `team_builder` bounded context only — no new bounded context. New surface: 1 domain value object (`Move`), 1 small domain constants file (form-availability allow-lists), 1 new port + 1 new infrastructure adapter (`MovepoolRepository`/`PokeApiMovepoolRepository`), amendments to `RosterEntry`, `PokeApiPokedexRepository`, `TeamBuilderCubit`/`TeamBuilderState`, `PokemonCustomizationCard`, `TeamSlotRow`, and the 5 `PokemonTypeIcon` call sites.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

- **I. Simplicity & YAGNI**: The new `Move` value object carries only the 5 fields the spec asks for (research.md Decision 7); form-availability gating reuses the existing const-allow-list pattern instead of inventing a generic rules engine (Decision 1); team-slot sizing is a one-line `crossAxisCount` change, not a new sizing system (Decision 3). **PASS**.
- **II. Test-First Development**: Every contract below states its own test expectations; the Mega/Gigamax toggle fix (User Story 2) is a bug fix and MUST ship with a regression test proving the old always-`true` behavior would have failed it. **PASS** (enforced at `/speckit-tasks`/`/speckit-implement` time).
- **III. Clear Contracts & Interfaces**: New port `MovepoolRepository` is documented in `contracts/movepool_repository.md` with an explicit, minimal interface (one method) — independently testable via a fixture `http.Client`, same pattern `PokeApiPokedexRepository`'s existing tests already use. **PASS**.
- **IV. Code Quality & Review / V. Observability & Versioning**: No change to this project's review/versioning process; `MovepoolRepository`'s adapter follows the same `developer.log` + `PokedexUnavailable` failure pattern already used throughout `infrastructure/team_builder`. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)**: `Move` and the form-availability allow-lists live in `domain/team_builder`, framework/HTTP-free. `MovepoolRepository` is a domain-defined port; only `PokeApiMovepoolRepository` (infrastructure) knows PokeAPI's `pokemon.moves`/`move` JSON shapes. `PokemonCustomizationCard` (presentation) stays a thin, purely-presentational widget — all it does is call `onChanged`/a new Cubit-forwarded callback, exactly like every existing section of that card. No dependency points outward. **PASS**.

No violations requiring the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
specs/011-forms-icons-moves/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── form_availability_by_game.md
│   ├── mega_gigamax_toggle.md
│   ├── team_slot_sizing.md
│   ├── type_icon_sizes.md
│   ├── movepool_repository.md
│   └── move_slots_ui.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Single Flutter project, Hexagonal/DDD layering — unchanged top-level structure from every prior feature in this repo:

```text
lib/
├── domain/team_builder/
│   ├── entities/pokedex_entry.dart                    # unchanged (data-model.md)
│   ├── value_objects/selectable_form.dart              # unchanged
│   ├── value_objects/roster_entry.dart                 # AMENDED: + moveIds
│   ├── value_objects/move.dart                         # NEW
│   ├── value_objects/form_availability.dart             # NEW (kMegaEvolutionEnabledGameIds, kGigamaxEnabledGameIds)
│   └── ports/movepool_repository.dart                    # NEW
├── infrastructure/team_builder/
│   ├── pokeapi_pokedex_repository.dart                  # AMENDED: gate megaForm/gigamaxForm by game
│   └── pokeapi_movepool_repository.dart                  # NEW
├── presentation/team_builder/
│   ├── cubit/team_builder_cubit.dart                     # AMENDED: movepool fetch/select/clear methods
│   ├── cubit/team_builder_state.dart                     # AMENDED: active-slot movepool state
│   └── widgets/
│       ├── pokemon_customization_card.dart                # AMENDED: toggle fix, icon sizes, moves section
│       ├── team_slot.dart                                 # AMENDED: icon sizes
│       ├── team_slot_row.dart                             # AMENDED: crossAxisCount by shrinkWrap
│       ├── pokedex_type_filter.dart                        # AMENDED: icon size
│       ├── type_icon_resolution.dart                       # unchanged (source URL already correct)
│       └── move_selection_sheet.dart                       # NEW
└── l10n/arb/app_*.arb (all 10 locales)                     # AMENDED: new Moves-section keys

test/
├── domain/team_builder/
│   ├── value_objects/move_test.dart                        # NEW
│   └── value_objects/form_availability_test.dart            # NEW
├── infrastructure/team_builder/
│   ├── pokeapi_pokedex_repository_test.dart                 # AMENDED: gating cases
│   └── pokeapi_movepool_repository_test.dart                # NEW
└── presentation/team_builder/
    ├── pokemon_customization_card_test.dart                 # AMENDED: toggle fix, moves section, icon sizes
    ├── widgets/team_slot_row_test.dart                       # AMENDED: crossAxisCount
    └── widgets/team_slot_pokeball_and_types_test.dart        # AMENDED: icon sizes
```

**Structure Decision**: Extends the existing single-project Hexagonal/DDD layout (`lib/domain|application|infrastructure|presentation`) already used by every prior feature — no new project, no new bounded context. The only new port/adapter pair (`MovepoolRepository`/`PokeApiMovepoolRepository`) follows the exact same shape as the existing `PokedexRepository`/`PokeApiPokedexRepository` pair.

## Complexity Tracking

*No violations — table omitted per template instructions.*
