# Implementation Plan: Sistema de Diseño Material Web-First y Responsive

**Branch**: `002-material-design-ui` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-material-design-ui/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Establecer un sistema de diseño único basado en Material 3, aplicado
tanto como base compartida para pantallas futuras como al rediseño de la
pantalla ya existente de selección de juego (`001-select-game`), con web
como plataforma principal y una disposición mobile totalmente funcional
y equivalente en capacidades. Enfoque técnico: sin nuevas dependencias —
theming vía Material 3 nativo de Flutter (`BrewDexTheme`), una utilidad
de breakpoints propia y framework-free (`Breakpoints`/`ScreenSize`)
alineada a la guía adaptativa de Material 3 (compacto/mediano/expandido),
y un cascarón de navegación compartido (`AdaptiveScaffold`) construido
sobre esa utilidad, vividos como utilidades/widgets de presentación
compartidos (`lib/shared/design_system/`) en lugar de un nuevo bounded
context DDD, dado que no hay ninguna dependencia externa que abstraer
detrás de un puerto.

## Technical Context

**Language/Version**: Dart 3.x, bundled with the latest stable Flutter SDK (same as `001-select-game`)

**Primary Dependencies**: Flutter SDK Material 3 theming APIs only
(`useMaterial3`, `ColorScheme.fromSeed`, `ThemeData`) — no new package
dependency added by this feature; existing `flutter_bloc`, `http`,
`shared_preferences`, `equatable` are untouched by the design system
itself and continue to be used only inside `game_selection`

**Storage**: N/A — no new storage; existing `shared_preferences`-backed
selected-game persistence from `001-select-game` is unaffected; theme
variant is derived from system brightness each render, not persisted

**Testing**: `flutter_test` (pure unit tests for `Breakpoints.resolve`
and `BrewDexTheme`; widget tests asserting the correct `ScreenSize`
layout renders at a given width), `integration_test` (existing
`game_selection_flow_test.dart` re-run/extended at both a mobile and a
web viewport width)

**Target Platform**: Android and Web from the existing single Flutter codebase — web is the primary/optimized target per the spec, Android/mobile-width must remain fully functional

**Project Type**: Frontend-only mobile+web application (unchanged from `001-select-game`) — no backend service introduced

**Performance Goals**: Layout reflows on viewport/orientation change must feel instant (no dropped-frame jank) — implemented via reactive `MediaQuery`/`LayoutBuilder` reads rather than any polling or delayed recomposition

**Constraints**: Must not omit or degrade any functionality between the `compact` and `expanded` layout (FR-004); must avoid horizontal scrolling/clipped content at common mobile widths down to ~320px (FR-006); must cap content width on very wide desktop viewports (Edge Cases); no new external dependency introduced (Constitution Principle I)

**Scale/Scope**: One shared design-system foundation (theme + breakpoints + adaptive scaffold) plus the redesign of the one existing screen/bounded context (`game_selection`: 1 page + 4 widgets) that consumes it; future bounded contexts (e.g. team building) will consume the same foundation without needing to redefine it

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Simplicity & YAGNI | No new external dependency added — theming and breakpoints use only the Flutter SDK already declared (`uses-material-design: true`). Breakpoints are a small, purpose-built utility instead of adopting a general-purpose responsive package (see `research.md` Decisions 1–2). | PASS |
| II. Test-First Development | `Breakpoints.resolve` and `BrewDexTheme` are plain-Dart/deterministic and unit-testable before any widget exists; widget tests for `AdaptiveScaffold`/`ResponsiveLayout` and the redesigned `game_selection` screens are written against the contracts in `contracts/` before implementation. | PASS |
| III. Clear Contracts & Interfaces | Three explicit, documented public surfaces defined in `contracts/`: `BrewDexTheme`, `Breakpoints`/`ResponsiveLayout`, `AdaptiveScaffold` — each independently testable without pulling in the others or in `game_selection`. | PASS |
| IV. Code Quality & Review | Standard `flutter analyze`/lint gate and required review apply as project-wide workflow; no exception introduced by this feature. | PASS |
| V. Observability & Versioning | No new failure modes introduced (pure UI/config, no I/O); existing `game_selection` error handling (`GameCatalogFailure`) is unchanged. App version continues to follow `pubspec.yaml` semantic versioning. | PASS |
| VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE) | This feature introduces no external dependency (network, storage, third-party API) to isolate behind a port, so no new `domain`/`application`/ports layer is created for it — see `research.md` Decision 6 for the explicit justification. The one non-trivial piece of logic (`Breakpoints.resolve`) is still kept framework-free and independently unit-testable, in the same spirit as the domain layer, without forcing a port where nothing needs substituting. The `game_selection` bounded context's own `domain`/`application`/`infrastructure` layers are untouched by this feature — only its `presentation` adapter changes to consume the shared design system. | PASS (justified simplification, documented) |

No violations that require a workaround — the Complexity Tracking table
below records the one deliberate deviation from a full bounded context
(Principle VI) and why it is not a violation but a justified
simplification.

**Post-Design re-check** (after Phase 1): `data-model.md` and
`contracts/` confirm the design system stays confined to
`lib/shared/design_system/` (presentation-layer utilities and widgets,
plus the framework-free `Breakpoints.resolve`) and that `game_selection`'s
`domain`/`application`/`infrastructure` layers are untouched — only its
`presentation` files (`game_selection_page.dart` and its widgets) start
consuming `BrewDexTheme`/`AdaptiveScaffold`/`ResponsiveLayout`. All rows
above remain PASS; no new violations introduced by the design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/002-material-design-ui/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── brew_dex_theme.md
│   ├── responsive_layout.md
│   └── adaptive_scaffold.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── shared/
│   └── design_system/
│       ├── theme/
│       │   └── brew_dex_theme.dart        # BrewDexTheme.light / .dark (Material 3 ThemeData)
│       ├── layout/
│       │   ├── breakpoints.dart            # Breakpoints.resolve(width) -> ScreenSize (pure Dart)
│       │   └── responsive_layout.dart       # ResponsiveLayout widget (mobile/medium/web builders)
│       └── widgets/
│           └── adaptive_scaffold.dart       # AdaptiveScaffold — shared navigation/structure shell
│
├── presentation/
│   └── game_selection/                      # existing bounded context — presentation adapter updated only
│       ├── pages/
│       │   └── game_selection_page.dart      # uses AdaptiveScaffold + BrewDexTheme instead of ad hoc Scaffold/styles
│       └── widgets/
│           ├── game_card.dart                 # restyled to design-system tokens
│           ├── game_search_bar.dart            # restyled to design-system tokens
│           ├── generation_filter.dart          # restyled to design-system tokens
│           └── dlc_toggle_list.dart            # restyled to design-system tokens
│
├── domain/ …            # unchanged (game_selection domain layer, untouched by this feature)
├── application/ …       # unchanged (game_selection application layer, untouched by this feature)
├── infrastructure/ …    # unchanged (game_selection infrastructure layer, untouched by this feature)
└── main.dart             # updated: MaterialApp(theme: BrewDexTheme.light, darkTheme: BrewDexTheme.dark, themeMode: ThemeMode.system)

test/
├── shared/
│   └── design_system/
│       ├── layout/
│       │   └── breakpoints_test.dart         # unit tests: width thresholds (599/600/839/840) -> correct ScreenSize
│       └── theme/
│           └── brew_dex_theme_test.dart       # asserts light/dark share structure, differ only in brightness/colors
└── presentation/
    └── game_selection/                        # existing widget tests extended: assert compact vs. expanded rendering

integration_test/
└── game_selection_flow_test.dart               # existing end-to-end flow, extended to run at a mobile and a web viewport width
```

**Structure Decision**: Same single Flutter package (mobile + web, no
backend) as `001-select-game`. This feature adds one new top-level
`lib/shared/design_system/` folder for presentation-layer utilities and
widgets shared across bounded contexts, and otherwise only touches the
`presentation/` adapter of the existing `game_selection` bounded
context — its `domain`, `application`, and `infrastructure` layers are
untouched, preserving the hexagonal boundaries `001-select-game`
established. `shared/` is intentionally not a bounded context itself
(no domain/application/ports) per the Constitution Check justification
above; it is presentation-layer configuration reused across contexts,
the same way any Flutter app shares a single `ThemeData` across screens.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `lib/shared/design_system/` has no `domain`/`application`/ports layer, unlike a full Principle VI bounded context | The design system has no external dependency (network/storage/third-party API) to isolate — it is pure Flutter Material theming/layout configuration consumed directly by presentation code | Building a full hexagonal bounded context (ports for "theme provider"/"breakpoint provider" with swappable adapters) would add abstraction with no concrete substitutable implementation behind it — pure over-engineering per Principle I, with no current or foreseeable need for a second implementation |
