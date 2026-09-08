# Implementation Plan: Correcciones de Configurador de Equipo (Tipos, Tarjeta, Legends Z-A y Cobertura)

**Branch**: `014-team-configurator-fixes-2` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-team-configurator-fixes-2/spec.md`

## Summary

Nine follow-on corrections to the `team_builder` context, on top of `013-team-pokedex-ui-fixes`: (1)/(6) the team slot's type row constrains only the badge's *height* (`PokemonTypeIcon`'s `Image.network(height: size, fit: contain)` inside an unconstrained `Wrap`), so a non-square source icon can still render wider than intended and keep two types off one row on web, while the customization card wraps the same badge in a fixed `SizedBox(width: kStandardTypeIconSize, height: kStandardTypeIconSize)` that *additionally* squeezes its width — both call sites need a single widget that pins both dimensions identically, so slot and card can never re-diverge; (2)/(7) the card's sprite (currently 168×168) grows further and its `SizedBox`-boxed type badges are freed from the extra width squeeze; (3) the Mega/Dinamax/Shiny action row moves into the same fixed footer `Column` split `013` already gave "Quitar del equipo"; (4) `PokeApiMovepoolRepository.fetchMovepool`/`fetchDefaultMoveset` only accept a move whose `version_group_details` names `game.id` exactly — Legends Z-A (`mega-dimension`/`legends-za` on PokeAPI) is data-sparse enough upstream that some species (Feraligatr confirmed) have zero matching entries, yielding an empty movepool; (5) `kMegaEvolutionEnabledGameIds` already lists `legends-za`, but `PokeApiPokedexRepository` only resolves a `megaForm` from the `mega-dimension` version-group's Pokédex, which `_dlcParentVersionGroup` models as an opt-in DLC gated by `TeamBuilderView.activeDlcIds` — so Mega stays unavailable until that toggle is on, and nothing in the UI surfaces it as a toggle the way Sword/Shield's DLC is surfaced; (6, data-loss bug) `TeamBuilderCubit.fetchMovepoolForActiveSlot` fetches the movepool for `resolveSlotVarietyId(entry, rosterEntry)`, which returns the **Mega/Gigamax variety's own id** once that state is active — PokeAPI's Mega/Gigamax `pokemon` resources carry no (or a near-empty) independent `moves` list of their own (the learnset lives on the base variety), so `cleanedMoveIds` strips every previously-chosen move as "no longer learnable"; the fetch must resolve moves for the *base* variety regardless of Mega/Gigamax state; (7) `PokeApiPokedexRepository` reads only `pokemon.types` (today's canonical types) with no per-generation override, so Fairy-type Pokémon in Generation V-or-earlier games show Fairy though it didn't exist yet — PokeAPI's `pokemon.past_types` (keyed by the generation the change took effect) is the fix; (8) `CoverageAnalysisPage`'s body is `CoverageTable` alone with no vertical scroll container inside `AdaptiveScaffold`'s plain `Scaffold.body`, so an 18-row `DataTable` taller than the viewport renders past the bottom of the screen instead of scrolling into view; (9) `CoverageTable` is currently parameter-free (only the type-name column exists) — it gains a `pokemonTypes` input and a defense-efficacy column computed from the existing `typeEffectivenessAgainst`-style data in `type_effectiveness_chart.dart`, and `CoverageAnalysisPage`'s navigation gains a way to receive the currently-open card's resolved types.

## Technical Context

**Language/Version**: Dart 3.8.1, Flutter stable — unchanged.

**Primary Dependencies**: `flutter_bloc`, `equatable`, `http` — unchanged, no new dependency.

**Storage**: `RosterEntry` persistence (`TeamRosterStore`) unchanged in shape. `moveIds` values themselves don't change shape; User Story 1 only changes which variety id the movepool fetch that later re-validates `moveIds` targets.

**Testing**: `flutter_test`, `bloc_test` — unchanged.

**Target Platform**: Flutter multi-platform. User Story 6 (type badge sizing) explicitly covers the web/desktop team-slot layout; User Stories 3–5 (Legends Z-A) and 2 (coverage table visibility) are platform-agnostic logic/layout fixes verified on both web and mobile per quickstart.md.

**Project Type**: Single Flutter application, Hexagonal/DDD layered — unchanged structure. No new bounded context.

**Performance Goals**: No new network call shapes. User Story 3 (Feraligatr movepool) adds a fallback path that may issue one additional `pokemon/{varietyId}/` re-read against a different game's version-group data only when the primary game's filter yields zero moves — bounded, not per-keystroke.

**Constraints**: PokeAPI remains the sole external data source; domain/application layers stay framework-free (Principle VI). User Story 5's Mega availability fix must not regress the existing Sword/Shield-style "opt-in DLC" model for `the-isle-of-armor`/`the-crown-tundra`/`the-teal-mask`/`the-indigo-disk` — only Legends Z-A's `mega-dimension` entry changes behavior (research.md Decision 4).

**Scale/Scope**: Extends the existing `team_builder` context only. User Story 1 (moves survive Mega/Dinamax) is a one-line fix in `TeamBuilderCubit.fetchMovepoolForActiveSlot` plus a new cubit regression test. User Story 2 (coverage table visibility) is a layout fix confined to `CoverageAnalysisPage`. User Stories 3/4 touch only the two infrastructure adapters already responsible for movepool and Pokédex/form data. User Story 5 touches `PokeApiPokedexRepository`'s existing generation-aware type resolution path, adding `past_types`. User Stories 6–8 are presentation-layer sizing/layout changes confined to `team_slot.dart`, `pokemon_customization_card.dart`, and `coverage_table.dart`/`coverage_analysis_page.dart`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

- **I. Simplicity & YAGNI**: The type-badge fix promotes one existing widget (`PokemonTypeIcon`) to also pin `width`, instead of introducing a new sizing/theming abstraction (research.md Decision 1). The Legends Z-A movepool fallback reuses the existing `PokeApiMovepoolRepository` request shape against one clearly-scoped fallback game, not a general multi-game merge engine (research.md Decision 2). The Mega-availability fix reuses the existing DLC-gating mechanism (`_dlcParentVersionGroup`/`activeDlcIds`) by changing one game's default instead of adding a parallel "core mechanic vs. DLC" concept (research.md Decision 4). The coverage table's new column reuses the existing `type_effectiveness_chart.dart` data instead of adding a second type-effectiveness source (research.md Decision 7). **PASS**.
- **II. Test-First Development**: Each user story below is a bug fix or additive behavior with its own regression test written first — the movepool/Mega/moves-cleared/past-types stories are business-logic bugs and each ships with a failing-first repository/cubit test before the fix (Constitution's explicit bug-fix regression-test rule). **PASS** (enforced at `/speckit-tasks`/`/speckit-implement`).
- **III. Clear Contracts & Interfaces**: `PokemonTypeIcon` gains a documented, backward-compatible sizing contract (both dimensions, not just height) instead of two call sites privately reinterpreting `size` differently (contracts/standard_type_badge_dimensions.md). `CoverageTable` gains one new, explicit, nullable `pokemonTypes` parameter rather than reading global/ambient state (contracts/coverage_defense_column.md). **PASS**.
- **IV. Code Quality & Review**: No dead code is introduced; the DLC-gating special-case for Legends Z-A's Mega is documented in `form_availability.dart`/`pokeapi_game_catalog_repository.dart` (or their successors) so it isn't mistaken for a generic rule later (research.md Decision 4). **PASS**.
- **V. Observability & Versioning**: The Legends Z-A movepool fallback logs (via the existing `developer.log` pattern already used in `PokeApiMovepoolRepository`) when it falls back, so an empty-vs-fallback movepool stays diagnosable without a debugger. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)**: All nine fixes stay within their existing layer — `TeamBuilderCubit` (presentation) picks a different, still domain-typed variety id; `PokeApiMovepoolRepository`/`PokeApiPokedexRepository` (infrastructure) are the only places that know about `version_group_details`/`past_types`/DLC version-groups; `CoverageTable`/`pokemon_customization_card.dart`/`team_slot.dart` (presentation) consume only already-exposed domain value objects (`PokemonType`, the existing type-effectiveness chart). No new port is required; no dependency points outward. **PASS**.

No violations requiring the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
specs/014-team-configurator-fixes-2/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── standard_type_badge_dimensions.md
│   ├── legends_za_movepool_fallback.md
│   ├── legends_za_mega_availability.md
│   ├── preserve_moves_on_mega_dynamax.md
│   ├── pre_fairy_type_generations.md
│   ├── coverage_analysis_page_scroll.md
│   ├── coverage_defense_column.md
│   └── sticky_form_action_row.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Single Flutter project, Hexagonal/DDD layering — unchanged top-level structure:

```text
lib/
├── domain/team_builder/value_objects/
│   └── form_availability.dart                   # AMENDED: doc/comment update only — no set membership
│                                                  #   change (legends-za is already listed); the actual
│                                                  #   fix lives in the infrastructure DLC-gating below
├── infrastructure/
│   ├── game_selection/pokeapi_game_catalog_repository.dart  # AMENDED: `mega-dimension` no longer
│   │                                              #   requires an opt-in toggle for Legends Z-A — its
│   │                                              #   Pokédex is folded into the base game fetch (or its
│   │                                              #   DLC defaults to always-active); documented as the
│   │                                              #   one intentional exception to the DLC-toggle model
│   └── team_builder/
│       ├── pokeapi_movepool_repository.dart       # AMENDED: when the primary game's version-group
│       │                                          #   filter yields zero moves, falls back to the closest
│       │                                          #   available game's move data for that species,
│       │                                          #   logged via `developer.log`
│       └── pokeapi_pokedex_repository.dart        # AMENDED: reads `pokemon.past_types`; when the active
│                                                   #   game's generation predates the generation a type
│                                                   #   entry in `past_types` names, that entry's types are
│                                                   #   used instead of `pokemon.types`
├── presentation/team_builder/
│   ├── widgets/
│   │   ├── type_icon_resolution.dart              # AMENDED: `PokemonTypeIcon` pins both width and height
│   │   │                                          #   (previously height-only), so a non-square source
│   │   │                                          #   icon can't silently widen past `kStandardTypeIconSize`
│   │   ├── team_slot.dart                         # AMENDED: type row now reliably fits two badges on web
│   │   │                                          #   (no other change — already uses the shared constant)
│   │   ├── pokemon_customization_card.dart        # AMENDED: type row drops its extra width-squeezing
│   │   │                                          #   SizedBox (now redundant), sprite grows further,
│   │   │                                          #   Mega/Dinamax/Shiny row moves into the fixed footer
│   │   │                                          #   alongside "Quitar del equipo"
│   │   └── coverage_table.dart                    # AMENDED: + `pokemonTypes` param, + defense-efficacy
│   │                                               #   `DataColumn` computed via `type_effectiveness_chart.dart`
│   ├── pages/
│   │   └── coverage_analysis_page.dart            # AMENDED: body wrapped in a vertical `SingleChildScrollView`
│   │                                               #   (fixes invisibility on shorter viewports); accepts the
│   │                                               #   current card's resolved `pokemonTypes`
│   └── cubit/
│       └── team_builder_cubit.dart                # AMENDED: `fetchMovepoolForActiveSlot` resolves the
│                                                    #   movepool variety id from the *base* form, never the
│                                                    #   active Mega/Gigamax variety
└── l10n/*.arb                                      # AMENDED (all locales, if new strings are needed for
                                                     #   the defense-efficacy column header)

test/
├── infrastructure/team_builder/
│   ├── pokeapi_movepool_repository_test.dart       # AMENDED: Legends Z-A fallback returns non-empty moves
│   └── pokeapi_pokedex_repository_test.dart        # AMENDED: past_types honored for Gen V-or-earlier games
├── infrastructure/game_selection/
│   └── pokeapi_game_catalog_repository_test.dart   # AMENDED: Legends Z-A's Mega Pokédex resolves without
│                                                    #   requiring an explicit DLC toggle
├── presentation/team_builder/
│   ├── cubit/
│   │   └── team_builder_cubit_test.dart            # AMENDED: moveIds survive a Mega/Dinamax toggle
│   ├── widgets/
│   │   ├── team_slot_row_test.dart                 # AMENDED: two types fit one row at web width
│   │   ├── pokemon_customization_card_test.dart    # AMENDED: type size matches slot, larger sprite,
│   │   │                                            #   Mega/Dinamax/Shiny row stays visible while scrolled
│   │   └── coverage_table_test.dart                # AMENDED: defense-efficacy column values
│   └── pages/
│       └── coverage_analysis_page_test.dart        # AMENDED: table visible/scrollable on a short viewport
```

**Structure Decision**: Extends the existing single-project Hexagonal/DDD layout — no new project, no new bounded context, no new port. Every fix lands in the same `team_builder`/`game_selection` files `011`–`013` already own.

## Complexity Tracking

*No violations — table omitted per template instructions.*
