# Implementation Plan: Ajustes de Tamaño de Tipos, Disponibilidad de Formas por Juego, Tarjetas y Análisis de Cobertura

**Branch**: `013-team-pokedex-ui-fixes` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-team-pokedex-ui-fixes/spec.md`

## Summary

Eight follow-on corrections/additions to the `team_builder` context: (1)/(3)/(4) a single shared, much smaller type-badge size (`kStandardTypeIconSize`) replaces the current per-widget sizes (96–224px, the result of repeated ×4 escalations in `010`–`012`) everywhere a type is shown — team slot, Pokédex type filter (also dropping its fixed black background and its oversized touch-target box down to the icon's own size), and the customization card; (2) `TeamBuilderCubit.load()` gains a form-validity reconciliation pass — mirroring the species-obtainability reconciliation already there — that resets a roster entry's `formVarietyId`/Mega/Gigamax selection back to the principal form whenever it no longer resolves against the freshly-fetched, game-scoped `PokedexEntry` (the mechanism behind "Alola forms selectable in Rojo Fuego/Verde Hoja"); (5) the customization card's sprite grows from 96×96 to 168×168 (+75%); (6) the "Debilidades de tipo" section and its two private widgets are deleted from the customization card; (7) the chosen-move row reuses the move-selection sheet's own row widget (promoted from private to a small shared `MoveListTile`) instead of its own bespoke layout; (8) the "Quitar del equipo" button moves out of the scrollable column into a fixed footer so it never scrolls out of view; (9) a first, minimal "Análisis de Cobertura" page is added, reachable from the armador's app bar, showing one `DataTable` whose only populated column so far lists every Pokémon type by name.

## Technical Context

**Language/Version**: Dart 3.8.1, Flutter stable — unchanged.

**Primary Dependencies**: `flutter_bloc`, `equatable`, `http` — unchanged, no new dependency. The coverage table uses Flutter's built-in `DataTable` (first use in this codebase, no package).

**Storage**: `RosterEntry` persistence (`TeamRosterStore`) unchanged in shape; User Story 2 changes *when* `formVarietyId`/`megaActive`/`gigamaxActive` get cleared (now also on a game switch that invalidates them), not how they're stored.

**Testing**: `flutter_test`, `bloc_test` — unchanged.

**Target Platform**: Flutter multi-platform. User Story 1 explicitly covers both the web/desktop and mobile/compact layouts of the team slots.

**Project Type**: Single Flutter application, Hexagonal/DDD layered — unchanged structure. No new bounded context; User Story 7's Coverage Analysis page is a new presentation-layer page inside the existing `team_builder` context (it consumes only already-exposed domain value objects — `PokemonType` — for this first increment).

**Performance Goals**: No new network calls. The form-validity reconciliation (User Story 2) reads the already-resolved `PokedexEntry` list `load()` fetches on every game open/switch — no extra request.

**Constraints**: PokeAPI remains the sole external data source; domain/application layers stay framework-free (Principle VI). The Pokédex type filter's touch target shrinks to the icon's own size per FR-009, which is a deliberate, explicitly-requested regression from the ≥44dp minimum touch target guidance recorded in `002-material-design-ui` (documented in research.md, not silently dropped).

**Scale/Scope**: Extends the existing `team_builder` context only. No new port/use case for User Stories 1, 3, 4, 5, 6 (pure presentation-layer sizing/layout/reuse changes). User Story 2 changes one cubit method (`load()`) and adds one small pure helper it calls. User Story 7 adds one new page + one new widget, wired to a single existing constant (`kAllPokemonTypes`) and one new app-bar action — no new repository, use case, or port.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

- **I. Simplicity & YAGNI**: A single named constant (`kStandardTypeIconSize`) replaces per-widget magic numbers instead of introducing a theming/config layer (research.md Decision 1). The form-validity fix reuses the exact reconciliation pattern already present in `load()` for species obtainability — no new abstraction. The Coverage Analysis page renders directly off `kAllPokemonTypes`; no new repository/use case is added until a later feature actually needs per-Pokémon coverage data (spec.md Assumptions). **PASS**.
- **II. Test-First Development**: Each contract below states its own test expectations; the form-validity reconciliation (the one behavior change with real business logic) ships with a failing-first cubit test before the fix. **PASS** (enforced at `/speckit-tasks`/`/speckit-implement`).
- **III. Clear Contracts & Interfaces**: `MoveListTile` becomes a small, documented, independently-testable public widget instead of a private duplicate (contracts/reusable_move_list_tile.md) — the same "promote a private widget instead of copy-pasting it" shape as prior features' shared widgets. **PASS**.
- **IV. Code Quality & Review**: Removing the weaknesses section also removes its two now-unused private widgets (`_TypeWeaknessTable`, `_WeaknessCell`) — no dead UI code left behind (contracts/remove_type_weaknesses.md). The domain-level `typeEffectivenessAgainst`/`type_effectiveness_chart.dart` calculation is kept: it remains covered by its own existing unit tests and is the calculation the Coverage Analysis section's next increment will need — documented in research.md Decision 5 rather than silently orphaned. `customizationCardWeaknessesLabel` is removed from every `.arb` locale file (no unused l10n key left behind). **PASS**.
- **V. Observability & Versioning**: No change to logging/versioning posture. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)**: The form-validity reconciliation lives in `TeamBuilderCubit` (presentation) and reads only already-domain-exposed fields (`PokedexEntry.selectableForms`/`megaForm`/`gigamaxForm`, `RosterEntry`) — no new infrastructure dependency, no domain/application code added. The Coverage Analysis page is a thin presentation adapter over the existing `kAllPokemonTypes` presentation constant; it introduces no new port. No dependency points outward. **PASS**.

No violations requiring the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
specs/013-team-pokedex-ui-fixes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── standard_type_icon_size.md
│   ├── form_availability_revalidation.md
│   ├── pokedex_type_filter_compact.md
│   ├── customization_card_image_size.md
│   ├── remove_type_weaknesses.md
│   ├── reusable_move_list_tile.md
│   ├── sticky_remove_button.md
│   └── coverage_analysis_table.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Single Flutter project, Hexagonal/DDD layering — unchanged top-level structure:

```text
lib/
├── presentation/team_builder/
│   ├── widgets/
│   │   ├── type_icon_resolution.dart          # AMENDED: + kStandardTypeIconSize constant
│   │   ├── team_slot.dart                      # AMENDED: type icons use the standard size, Wrap spacing tightened
│   │   ├── pokedex_type_filter.dart             # AMENDED: standard size, no black bg, box == icon size
│   │   ├── pokemon_customization_card.dart      # AMENDED: image +75%, types row standard size, weaknesses
│   │   │                                        #   section removed, moves section reuses MoveListTile,
│   │   │                                        #   Quitar del equipo becomes a fixed footer (Column split)
│   │   ├── move_selection_sheet.dart            # AMENDED: `_MoveListTile` promoted to public `MoveListTile`
│   │   │                                        #   with an optional `trailing` slot
│   │   └── coverage_table.dart                  # NEW: DataTable — first column lists kAllPokemonTypes
│   ├── pages/
│   │   ├── team_builder_page.dart               # AMENDED: + app bar action opening CoverageAnalysisPage
│   │   └── coverage_analysis_page.dart          # NEW: AdaptiveScaffold wrapping CoverageTable
│   └── cubit/
│       └── team_builder_cubit.dart              # AMENDED: load() reconciles each roster entry's
│                                                 #   formVarietyId/megaActive/gigamaxActive against the
│                                                 #   freshly resolved, game-scoped PokedexEntry
├── l10n/*.arb                                   # AMENDED (all 10 locales): + coverageAnalysis* keys,
│                                                 #   - customizationCardWeaknessesLabel (now unused)
└── l10n/generated/...                           # regenerated from the .arb changes above

test/
├── presentation/team_builder/
│   ├── widgets/
│   │   ├── team_slot_row_test.dart                 # AMENDED: type icon size, two-in-a-row assertion
│   │   ├── pokedex_type_filter_test.dart            # AMENDED: no black bg, box size == icon size
│   │   ├── pokemon_customization_card_test.dart     # AMENDED: image size, weaknesses absent, sticky
│   │   │                                            #   footer, reused MoveListTile
│   │   ├── move_selection_sheet_test.dart           # AMENDED: MoveListTile still renders/selects moves
│   │   └── coverage_table_test.dart                 # NEW: first column lists every type by name
│   └── coverage_analysis_page_test.dart             # NEW: page renders CoverageTable, reachable from
│                                                     #   the armador's app bar action
├── presentation/team_builder/cubit/
│   └── team_builder_cubit_form_reconciliation_test.dart  # NEW: game switch clears an invalid form
```

**Structure Decision**: Extends the existing single-project Hexagonal/DDD layout — no new project, no new bounded context. The Coverage Analysis page lives inside the existing `team_builder` presentation folder since it operates on the same roster/game concepts; a dedicated `coverage_analysis` context would be premature ahead of the actual per-Pokémon coverage logic a future increment adds (Principle I).

## Complexity Tracking

*No violations — table omitted per template instructions.*
