# Implementation Plan: Correcciones y Mejoras del Selector de Juego y de la Pokédex del Armador de Equipo

**Branch**: `005-selector-pokedex-fixes` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-selector-pokedex-fixes/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

This feature is a batch of corrections and UX upgrades to two already-shipped
bounded contexts — `game_selection` (`001-select-game`) and `team_builder`
(`004-pokedex-team-builder`) — with **no new bounded context and no new
package dependency**. Verified against the live codebase and, where the
defect is data-shaped, against live PokeAPI responses during planning:

- **Confirmed root causes** (fix is a targeted, same-layer edit):
  - `GameCard` wraps its whole content (icon + name + generation label) in
    one `FittedBox(fit: BoxFit.scaleDown)`, so a long game name shrinks the
    *entire* card's type scale instead of just wrapping/truncating itself
    (`lib/presentation/game_selection/widgets/game_card.dart:118-138`).
  - `GenerationFilter` and `PokedexTypeFilter` are both a horizontally
    *scrolling* `ListView` of plain, uncolored `ChoiceChip`s with no
    collapse control (`lib/presentation/game_selection/widgets/generation_filter.dart`,
    `lib/presentation/team_builder/widgets/pokedex_type_filter.dart`).
  - Selecting a game only calls `GameSelectionCubit.selectGame`; navigation
    to the armador only happens from the separate "Continuar" `ElevatedButton`
    (`lib/presentation/game_selection/pages/game_selection_page.dart:246-254,266`).
  - PokeAPI already models `mega-dimension` (Legends Z-A's "Mega Dimension"
    DLC) as its own `version-group`, verified live, with no field linking it
    to `legends-za` — and `PokeApiGameCatalogRepository._dlcParentVersionGroup`
    (`lib/infrastructure/game_selection/pokeapi_game_catalog_repository.dart:19-24`)
    does not yet map it, so it surfaces as its own selectable `Game`.
  - `PokeApiPokedexRepository._resolveDexRefs` sends a single, unfiltered
    `GET /pokedex/national/` when `useNationalDex` is on
    (`lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart:97-103`)
    — every species PokeAPI's mirror knows about, not just the ones that
    exist as of the selected game's generation.
  - `TeamBuilderCubit._fetchAndApplyView` emits
    `status: TeamBuilderStatus.loading` on every National-Dex/DLC toggle
    (`lib/presentation/team_builder/cubit/team_builder_cubit.dart:135-150`),
    and `TeamBuilderPage`'s top-level `switch` on `state.status`
    (`lib/presentation/team_builder/pages/team_builder_page.dart:55-67`)
    swaps the *entire* body for a bare spinner — team slots and filters
    momentarily vanish.
  - DLC entries are merged into the same flat list as the base entries
    before being returned (`pokeapi_pokedex_repository.dart:44-62`), and
    `TeamBuilderPage` renders `state.visibleEntries` as one `SliverGrid`
    (`team_builder_page.dart:170-191`) — `PokedexEntry.sourceTag` already
    distinguishes DLC entries but nothing in presentation groups on it.
  - `PokeApiPokedexRepository._buildEntry` always takes the species-level
    `is_default` variety (`pokeapi_pokedex_repository.dart:152-157`).
    Verified live against PokeAPI: `pokemon-species/rattata`'s
    `is_default: true` variety is `rattata` (Kanto) even though the
    species also has a non-default `rattata-alola` variety — so Sun/Moon's
    Pokédex always shows the Kanto form, never Alola's.
  - `TeamSlot` renders `entry.spriteUrl` (`lib/presentation/team_builder/widgets/team_slot.dart:74-76`)
    — the same game-specific sprite as the Pokédex grid tile.
    `PokedexEntry` has no Pokémon HOME-style sprite field at all
    (`lib/domain/team_builder/entities/pokedex_entry.dart`), and PokeAPI
    exposes one at `pokemon.sprites.other.home.front_default` (verified
    live), currently never read by `PokeApiPokedexRepository`.
- **Investigated but not reproduced statically** (US1's "números como
  palabras"): no code path in the repository formats `PokedexEntry
  .pokedexNumber` (an `int`) as a spelled-out word, and spot-checking
  several regional/national PokeAPI `pokedex` resources during planning
  returned only integer `entry_number` values. research.md documents the
  diagnostic protocol and the regression-test net (task list carries this
  forward as an investigate-and-fix task backed by a full-dex fixture
  test, per Constitution Principle II).

Technical approach: every fix lands as a same-layer edit inside the
existing `game_selection` and `team_builder` bounded contexts (presentation
widgets/Cubits/state, or the two existing PokeAPI adapters), following the
same hexagonal shape `001-select-game`/`004-pokedex-team-builder` already
established. `PokedexEntry` gains one new field (`homeSpriteUrl`); no other
domain entity/port signature changes shape. One small, local, non-domain
data asset is added: a bundled 18-icon Pokémon-type icon set (Pokémon type
data carries no icon field of any kind in PokeAPI), confined to the
presentation layer per Constitution Principle VI.

## Technical Context

**Language/Version**: Dart 3.x, bundled with the latest stable Flutter SDK (unchanged from `001`/`002`/`003`/`004`)

**Primary Dependencies**: Flutter SDK (presentation-only changes to
existing widgets/Cubits); `http` (existing `PokeApiGameCatalogRepository`/
`PokeApiPokedexRepository`, edited, no new client code); `equatable`
(existing `PokedexEntry`, gains one field); `flutter_bloc` (existing
`GameSelectionCubit`/`TeamBuilderCubit`, edited) — **no new package
dependency is introduced by this feature**. One new local asset bundle
(18 SVG or PNG Pokémon-type icons, sourced/drawn as project assets, not a
new package) is added under `assets/` and declared in `pubspec.yaml`.

**Storage**: Unchanged — local key-value storage only (`shared_preferences`
via the existing `LocalSelectedGameStore`/`LocalTeamRosterStore`); no
schema/shape change to what is persisted (roster ids and selected game id
are untouched by this feature)

**Testing**: `flutter_test` (widget tests for `GameCard` truncation,
`GenerationFilter`/`PokedexTypeFilter` collapse+color+icon rendering,
`TeamSlot` HOME-sprite rendering, DLC-section grouping), `bloc_test`
(`GameSelectionCubit` direct-navigation intent, `TeamBuilderCubit`'s
national-dex/DLC toggle no longer emitting a full-screen loading status),
`mocktail` (fakes for `GameCatalogRepository`/`PokedexRepository` so the
regional-form-priority and national-dex-scope logic is covered without
network), a new fixture-driven `infrastructure` test iterating a full
regional dex (research.md's diagnostic net for the "numbers as words"
report), `integration_test` (regression pass over
`game_selection_flow_test.dart` now that tapping a game navigates
directly, and over `team_builder_flow_test.dart` now that toggling
National Dex/DLC no longer drops the team slots)

**Target Platform**: Android and Web from the existing single Flutter codebase (unchanged)

**Project Type**: Frontend-only mobile+web application — no backend service is introduced by this feature

**Performance Goals**: Toggling National Dex/DLC or collapsing a filter
section must feel instant (<100ms) since both are local state changes once
data is fetched; the National-Dex generation-based filter (FR-010) is
applied client-side over the already-fetched list, adding no extra network
round-trip; unchanged from `004`: a Pokédex fetch settles within ~2s on a
typical connection

**Constraints**: No backend/server component; every fix must stay inside
`game_selection`/`team_builder`'s existing hexagonal layering — no adapter
code may leak into `domain`/`application` (Constitution Principle VI); the
bundled type-icon asset set MUST be a single consistent set (PokeAPI has no
per-game/per-generation icon data to key a variant set on — FR-018's
"cuando la fuente de datos distinga" condition is not met, so one set
satisfies it); the regional-form and DLC-parent mappings are hardcoded,
reviewed adapter-local tables (matching the existing
`_dlcParentVersionGroup` pattern) that MUST be updated when PokeAPI adds a
new regional-form game or a new DLC — this is an accepted, documented
maintenance cost of Simplicity over building a generic form/DLC-inference
engine PokeAPI's data does not actually support (Principle I)

**Scale/Scope**: Zero new bounded contexts; ~9 existing files edited across
`game_selection`'s presentation layer, ~11 existing files edited across
`team_builder`'s domain/infrastructure/presentation layers, one new bundled
asset (type icons) and its `pubspec.yaml` declaration, one new small pure
function (generation ordinal, for the National Dex generation cutoff) added
next to the existing `isNationalDexEligible` helper

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Simplicity & YAGNI | No new package dependency, no new bounded context. National Dex scope is fixed with a simple generation-ordinal cutoff over already-fetched data rather than modeling per-cartridge encounter tables (research.md item 5) — the simpler option that still satisfies FR-010. Regional-form and DLC-parent resolution reuse the existing hardcoded-adapter-table pattern (`_dlcParentVersionGroup`) instead of inventing a generic inference engine PokeAPI's data cannot actually support. | PASS |
| II. Test-First Development | Every confirmed defect gets a failing-first regression test (widget test for `GameCard`/filters/`TeamSlot`, `bloc_test` for the two Cubits, a fixture-driven infrastructure test for regional-form selection, national-dex scoping, and the DLC-parent mapping). The one unreproduced report (números como palabras) gets a full-dex fixture sweep test specifically because a single fixture didn't catch it before (research.md item 8). | PASS |
| III. Clear Contracts & Interfaces | `PokedexRepository`'s contract is amended (not broken): `fetchPokedex`'s signature is unchanged; three of its documented rules are corrected (regional-form selection, national-dex scope, sprite resolution now includes `homeSpriteUrl`) via `contracts/pokedex_repository_amendment.md`. `GameCatalogRepository`'s contract gains one documented DLC-mapping entry via `contracts/game_catalog_repository_amendment.md`. No port's method signature changes in a way that breaks an existing caller. | PASS |
| IV. Code Quality & Review | Standard `flutter analyze`/lint gate and required review apply; every change is a same-layer, same-bounded-context edit, individually small and reviewable. | PASS |
| V. Observability & Versioning | The national-dex/DLC toggle's targeted-reload fix keeps the existing `PokedexUnavailable`-to-error-view path unchanged, now scoped correctly (see data-model.md `TeamBuilderState` amendment); no new failure type is introduced — this is a state-shape fix, not a new error surface. App version follows `pubspec.yaml` semantic versioning; this batch of fixes lands as a PATCH/MINOR bump per Governance's policy at merge time. | PASS |
| VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE) | All edits stay inside the layer they already lived in: `game_card.dart`/`generation_filter.dart`/`pokedex_type_filter.dart`/`team_slot.dart`/`game_selection_page.dart`/`team_builder_page.dart` are presentation; `pokeapi_game_catalog_repository.dart`/`pokeapi_pokedex_repository.dart` are infrastructure; `pokedex_entry.dart` (new field) and the new generation-ordinal helper are domain, framework-free. The bundled type-icon asset is referenced only from presentation widgets. No dependency direction changes. | PASS |

No violations — the Complexity Tracking table below is intentionally
empty. This feature corrects behavior inside contracts and layers that
`001-select-game`/`004-pokedex-team-builder` already established; it does
not introduce new architectural seams.

**Post-Design re-check** (after Phase 1): `data-model.md` and the amended
`contracts/` confirm `PokedexEntry.homeSpriteUrl` and the new
generation-ordinal helper stay framework-free domain additions; the
regional-form-suffix table and the extended `_dlcParentVersionGroup` entry
stay confined to `PokeApiGameCatalogRepository`/`PokeApiPokedexRepository`
(infrastructure); `TeamBuilderState`'s new `isRefreshingPokedex` flag and
the DLC-grouping view are presentation/application-facing state, not new
domain concepts. All rows above remain PASS; no new violations introduced
by the design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/005-selector-pokedex-fixes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── pokedex_repository_amendment.md
│   └── game_catalog_repository_amendment.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   ├── game_selection/                                   # UNCHANGED (no port/entity signature change)
│   │
│   └── team_builder/
│       ├── entities/
│       │   └── pokedex_entry.dart                         # AMENDED: + homeSpriteUrl field (US6)
│       └── value_objects/
│           └── pokedex_view.dart                          # AMENDED: + generationOrdinal() helper (US5, national-dex scope)
│
├── infrastructure/
│   ├── game_selection/
│   │   └── pokeapi_game_catalog_repository.dart            # AMENDED: _dlcParentVersionGroup += mega-dimension→legends-za (US2)
│   │
│   └── team_builder/
│       └── pokeapi_pokedex_repository.dart                 # AMENDED: national-dex generation cutoff (US5),
│                                                              #   regional-form-suffix variety selection (US1),
│                                                              #   homeSpriteUrl resolution (US6),
│                                                              #   diagnostic pass for entry_number shape (US1)
│
└── presentation/
    ├── game_selection/
    │   ├── cubit/game_selection_cubit.dart                  # AMENDED: selecting a game navigates directly (US2)
    │   ├── pages/game_selection_page.dart                    # AMENDED: remove "Continuar" button, tap→navigate (US2)
    │   └── widgets/
    │       ├── game_card.dart                                 # AMENDED: uniform font size, truncate instead of scale (US3)
    │       └── generation_filter.dart                          # AMENDED: fixed grid, per-generation color, collapse toggle (US4)
    │
    └── team_builder/
        ├── cubit/
        │   ├── team_builder_cubit.dart                         # AMENDED: view-toggle no longer emits full-screen loading (US5)
        │   └── team_builder_state.dart                          # AMENDED: + isRefreshingPokedex flag, + dlcGroupedEntries view (US5)
        ├── pages/team_builder_page.dart                          # AMENDED: scoped loading indicator, DLC entries as a separate section (US5)
        └── widgets/
            ├── pokedex_type_filter.dart                          # AMENDED: fixed grid, black/white + type icon, collapse toggle (US4)
            └── team_slot.dart                                    # AMENDED: render homeSpriteUrl instead of spriteUrl (US6)

assets/
└── pokemon_types/                                            # NEW: 18 bundled type icons (US4/FR-017), declared in pubspec.yaml

test/
├── domain/team_builder/
│   └── pokedex_view_test.dart                                 # NEW/AMENDED: generationOrdinal() coverage
├── infrastructure/
│   ├── game_selection/pokeapi_game_catalog_repository_test.dart  # AMENDED: mega-dimension classified as DLC of legends-za
│   └── team_builder/
│       ├── pokeapi_pokedex_repository_test.dart                 # AMENDED: regional-form priority, national-dex scope, homeSpriteUrl
│       └── pokeapi_pokedex_repository_full_dex_test.dart        # NEW: full-dex fixture sweep (US1 "numbers as words" net)
├── presentation/
│   ├── game_selection/
│   │   ├── widgets/game_card_test.dart                          # NEW/AMENDED: uniform font size across name lengths
│   │   ├── widgets/generation_filter_test.dart                  # AMENDED: fixed layout, color, collapse
│   │   └── cubit/game_selection_cubit_test.dart                 # AMENDED: selecting navigates without a separate confirm step
│   └── team_builder/
│       ├── widgets/pokedex_type_filter_test.dart                # AMENDED: black/white + icon, collapse
│       ├── widgets/team_slot_test.dart                          # AMENDED: renders homeSpriteUrl
│       └── cubit/team_builder_cubit_test.dart                   # AMENDED: toggle keeps status == loaded

integration_test/
├── game_selection_flow_test.dart                               # AMENDED: tap game → armador, no "Continuar" step
└── team_builder_flow_test.dart                                 # AMENDED: toggling National Dex/DLC keeps slots+filters visible
```

**Structure Decision**: Same single Flutter package as
`001`–`004`. No new bounded context, page, or route is added — every
change amends a file already owned by `game_selection` or `team_builder`,
following the four-layer shape those features established. The one new
non-Dart asset (bundled type icons) is presentation-only supporting data,
declared in `pubspec.yaml` next to the existing asset declarations.

## Complexity Tracking

*No entries — Constitution Check reported no violations to justify.*
