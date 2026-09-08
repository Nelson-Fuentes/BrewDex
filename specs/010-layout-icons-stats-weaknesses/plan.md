# Implementation Plan: Layout Mitad y Mitad, Íconos de Tipo, Colores de Estadísticas y Tabla de Debilidades

**Branch**: `010-layout-icons-stats-weaknesses` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-layout-icons-stats-weaknesses/spec.md`

## Summary

Four independently-shippable presentation-layer changes to the already-shipped `team_builder` armador: (1) `TeamBuilderTwoPaneLayout`'s slots column stops being a bounded-fraction width (`007`'s `280–420px, 30% of available width` design) and becomes an exact 50/50 split with the Pokédex column; (2) the three places that render a `PokemonTypeIcon` (`TeamSlot`, `PokemonCustomizationCard`'s type row, `PokedexTypeFilter`'s `_TypeTile`) drop their text label and any surrounding padding, letting the icon fill its allotted box; (3) `PokemonCustomizationCard`'s stat bar chart (`009-stats-chart-full-pokedex`) colors each bar by a continuous low→high gradient instead of the theme's single fixed primary color; (4) a new Type Weakness table section is added to the customization card, computed from a new, purely static domain type-effectiveness chart (no network call — type matchups are franchise-constant data, not something any game/Pokémon-specific API call could vary).

None of the four touch `TeamBuilderCubit`/`TeamBuilderState` or any domain entity from prior features — (1)–(3) are layout/styling changes to existing widgets, and (4) adds one new, self-contained domain value (the type chart) plus one new presentation widget that consumes it and the already-existing `resolveSlotTypes` helper (`slot_sprite_resolution.dart`, unchanged) for "what are this Pokémon's active types right now."

## Technical Context

**Language/Version**: Dart (Flutter) — existing project, no new language/runtime.

**Primary Dependencies**: None new. The type-effectiveness chart is authored as plain Dart `const` data (Constitution Principle I: this is franchise-constant data, not something worth a network call or a new package for); the stat-bar color gradient uses `Color.lerp`/`HSVColor`, both in `dart:ui`/`package:flutter`, already available.

**Storage**: None affected.

**Testing**: `flutter test` — a new domain test for the type-effectiveness chart (`test/domain/team_builder/type_effectiveness_test.dart`) covering every single-type case and a representative sample of dual-type combinations (including an immunity overriding a weakness) against the official chart; widget tests for the 50/50 split (`team_builder_two_pane_layout_test.dart`), the no-label/no-padding icon rendering (`team_slot_pokeball_and_types_test.dart`, `pokemon_customization_card_test.dart`, a new/extended `pokedex_type_filter_test.dart` case), the stat-bar color-by-range behavior, and the new weakness-table widget.

**Target Platform**: Flutter multi-platform (Android + Web). User Story 1 (50/50 split) is scoped to the existing `ScreenSize.expanded` two-pane layout only, exactly like the width behavior it replaces; User Stories 2–4 apply to both layouts (the affected widgets are shared).

**Performance Goals**: No regression — every change here is either a static layout ratio, a static color computation from an already-resolved value, or a static lookup table computation; none adds a network call, an animation, or a rebuild trigger beyond what the existing reactive card (`008-configurador-equipo-correcciones`) already provides.

**Constraints**: The type-effectiveness chart must reflect the modern (Generation VI onward, 18-type, Fairy-included) matchup table — the only version relevant to any game this app's catalog can produce, since even a pre-Fairy-type game (e.g. Rojo Fuego/Verde Hoja) is still being played with modern-ruleset type matchups by this app's target audience, and no Pokémon in this app's catalog has Fairy as one of its own types unless it legitimately does in a modern re-release.

**Project Type**: Single Flutter app (`mobile-app` + `web`), existing Hexagonal/DDD layering — the type-effectiveness chart is the one new domain value object (framework-free, Constitution Principle VI); everything else stays presentation-only.

**Scale/Scope**: Same scale as prior `team_builder` features; the type chart is a fixed 18×18 relationship table (not a growing dataset).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity & YAGNI**: The 50/50 split removes `007`'s bounded-fraction width logic (`_minSlotsColumnWidth`/`_maxSlotsColumnWidth`/`_slotsColumnWidthFraction`) in favor of two plain `Expanded(flex: 1)` children — strictly simpler than what it replaces. The type-effectiveness chart is authored as a compact "only the non-neutral relationships" table (research.md Decision 4), not a naive 324-entry matrix, keeping the data itself reviewable. The stat-bar color function is a single pure function of one `int`, no configuration surface beyond what FR-006 asks for. **PASS**.
- **II. Test-First Development**: The type chart ships with a test asserting every one of the 18 single-type multiplier rows against the official chart before the weakness-table widget consumes it; the widget tests for (1)–(3) are updated/added alongside their implementation change. **PASS** (enforced at task-breakdown/implementation time).
- **III. Clear Contracts & Interfaces**: `PokedexTypeFilter`/`_TypeTile` loses its visible text label — an internal-app UI change with no external contract; `contracts/type_weakness_table.md` documents the new domain function's signature and combination rule since it's new, reusable domain logic other features may call again. **PASS**.
- **IV. Code Quality & Review**: No change.
- **V. Observability & Versioning**: No new failure surface — the type chart is `const` Dart data (cannot fail to load), and the color/layout changes have no failure mode of their own. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD**: The type-effectiveness chart and its combination function live in `lib/domain/team_builder/value_objects/` — plain Dart, no Flutter/HTTP import, consistent with `PokemonType`/`PokemonStats` alongside it. `PokemonTypeIcon` itself is unchanged (still framework-agnostic-enough presentation); only its call sites' surrounding layout changes. **PASS**.

No violations requiring `Complexity Tracking`.

**Post-Phase-1 re-check**: `data-model.md` and `contracts/type_weakness_table.md` confirm the design stayed within the above — one new framework-free domain value, three presentation-only layout/styling changes. **PASS, unchanged.**

## Project Structure

### Documentation (this feature)

```text
specs/010-layout-icons-stats-weaknesses/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── two_pane_half_split.md
│   ├── type_icon_no_label_no_padding.md
│   ├── stat_bar_color_scale.md
│   └── type_weakness_table.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   └── team_builder/
│       └── value_objects/
│           └── type_effectiveness_chart.dart      # NEW: static 18-type matchup data + combination function
└── presentation/
    └── team_builder/
        └── widgets/
            ├── team_builder_two_pane_layout.dart    # AMENDED: exact 50/50 Expanded split (US1)
            ├── team_slot.dart                        # AMENDED: larger, unpadded type icons (US2)
            ├── pokedex_type_filter.dart               # AMENDED: _TypeTile drops label text + padding, icon fills the tile (US2)
            └── pokemon_customization_card.dart        # AMENDED: type row drops Chip/label (US2); _StatBarRow colors by value (US3); new Type Weakness table section (US4)

test/  # mirrors the above 1:1 — test/domain/team_builder, test/presentation/team_builder
```

**Structure Decision**: Pure extension/simplification of the existing single-Flutter-app `team_builder` presentation layer, plus exactly one new framework-free domain value object. No new bounded context, no port/application-layer change.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
