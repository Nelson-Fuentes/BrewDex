# Implementation Plan: Tamaño de Tipos Legible, Tabla de Cobertura Visible y Estabilidad al Quitar Pokémon

**Branch**: `016-team-config-fixes-3` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-team-config-fixes-3/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Three regression fixes in BrewDex's team configurator (`TeamBuilderPage` and
its related widgets/pages): (1) raise `kStandardTypeIconSize` from the
current 24px (reported "too small/illegible") to a larger value that still
lets two type badges share one team-slot cell, per the same shared-constant
approach `013`/`014` already established; (2) make the Coverage Analysis
table (`CoverageAnalysisPage`/`CoverageTable`) actually visible — this is the
second report of the same symptom after a scroll-only fix, so this pass
inspects layout/constraints, not just re-adds scrolling; (3) fix a real
double-`Navigator.pop()` race in `TeamBuilderPage._openCustomizationCard`'s
`onRemove` handler that intermittently pops both the customization sheet
*and* the team-builder page route itself, landing the user on the game
selection menu.

## Technical Context

**Language/Version**: Dart (SDK `^3.8.1`), Flutter (stable channel matching `pubspec.yaml`)

**Primary Dependencies**: Flutter SDK (Material widgets), `flutter_bloc: ^9.1.1` (Cubit/BlocBuilder/BlocListener), `flutter_localizations`

**Storage**: N/A — this feature touches only presentation-layer rendering and navigation, no persistence changes

**Testing**: `flutter_test` widget tests (existing `test/presentation/team_builder/...` suite) plus `integration_test/` for the end-to-end remove-Pokémon and coverage-navigation flows

**Target Platform**: Flutter web (primary target for the "two types per slot" constraint) and mobile (Android/iOS), per the app's existing `ResponsiveLayout`/`Breakpoints`

**Project Type**: Mobile/web app (single Flutter codebase), hexagonal layering per the project constitution (`lib/domain`, `lib/application`, `lib/infrastructure`, `lib/presentation`)

**Performance Goals**: N/A — purely a UI-sizing/visibility/navigation-correctness fix, no throughput or latency target

**Constraints**: Two type badges MUST still fit within one team-slot cell's content width at the new, larger size; no new dependency should be needed for any of the three fixes

**Scale/Scope**: 3 targeted fixes confined to `lib/presentation/team_builder/` (`type_icon_resolution.dart`, `team_slot.dart`, `pokemon_customization_card.dart`, `pokedex_type_filter.dart`, `coverage_analysis_page.dart`, `coverage_table.dart`, `team_builder_page.dart`) and their existing tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Simplicity & YAGNI)**: All three fixes are scoped to
  existing widgets/constants (`kStandardTypeIconSize`, `CoverageTable`
  layout, one `onRemove` closure) — no new abstraction, service, or
  dependency is introduced. **PASS**.
- **Principle II (Test-First)**: Each fix is a regression; existing tests
  already assert the current (wrong) values/behavior and MUST be updated
  first to assert the corrected behavior (failing before the fix, passing
  after), plus a new regression test for the double-pop race, before the
  corresponding code change lands. **PASS** (planned in Phase 1 approach,
  enforced during `/speckit-tasks` + implementation).
- **Principle III (Clear Contracts)**: `kStandardTypeIconSize` remains the
  single shared contract for "a Pokémon's own type badge size", reused
  as-is by every consumer — no new/parallel constant is introduced. **PASS**.
- **Principle IV (Code Quality & Review)**: No change to this gate; normal
  review process applies. **PASS**.
- **Principle V (Observability & Versioning)**: No new service/library
  boundary crossed; no versioning impact beyond the app's own release notes. **N/A**.
- **Principle VI (Hexagonal/DDD, NON-NEGOTIABLE)**: All three fixes are
  confined to the presentation layer (widgets/pages) and its own Flutter
  framework code; no domain or application code is touched, and no
  infrastructure/framework import is introduced into `lib/domain` or
  `lib/application`. **PASS**.

No violations to record in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/016-team-config-fixes-3/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/team_builder/               # unchanged by this feature
├── application/team_builder/          # unchanged by this feature
├── infrastructure/team_builder/       # unchanged by this feature
└── presentation/team_builder/
    ├── pages/
    │   ├── team_builder_page.dart         # US3: fix onRemove double-pop
    │   └── coverage_analysis_page.dart    # US2: real-visibility fix
    └── widgets/
        ├── type_icon_resolution.dart      # US1: kStandardTypeIconSize
        ├── team_slot.dart                 # US1: consumer, verify fit
        ├── pokemon_customization_card.dart# US1: consumer, verify fit
        ├── pokedex_type_filter.dart       # US1: consumer, verify fit
        └── coverage_table.dart            # US2: table content/layout

test/presentation/team_builder/
├── type_icon_resolution_test.dart
├── pokedex_type_filter_test.dart
├── pokemon_customization_card_test.dart
├── widgets/team_slot_pokeball_and_types_test.dart
├── coverage_analysis_page_test.dart        # new/updated for US2
├── coverage_table_test.dart                # new/updated for US2
└── team_builder_page_remove_pokemon_test.dart  # new for US3

integration_test/
└── team_builder_flows_test.dart            # extend for US2/US3 end-to-end checks
```

**Structure Decision**: Single Flutter app, hexagonal layering already in
place (`lib/domain` → `lib/application` → `lib/infrastructure`/
`lib/presentation`). All three fixes stay entirely inside
`lib/presentation/team_builder/` (pages + widgets) and their mirrored
`test/`/`integration_test/` trees — no domain, application, or
infrastructure code is touched, consistent with Constitution Principle VI.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — this section is not applicable.
