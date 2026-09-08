# Implementation Plan: Segunda Ronda de Correcciones del Selector de Juego, la Pokédex y el Armador de Equipo

**Branch**: `006-selector-pokedex-fixes-2` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-selector-pokedex-fixes-2/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

This feature is a second batch of corrections and new capabilities on top
of the same two already-shipped bounded contexts `005-selector-pokedex-fixes`
touched — `game_selection` (`001-select-game`) and `team_builder`
(`004-pokedex-team-builder`) — plus one small, explicitly-flagged
cross-context widening (a roster slot gains customization data, item 5
below). **No new bounded context, no new package dependency.** Every
finding below was verified against the live codebase (post-`005`) and
live PokeAPI / PokeAPI-sprites responses during planning — full detail
and evidence in `research.md`.

**Confirmed pre-existing bugs** (targeted fixes, each backed by a
reproduced failure, not a guess):

1. **Historia 1 (Blanco/Negro, Blanco 2/Negro 2 blocked)**:
   `PokedexEntry`'s constructor asserts `pokedexNumber > 0`, but Victini
   is genuinely Unova Dex `#000` in both games' real regional Pokédex —
   reproduced live with `--enable-asserts` (Flutter's own debug-mode
   default) against the real PokeAPI data: the assertion throws,
   `fetchPokedex` converts it to `PokedexUnavailable`, and the armador
   shows its permanent error view for both games. The same call also
   fires, unhandled, from `PokedexRosterValidityChecker` during a
   game-switch reconciliation.
2. **Historia 2 (slot stays reserved after a game switch)**:
   `GameSelectionCubit.confirmGameSwitch()` computes a reconciled roster
   but only keeps it in its own in-memory state — it is never written to
   `TeamRosterStore`. `TeamBuilderCubit.load()`, opened fresh for the new
   game, reads the **stale** roster straight from storage, so an
   invalid slot resolves to a blank entry but still counts against
   `rosterPokemonIds.length` — "reserved but empty".
3. **Historia 3 (X/Y duplicate/misordered numbers)**: PokeAPI's `x-y`
   version-group resolves to **three** independently-1-N-numbered
   pokedex resources (`kalos-central`/`coastal`/`mountain`, live-verified
   — Central alone is entries 1–150); today's merge keeps each species'
   own local number verbatim, so the final list has three different
   species at "#1", "#2", etc.
4. **Historia 4 (Oro/Plata, Rojo/Verde, Azul sprites)**: sprite
   resolution indexes `sprites.versions[generation][game.id]` assuming
   the version-**group** id always equals the version-**bucket** key.
   Live-verified against `pokemon/1`: it does for most games, but Gen II
   splits into separate `gold`/`silver`/`crystal` buckets (no combined
   `gold-silver`), and Japan's original Red/Green and standalone Blue
   releases have no dedicated bucket at all — all three silently fall
   back to the modern default-artwork sprite today.
5. **Historia 6 (BDSP National Dex)**: `isNationalDexEligible` gates
   purely on generation id, and `generation-viii` isn't in the eligible
   set at all — live-verified `brilliant-diamond-shining-pearl` is an
   otherwise-ordinary Gen-VIII version-group, so it needs a game-id
   exception, not a generation-wide change (which would wrongly affect
   Sword/Shield/Legends Arceus too).
6. **Historia 7 (game name header)**: `TeamBuilderPage` already receives
   `Game game` but hardcodes a generic screen title instead of using
   `game.displayName`.
7. **Historia 8 (collapsible defaults/auto-collapse)**:
   `CollapsibleFilterSection.initiallyExpanded` defaults to `true`
   (needs `false`); there is no mechanism at all today for a selection
   to collapse its own section. The multi-column-web/one-column-mobile
   requirement is already effectively satisfied by the existing `Wrap`
   layout — confirmed by inspection, to be locked in with a widget test
   rather than rewritten.

**Confirmed-correct-already** (no code change, regression tests only):
Historia 5's DLC grid separation and FR-011/FR-012 canonical-order/
no-duplication rules are already implemented correctly by `005` — traced
live through `_resolveDexRefs`'s ref ordering (itself already following
PokeAPI's own, verified-monotonic DLC listing order) and
`TeamBuilderPage`'s per-DLC-id sectioned rendering. Only FR-028/FR-029
(a DLC unlocking a *form* of an already-listed species) is new work.

**New capabilities**, all resolved from PokeAPI fields already fetched
or one field-classification request away — **no hardcoded per-species
tables**, matching this codebase's existing adapter-table pattern only
where the underlying set is genuinely small and finite (games, not
species):

- **Historia 9 (type icons per game/generation)**: fetched at runtime
  from `github.com/PokeAPI/sprites`' `sprites/types/{generation}/
  {game}/{numericTypeId}.png`, the same `Image.network` pattern already
  used for every Pokémon sprite — no bundled asset pipeline.
- **Historia 10 (form/gender/cosmetic-variant selection)**: template
  forms, Mega Evolution, and Gigamax/Dinamax are classified from the
  `pokemon-form` resource's `is_mega`/`form_name` fields (live-verified
  on Charizard's varieties) — not a hardcoded species list. Gender
  default/effect comes from `pokemon-species.gender_rate`/
  `has_gender_differences` (live-verified on Pikachu). Cosmetic variants
  come from a variety's `pokemon.forms` list — live-verified this
  genuinely covers Vivillon (20 patterns) but **not** Spinda (PokeAPI
  has no enumerable spot-pattern data at all; the spec's Spinda example
  simply never triggers the picker, which is correct given the data
  source).
- **Historia 11 (Mega/Gigamax buttons)**: excluded from the form modal
  per the Clarifications' revised decision, surfaced as dedicated,
  conditionally-shown buttons in a new Personalización card; Eternatus's
  story-exclusive Eternamax form is explicitly excluded (it isn't a
  regular Gigamax, confirmed via its `pokemon-form` fields).
- **Historia 12 (shiny in the slot)**: shiny/shiny-female HOME sprite
  fields already live on the same `pokemon` body every other sprite
  field is resolved from — no new HTTP call.

**One explicitly-flagged cross-context change**: a roster slot widens
from a bare species-id `String` to a `RosterEntry` value object (form/
gender/variant/Mega-Gigamax/shiny), confined to `team_builder`'s domain;
`game_selection`'s `TeamBuildingSession.rosterPokemonIds` stays
`List<String>` unchanged — the projection between the two happens only
at the one seam they already share (`GameSelectionCubit.refreshRoster`).
Full justification: data-model.md's "New/Amended (cross-context)"
section.

## Technical Context

**Language/Version**: Dart 3.x, bundled with the latest stable Flutter SDK (unchanged from `001`–`005`)

**Primary Dependencies**: Flutter SDK (presentation widgets/Cubits,
edited and new); `http` (existing `PokeApiPokedexRepository`/
`PokeApiGameCatalogRepository` adapters, edited; also backs the new
runtime-fetched type-icon images via `Image.network`, no new client
code); `equatable` (existing entities/value objects, edited; several new
value objects); `flutter_bloc` (existing `TeamBuilderCubit`/
`GameSelectionCubit`, edited) — **no new package dependency is
introduced by this feature**, including for type icons (fetched as plain
network images from `raw.githubusercontent.com`, exactly like every
Pokémon sprite already is).

**Storage**: `shared_preferences`, unchanged mechanism, **one schema
change**: `TeamRosterStore`'s persisted JSON shape widens from a bare
array of species-id strings to an array of small `RosterEntry` objects
(`contracts/team_roster_store_amendment.md`) — a pre-upgrade roster
fails to parse under the new shape and is treated as empty, reusing the
store's existing corrupt-data fallback (no new migration code path).
`SelectedGameStore` (game_selection) is untouched.

**Testing**: `flutter_test` (widget tests: `TeamSlot`'s new
tap-opens-card gesture, the new `PokemonCustomizationCard`'s conditional
sections, `CollapsibleFilterSection`'s new default/auto-collapse/
responsive-layout behavior, `type_icon_resolution`'s fallback chain),
`bloc_test` (`TeamBuilderCubit.load()`'s new stale-roster reconciliation,
`updateRosterEntry`, `GameSelectionCubit`'s switch-into-Black/White path
no longer throwing unhandled), `mocktail` (fakes for
`PokedexRepository`/`TeamRosterStore` covering every new field/shape
without network), an extended fixture-driven `infrastructure` test sweep
(X/Y's 3-pokedex renumbering, the classic-game sprite-bucket table,
BDSP's national-dex exception, Charizard/Eternatus-shaped
Mega/Gigamax/gender/cosmetic-variant fixtures — `contracts/
pokedex_repository_amendment.md`), `integration_test` (regression pass
confirming Black/White and Black 2/White 2 now reach the armador
end-to-end, and a slot genuinely frees up after a game switch)

**Target Platform**: Android and Web from the existing single Flutter codebase (unchanged)

**Project Type**: Frontend-only mobile+web application — no backend service is introduced by this feature

**Performance Goals**: Unchanged from `004`/`005` for the base Pokédex
fetch (~2s typical). The new per-entry `pokemon-form` classification
calls (Historia 10/11) are bounded — only species with more than one
variety trigger any extra request, and only once per variety (cached the
same way `_fetchType`/`_fetchGeneration` already dedupe per-session);
type-icon images resolve to a static, small (7 generations × few
buckets) local lookup table (no live GitHub API traffic at runtime,
`contracts/type_icon_resolution.md`) before ever hitting the network for
the image itself. Collapsing/expanding a filter section and opening the
customization card are local state changes — must feel instant (<100ms),
unchanged bar from `005`.

**Constraints**: No backend/server component. Every fix/addition stays
inside `game_selection`/`team_builder`'s existing hexagonal layering —
no adapter code leaks into `domain`/`application` (Constitution
Principle VI); the one cross-context change (`RosterEntry`) is confined
to `team_builder`'s domain, with `game_selection` untouched, per
data-model.md. The sprite-version-key table, the X/Y multi-pokedex
renumbering rule, and the BDSP national-dex exception are small, reviewed,
adapter-local, hardcoded tables/rules (matching the existing
`_dlcParentVersionGroup`/`_regionalFormSuffixByGameId` pattern) — an
accepted, documented maintenance cost of Simplicity over a generic
inference engine PokeAPI's data does not support (Principle I). Form/
Mega/Gigamax/cosmetic-variant classification is deliberately **not**
such a table — the per-species set is unbounded, so it is resolved
generically from `pokemon-form` fields instead (research.md items 10–12).

**Scale/Scope**: Zero new bounded contexts; ~6 existing files amended
across `team_builder`'s domain/infrastructure layers (`PokedexEntry`,
`PokemonType`, `PokedexView`, `PokeApiPokedexRepository`,
`TeamRosterStore`+`LocalTeamRosterStore`, `AddPokemonToTeam`/
`RemovePokemonFromTeam`), ~4 new domain value objects (`SelectableForm`,
`CosmeticVariant`, `Gender`, `RosterEntry`), ~6 existing presentation
files amended (`TeamBuilderState`/`Cubit`, `TeamBuilderPage`, `TeamSlot`,
`CollapsibleFilterSection`, `GenerationFilter`/`PokedexTypeFilter`'s
collapse wiring, `pokemon_type_icons.dart` → network resolution), ~3 new
presentation files (`PokemonCustomizationCard`, a form-selection modal
widget, `type_icon_resolution.dart`), 0 new `game_selection` files (its
domain/application/infrastructure are untouched — only its Cubit's
existing roster-projection seam is touched, per data-model.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Simplicity & YAGNI | No new package, no new bounded context. Every hardcoded table added (sprite-version-key, X/Y renumbering, BDSP exception) is small, adapter-local, and reuses the exact pattern two already-accepted tables (`_dlcParentVersionGroup`/`_regionalFormSuffixByGameId`) established in `001`/`005` — the alternative (a generic per-game inference engine) is explicitly rejected as over-engineering data that doesn't support it. Form/Mega/Gigamax/cosmetic-variant support is deliberately *not* a hardcoded table (an unbounded, per-species set), resolved generically from `pokemon-form` fields instead — the simpler, more maintainable option once verified those fields exist. Type icons reuse the existing runtime-network-image pattern rather than adding an asset pipeline. | PASS |
| II. Test-First Development | Every confirmed defect (items 1–7 in Summary) gets a failing-first regression test, each backed by a *live-reproduced* failure documented in research.md (not a hypothesis) — including the two Cubit-level bugs (Historia 1's unhandled `PokedexUnavailable` during a switch, Historia 2's stale-roster reconciliation gap). Every new capability (Historia 9–12) gets fixture-driven infrastructure tests plus widget/Cubit tests for its new UI surface (`PokemonCustomizationCard`, form modal, type-icon resolver). | PASS |
| III. Clear Contracts & Interfaces | `PokedexRepository.fetchPokedex`'s signature is unchanged; its contract is amended (not broken) — `contracts/pokedex_repository_amendment.md`, chained onto `004`'s original and `005`'s prior amendment. `TeamRosterStore`'s two methods are renamed (`readRoster`/`writeRoster`) because their payload shape genuinely changed (a roster is no longer just ids) — called out explicitly as the one breaking-name change in this feature, with every consumer's adjustment documented (`contracts/team_roster_store_amendment.md`). `PokedexView.isNationalDexEligible`'s parameter widens from `Generation` to `Game` — every existing call site already has a `Game` in scope, so no caller needs new state threaded in. | PASS |
| IV. Code Quality & Review | Standard `flutter analyze`/lint gate and required review apply; changes are grouped by bounded context/layer for reviewability, same as `005`. | PASS |
| V. Observability & Versioning | The `TeamRosterStore` schema widening is called out explicitly as a storage-format change (not silently absorbed) — Governance requires this to be visible; its fallback (treat unparseable legacy data as empty, reusing the store's existing corrupt-data path) is documented rather than a silent crash. No new failure type is introduced beyond what `PokedexUnavailable`/`TeamFullFailure` already cover. This batch lands as a MINOR bump (new capabilities) per `pubspec.yaml` semantic versioning at merge time. | PASS |
| VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE) | All edits stay inside the layer they already lived in: `pokedex_entry.dart`/`pokemon_type.dart`/`pokedex_view.dart`/`selectable_form.dart`/`cosmetic_variant.dart`/`gender.dart`/`roster_entry.dart`/`team_roster_store.dart` are domain, framework-free; `pokeapi_pokedex_repository.dart`/`local_team_roster_store.dart` are infrastructure; `team_builder_cubit.dart`/`team_builder_state.dart`/`team_builder_page.dart`/`team_slot.dart`/`pokemon_customization_card.dart`/`type_icon_resolution.dart`/`collapsible_filter_section.dart` are presentation. **The one deliberate cross-context touch** — `RosterEntry` living in `team_builder`'s domain while `game_selection`'s `TeamBuildingSession`/`RosterValidityChecker`/`SwitchGame` stay untouched, `List<String>`-based — is the explicitly-justified exception documented in data-model.md: `game_selection` never depends on a `team_builder` type; only `GameSelectionCubit` (already the seam between the two, per `001`) projects at the boundary. No dependency direction is inverted. | PASS |

No violations — the Complexity Tracking table below is intentionally
empty. The one architecturally-notable decision (`RosterEntry`'s
cross-context shape) is a widening of an existing, already-shared
concept (a roster slot) confined to the context that actually needs the
new data, not a new violation of the dependency rule — justified inline
above and in data-model.md rather than requiring a tracked exception.

**Post-Design re-check** (after Phase 1): `data-model.md` and
`contracts/` confirm every new/amended domain type
(`PokedexEntry`'s new fields, `PokemonType.numericId`,
`SelectableForm`/`CosmeticVariant`/`Gender`/`RosterEntry`) stays
framework-free plain data; the sprite-version-key table, X/Y-renumbering
rule, and BDSP exception stay confined to
`PokeApiPokedexRepository`/`PokedexView` (infrastructure/domain, no
adapter leakage); `PokemonCustomizationCard`/the form-selection modal/
`type_icon_resolution.dart` are presentation-only, consuming already-
resolved domain fields, never reaching into PokeAPI shapes directly. All
rows above remain PASS; no new violations introduced by the design
artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/006-selector-pokedex-fixes-2/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── pokedex_repository_amendment.md
│   ├── team_roster_store_amendment.md
│   ├── pokemon_customization_card.md
│   └── type_icon_resolution.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   ├── game_selection/                                     # UNCHANGED — no port/entity change; still List<String> rosters
│   │
│   └── team_builder/
│       ├── entities/
│       │   └── pokedex_entry.dart                            # AMENDED: pokedexNumber >=0 (H1); + homeSpriteShinyUrl,
│       │                                                        #   homeSpriteFemaleUrl, homeSpriteShinyFemaleUrl, genderRate,
│       │                                                        #   hasGenderDifferences, selectableForms, megaForm,
│       │                                                        #   gigamaxForm, cosmeticVariants (H9–H12)
│       ├── value_objects/
│       │   ├── pokemon_type.dart                              # AMENDED: + numericId (H9)
│       │   ├── pokedex_view.dart                              # AMENDED: isNationalDexEligible(Game) + BDSP exception (H6)
│       │   ├── selectable_form.dart                           # NEW (H10/H11)
│       │   ├── cosmetic_variant.dart                          # NEW (H10)
│       │   ├── gender.dart                                    # NEW (H10)
│       │   └── roster_entry.dart                              # NEW (H10–H12) — replaces bare pokemonId String in a roster
│       └── ports/
│           └── team_roster_store.dart                         # AMENDED: readRoster/writeRoster(List<RosterEntry>)
│
├── infrastructure/
│   ├── game_selection/                                       # UNCHANGED
│   │
│   └── team_builder/
│       ├── pokeapi_pokedex_repository.dart                    # AMENDED: assertion relax (H1), X/Y renumbering (H3),
│       │                                                        #   _spriteVersionKeyByGameId table (H4), DLC-form
│       │                                                        #   aggregation (H5/FR-028-029), new PokedexEntry field
│       │                                                        #   resolution (H9–H12)
│       ├── local_team_roster_store.dart                       # AMENDED: RosterEntry JSON shape + legacy-fallback (H10–H12)
│       └── pokedex_roster_validity_checker.dart                # UNCHANGED code — behavior fix is free via item 1/repository
│
├── application/
│   └── team_builder/use_cases/
│       ├── add_pokemon_to_team.dart                            # AMENDED: List<RosterEntry>, accepts initial RosterEntry
│       └── remove_pokemon_from_team.dart                       # AMENDED: List<RosterEntry> (index-based removal unchanged)
│
└── presentation/
    ├── game_selection/
    │   ├── widgets/generation_filter.dart                       # AMENDED: collapse-on-select wiring (H8)
    │   └── cubit/game_selection_cubit.dart                      # AMENDED: refreshRoster projects RosterEntry→ids (data-model.md)
    │
    └── team_builder/
        ├── cubit/
        │   ├── team_builder_state.dart                          # AMENDED: roster: List<RosterEntry> (+ rosterPokemonIds
        │   │                                                       #   derived getter); TeamSlotView.rosterEntry (H2, H10–H12)
        │   └── team_builder_cubit.dart                           # AMENDED: load() reconciles+persists stale roster (H2);
        │                                                            #   updateRosterEntry (H10–H12); isNationalDexEligible(game) (H6)
        ├── pages/team_builder_page.dart                          # AMENDED: title = game.displayName (H7); opens
        │                                                            #   PokemonCustomizationCard from a slot tap
        └── widgets/
            ├── team_slot.dart                                    # AMENDED: tap opens customization card, not immediate remove
            ├── pokemon_customization_card.dart                   # NEW (H9–H12) — contracts/pokemon_customization_card.md
            ├── form_selection_modal.dart                         # NEW (H10) — game-sprite form picker (FR-020/FR-021)
            ├── pokedex_type_filter.dart                          # AMENDED: uses type_icon_resolution.dart; collapse-on-select
            ├── type_icon_resolution.dart                         # NEW (H9) — contracts/type_icon_resolution.md
            └── pokemon_type_icons.dart                           # AMENDED: kept only as the final Material-icon fallback

shared/design_system/widgets/collapsible_filter_section.dart          # AMENDED: initiallyExpanded default false (H8);
                                                                          #   new collapseSignal param for auto-collapse

test/
├── domain/team_builder/
│   ├── value_objects/
│   │   ├── selectable_form_test.dart                            # NEW
│   │   ├── cosmetic_variant_test.dart                            # NEW
│   │   └── roster_entry_test.dart                                # NEW
│   └── pokedex_view_test.dart                                    # AMENDED: isNationalDexEligible(Game) incl. BDSP exception
├── infrastructure/team_builder/
│   ├── pokeapi_pokedex_repository_test.dart                       # AMENDED: H1, H3, H4, H5(028/029), H9–H12 cases
│   ├── pokeapi_pokedex_repository_full_dex_test.dart              # AMENDED: + Black/White, Black 2/White 2 fixtures (H1)
│   ├── type_icon_resolution_test.dart                             # NEW (H9)
│   └── local_team_roster_store_test.dart                          # AMENDED: RosterEntry round-trip + legacy fallback
├── application/team_builder/use_cases/
│   ├── add_pokemon_to_team_test.dart                              # AMENDED
│   └── remove_pokemon_from_team_test.dart                         # AMENDED
├── presentation/
│   ├── game_selection/
│   │   ├── widgets/generation_filter_test.dart                   # AMENDED: collapse-on-select
│   │   └── cubit/game_selection_cubit_test.dart                  # AMENDED: switch-into-Black/White no longer throws unhandled
│   └── team_builder/
│       ├── cubit/team_builder_cubit_test.dart                     # AMENDED: H2 reconciliation, updateRosterEntry, H6
│       ├── widgets/team_slot_test.dart                            # AMENDED: tap opens card
│       ├── widgets/pokemon_customization_card_test.dart          # NEW
│       ├── widgets/pokedex_type_filter_test.dart                  # AMENDED: icon resolution wiring, collapse-on-select
│       └── widgets/collapsible_filter_section_test.dart           # AMENDED/NEW: default collapsed, auto-collapse, responsive

integration_test/
├── game_selection_flow_test.dart                                  # AMENDED: switching into Black/White completes
└── team_builder_flow_test.dart                                    # AMENDED: Black/White reaches armador; a slot frees up
                                                                       #   after a game switch that invalidates its occupant
```

**Structure Decision**: Same single Flutter package as `001`–`005`. No
new bounded context, page, or route is added — almost every change
amends a file already owned by `game_selection` or `team_builder`, plus
a small number of genuinely new files within `team_builder` (four domain
value objects, three presentation widgets) for capabilities that didn't
exist before (Historia 9–12). `game_selection`'s domain/infrastructure
layers are entirely untouched; only its Cubit gains one small projection
at the seam it already shares with `team_builder` (data-model.md).

## Complexity Tracking

*No entries — Constitution Check reported no violations to justify. The
one architecturally-notable decision (`RosterEntry`'s scope) is
justified inline in the Constitution Check table and in data-model.md,
not tracked here as an exception.*
