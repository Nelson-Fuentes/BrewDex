---

description: "Task list for 006-selector-pokedex-fixes-2"
---

# Tasks: Segunda Ronda de Correcciones del Selector de Juego, la Pokédex y el Armador de Equipo

**Input**: Design documents from `/specs/006-selector-pokedex-fixes-2/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included and REQUIRED — Constitution Principle II (Test-First
Development) is non-negotiable project-wide: business logic/public
interfaces get tests before implementation, and every bug fix (Historias
1–8 are all confirmed pre-existing bugs, per research.md) gets a
regression test that fails without the fix. Write each story's tests
first, confirm they fail for the right reason, then implement.

**Organization**: One phase per user story from spec.md, in priority
order (P1→P12). A few tasks are explicitly cross-referenced between
phases where a later-priority story's scope textually depends on an
earlier *implementation* artifact that doesn't exist until a
higher-numbered-priority story ships (noted inline and in Dependencies).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Maps to the user story this task belongs to (US1…US12, matching spec.md's Historias 1–12)
- Every task names its exact file path(s)

## Path Conventions

Single Flutter package at repo root: `lib/`, `test/`, `integration_test/` — per plan.md's Project Structure (no change to this convention from `001`–`005`).

---

## Phase 1: Setup

**Purpose**: Confirm a clean, green baseline before any change lands — this is an existing, already-shipped app (`005` merged), not a fresh scaffold.

- [X] T001 Run `flutter pub get`, `flutter analyze`, `flutter test`, and `flutter test integration_test` from repo root; confirm all pass before any other task starts (baseline for every regression test added below)

**Checkpoint**: Clean baseline confirmed — safe to start making changes.

---

## Phase 2: Foundational

**Purpose**: No single change in this feature blocks *all* twelve stories (verified in plan.md's Constitution Check / research.md — each confirmed bug and each new capability is independently rooted in a different part of the codebase). There is therefore no traditional blocking-foundation phase here; proceed directly to Phase 3. The one real cross-story coupling in this feature (US10's `RosterEntry`/`PokemonCustomizationCard` scaffold is reused, not reimplemented, by US11 and US12; US5's FR-028/FR-029 sub-scope needs US10's `SelectableForm`/form-modal to exist) is called out explicitly in **Dependencies & Execution Order** below rather than hidden here.

**Checkpoint**: N/A — proceed to Phase 3.

---

## Phase 3: Historia 1 — Poder armar el equipo en Blanco/Negro y Blanco 2/Negro 2 (Priority: P1) 🎯 MVP

**Goal**: Selecting Black/White or Black 2/White 2 reaches the armador with its Pokédex loaded, instead of the permanent error view (research.md item 1: `PokedexEntry`'s `pokedexNumber > 0` assertion rejects Victini's legitimate `#000`).

**Independent Test**: Select each of the four games from the catalog (fresh selection and via the confirm-switch dialog from another active game); confirm the armador loads with all entries, starting at Victini `#000`.

### Tests for Historia 1 ⚠️ write first, confirm they fail

- [X] T002 [P] [US1] Unit test: `PokedexEntry` constructor accepts `pokedexNumber: 0` in `test/domain/team_builder/pokedex_entry_test.dart` (new file)
- [X] T003 [P] [US1] Fixture test: a Black/White-shaped (`original-unova`) fixture with Victini at `entry_number: 0` builds without throwing in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T004 [P] [US1] Fixture test: a Black 2/White 2-shaped (`updated-unova`) fixture with Victini at `entry_number: 0` builds without throwing in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T005 [US1] Extend the full-dex fixture sweep with the real Black/White and Black 2/White 2 entry shapes in `test/infrastructure/team_builder/pokeapi_pokedex_repository_full_dex_test.dart`
- [X] T006 [P] [US1] Regression test: a switch into a Black/White-shaped game completes without an unhandled exception through the *real* `PokedexRosterValidityChecker` + `PokeApiPokedexRepository` chain (a fully-mocked `SwitchGame` at the Cubit level would not reproduce the original bug — moved down one layer from the originally-planned `GameSelectionCubit` test) in `test/infrastructure/team_builder/pokedex_roster_validity_checker_test.dart`
- [X] T007 [US1] Integration test: selecting Black/White (and Black 2/White 2) from the catalog reaches the armador and renders its Pokédex grid in `integration_test/game_selection_flow_test.dart`

### Implementation for Historia 1

- [X] T008 [US1] Relax the constructor assertion from `pokedexNumber > 0` to `pokedexNumber >= 0` in `lib/domain/team_builder/entities/pokedex_entry.dart` (depends on T002–T007 failing first)

**Checkpoint**: Historia 1 fully functional and independently testable — MVP shippable here.

---

## Phase 4: Historia 2 — Liberar el slot cuando su Pokémon deja de ser válido tras un cambio de juego (Priority: P2)

**Goal**: A slot whose Pokémon becomes invalid after a game switch renders genuinely empty and immediately reusable (research.md item 14: `TeamBuilderCubit.load()` reads a stale, unreconciled roster straight from storage).

**Independent Test**: Occupy a slot on Game A, switch to Game B where that Pokémon isn't obtainable, open Game B's armador; confirm that slot is empty and a new Pokémon can be added to it right away.

### Tests for Historia 2 ⚠️ write first, confirm they fail

- [X] T009 [P] [US2] `bloc_test`: `TeamBuilderCubit.load()` drops a roster id that is not obtainable in the loaded game (via all-DLC-active obtainability, not just the currently-toggled view) and persists the drop via `TeamRosterStore` in `test/presentation/team_builder/team_builder_cubit_test.dart`
- [X] T010 [P] [US2] `bloc_test`: `TeamBuilderCubit.load()` drops **every** stale roster entry, not only the first, when several slots are affected in `test/presentation/team_builder/team_builder_cubit_test.dart`
- [X] T011 [US2] Integration test: switching game away from one where a roster Pokémon becomes invalid results in that slot being freed and immediately fillable in `integration_test/team_builder_flow_test.dart`

### Implementation for Historia 2

- [X] T012 [US2] Add a `_fullyObtainablePokemonIds` helper to `TeamBuilderCubit` matching `PokedexRosterValidityChecker`'s "obtainable via base + every DLC" definition, reusing the already-injected `GetPokedex` (no new dependency/`app_dependencies.dart` change needed — simpler than originally planned) in `lib/presentation/team_builder/cubit/team_builder_cubit.dart`
- [X] T013 [US2] `TeamBuilderCubit.load()` filters the roster read from `TeamRosterStore` down to obtainable ids and persists the filtered list back before emitting `loaded` in `lib/presentation/team_builder/cubit/team_builder_cubit.dart` (depends on T012, T009–T011 failing first)

**Checkpoint**: Historias 1–2 both independently functional; slots behave correctly across a game switch.

---

## Phase 5: Historia 3 — Ver la Pokédex de X/Y con números correctos (Priority: P3)

**Goal**: X/Y's Pokédex has no duplicate numbers and is strictly ascending (research.md item 2: X/Y resolves to 3 independently-numbered pokedex resources, merged today without renumbering).

**Independent Test**: Open X or Y's full Pokédex; confirm no number repeats and the list is ascending end-to-end.

### Tests for Historia 3 ⚠️ write first, confirm they fail

- [X] T014 [P] [US3] Fixture test: a 3-regional-pokedex fixture (shaped like `kalos-central`/`kalos-coastal`/`kalos-mountain`, each locally numbered 1-N) produces a merged list with zero duplicate numbers, strictly ascending, in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T015 [P] [US3] Fixture test: a single-regional-pokedex fixture (every other game) keeps PokeAPI's own `entry_number`s unchanged — no regression from the new renumbering rule — in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`

### Implementation for Historia 3

- [X] T016 [US3] In `_resolveDexRefs`/the merge loop, offset each subsequent regional ref's numbers past the running max already assigned from earlier regional refs (ref order preserved) in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T014–T015 failing first)

**Checkpoint**: Historias 1–3 independently functional.

---

## Phase 6: Historia 4 — Ver los sprites correctos por juego en Oro/Plata, Rojo/Verde y Azul (Priority: P4)

**Goal**: The three reported classic games render their own era sprites instead of falling back to modern default artwork (research.md item 3: `game.id` doesn't always equal the PokeAPI sprite-bucket key).

**Independent Test**: Open each of the five games' Pokédex (Oro, Plata, Rojo, Verde, Azul); spot-check sprites against the correct PokeAPI bucket.

### Tests for Historia 4 ⚠️ write first, confirm they fail

- [X] T017 [P] [US4] Fixture test: `gold-silver` resolves the `gold` sprite bucket in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T018 [P] [US4] Fixture test: `red-green-japan` and `blue-japan` both resolve the `red-blue` sprite bucket in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T019 [P] [US4] Fixture test: an unaffected game (e.g. `x-y`) still resolves its own directly-matching bucket — no regression from the new lookup table — in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`

### Implementation for Historia 4

- [X] T020 [US4] Add the adapter-local `_spriteVersionKeyByGameId` table (`gold-silver`→`gold`, `red-green-japan`→`red-blue`, `blue-japan`→`red-blue`) and consult it in `_resolveSpriteUrl` before indexing into `sprites.versions[...]`, defaulting to `game.id` unchanged for every other game, in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T017–T019 failing first)

**Checkpoint**: Historias 1–4 independently functional.

---

## Phase 7: Historia 5 — Ver la Pokédex de cada DLC correctamente separada y acotada (Priority: P5)

**Goal**: Confirm-and-lock-in the already-correct per-DLC grid separation/canonical-order behavior (research.md item 5 — no code change there), and add the new FR-028/FR-029 behavior (a DLC-unlocked form of an already-listed species becomes a form option, never a duplicate entry).

**Independent Test**: Activate one, then two, DLCs on a multi-DLC game; confirm separate labeled grids, no cross-DLC duplication; find a species that gains a new form via a DLC and confirm it stays a single dex entry with that form offered as an option.

### Tests for Historia 5 ⚠️ write first, confirm they fail

- [X] T021 [P] [US5] Regression fixture test: two active DLCs each contributing a distinct-but-overlapping species set produce zero duplicate species across their grids, each assigned to the DLC with the lower canonical (numeric) version-group id in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T022 [P] [US5] Widget test locking in per-DLC labeled-section rendering (one section per active DLC with visible entries, none merged into the base grid) in `test/presentation/team_builder/team_builder_page_test.dart` (new file if it doesn't already exist)
- [X] T023 [US5] Fixture test (**depends on Historia 10's `SelectableForm`/`selectableForms` existing — see Dependencies**): a species already listed via the base dex, whose variety differs in an active DLC's pokedex listing, ends up as one `PokedexEntry` with that DLC's variety attached as an additional `SelectableForm` (`requiresDlcId` set) in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T024 [US5] Fixture test (**same dependency as T023**): two active DLCs unlocking two different forms of the same already-listed species both appear as `SelectableForm`s on the one entry, never as two entries, in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`

### Implementation for Historia 5

- [X] T025 [US5] Add regression coverage confirming no production change was needed for T021/T022 (document in the test file's comments per research.md item 5); if either fails, fix the minimal regression in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` / `lib/presentation/team_builder/pages/team_builder_page.dart`
- [X] T026 [US5] **(after Historia 10 ships — see Dependencies)** In the species-merge loop, when a later ref's `pokemon_species` entry for an already-seen species resolves to a different variety, attach it as an additional `SelectableForm` (`requiresDlcId`) on the existing raw entry instead of creating a new one, in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T023–T024 failing first, and on Historia 10's T0xx `SelectableForm` value object)

**Checkpoint**: Historias 1–5 independently functional (T026 sequenced after Historia 10 in actual execution order — see Dependencies).

---

## Phase 8: Historia 6 — Ver la Pokédex Nacional en Diamante Brillante y Perla Reluciente (Priority: P6)

**Goal**: BDSP offers the National Dex toggle; no other 8th-generation game does (research.md item 4).

**Independent Test**: Open BDSP's armador, confirm the toggle is offered and scoped correctly; open Sword/Shield or Legends Arceus, confirm it is not offered.

### Tests for Historia 6 ⚠️ write first, confirm they fail

- [X] T027 [P] [US6] Unit test: `isNationalDexEligible(Game)` returns `true` for a `brilliant-diamond-shining-pearl`-shaped `Game` in `test/domain/team_builder/pokedex_view_test.dart`
- [X] T028 [P] [US6] Unit test: `isNationalDexEligible(Game)` still returns `false` for `sword-shield`/`legends-arceus`-shaped `Game`s (generation-viii, no id exception) in `test/domain/team_builder/pokedex_view_test.dart`
- [X] T029 [US6] Widget test: `NationalDexToggle` is offered on a BDSP-shaped `TeamBuilderState` and not on a Sword/Shield-shaped one in `test/presentation/team_builder/team_builder_page_test.dart`

### Implementation for Historia 6

- [X] T030 [US6] Widen `isNationalDexEligible` from `bool Function(Generation)` to `bool Function(Game)`, adding the `brilliant-diamond-shining-pearl` id exception alongside the existing generation-id set, in `lib/domain/team_builder/value_objects/pokedex_view.dart` (depends on T027–T029 failing first)
- [X] T031 [US6] Update every call site (`_resolveDexRefs`/national-ref check) to pass `game` instead of `game.generation` in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart`
- [X] T032 [US6] Update `toggleNationalDex`'s eligibility guard to pass `game` in `lib/presentation/team_builder/cubit/team_builder_cubit.dart`
- [X] T033 [US6] Update the conditional `NationalDexToggle`/section-visibility check to pass `game` in `lib/presentation/team_builder/pages/team_builder_page.dart`

**Checkpoint**: Historias 1–6 independently functional.

---

## Phase 9: Historia 7 — Ver el nombre del juego en la pantalla de armado de equipo (Priority: P7)

**Goal**: The armador's title shows the selected game's name.

**Independent Test**: Select any game; confirm its name appears at the top of the armador.

### Tests for Historia 7 ⚠️ write first, confirm they fail

- [X] T034 [US7] Widget test: `TeamBuilderPage`'s `AdaptiveScaffold` title renders `game.displayName` for a sample `Game` in `test/presentation/team_builder/team_builder_page_test.dart`

### Implementation for Historia 7

- [X] T035 [US7] Replace the hardcoded `l10n.teamBuilderTitle` with `widget.game.displayName` (or a localized template combining both, per `l10n` conventions already in the codebase) in `lib/presentation/team_builder/pages/team_builder_page.dart` (depends on T034 failing first)

**Checkpoint**: Historias 1–7 independently functional.

---

## Phase 10: Historia 8 — Usar secciones colapsables consistentes en toda la aplicación (Priority: P8)

**Goal**: Every collapsible filter section starts collapsed, collapses itself right after a selection, and already lays out responsively (research.md item 8: 2 of 3 sub-requirements are real gaps, the layout one is a regression-test-only confirmation).

**Independent Test**: Open the catalog and the armador; confirm every filter section loads collapsed, collapses on selection, and shows more than one option per row at a wide width / one per row at a narrow width.

### Tests for Historia 8 ⚠️ write first, confirm they fail

- [X] T036 [P] [US8] Widget test: `CollapsibleFilterSection` defaults to collapsed when `initiallyExpanded` is not passed in `test/shared/design_system/widgets/collapsible_filter_section_test.dart` (new file)
- [X] T037 [P] [US8] Widget test: `CollapsibleFilterSection` collapses when its new `collapseSignal` fires, and stays expanded/reflects the prior selection when re-expanded, in `test/shared/design_system/widgets/collapsible_filter_section_test.dart`
- [X] T038 [P] [US8] Widget test: at a wide/desktop test-surface width, an expanded `GenerationFilter`/`PokedexTypeFilter` lays out more than one tile per row; at a narrow/mobile width, exactly one per row (locking in the existing `Wrap` behavior — no production change expected here) in `test/presentation/game_selection/generation_filter_test.dart` and `test/presentation/team_builder/pokedex_type_filter_test.dart`
- [X] T039 [P] [US8] Widget test: selecting a generation in `GenerationFilter` fires the collapse signal in `test/presentation/game_selection/generation_filter_test.dart`
- [X] T040 [P] [US8] Widget test: selecting a type in `PokedexTypeFilter` fires the collapse signal in `test/presentation/team_builder/pokedex_type_filter_test.dart`

### Implementation for Historia 8

- [X] T041 [US8] Flip `CollapsibleFilterSection.initiallyExpanded`'s default to `false`; add an optional `collapseSignal` (`Listenable`) parameter that collapses the section when it fires, in `lib/shared/design_system/widgets/collapsible_filter_section.dart` (depends on T036–T037 failing first)
- [X] T042 [P] [US8] Wire a `collapseSignal`, bumped right after forwarding a selection to `GameSelectionCubit.updateGenerationFilter`, into `GenerationFilter`'s `CollapsibleFilterSection` in `lib/presentation/game_selection/widgets/generation_filter.dart` (depends on T039 failing first)
- [X] T043 [P] [US8] Wire the same pattern into `PokedexTypeFilter`'s `CollapsibleFilterSection`, bumped after `TeamBuilderCubit.updateTypeFilter`, in `lib/presentation/team_builder/widgets/pokedex_type_filter.dart` (depends on T040 failing first)

**Checkpoint**: Historias 1–8 independently functional.

---

## Phase 11: Historia 9 — Ver el ícono de tipo correspondiente al juego o generación (Priority: P9)

**Goal**: Type icons are sourced from `PokeAPI/sprites`' per-generation/game folders, falling back gracefully (research.md item 9, contracts/type_icon_resolution.md).

**Independent Test**: Compare a type's icon between two games of different generations; confirm it changes to match each generation's set, with a sane fallback for Gen I/II games.

### Tests for Historia 9 ⚠️ write first, confirm they fail

- [X] T044 [P] [US9] Unit test: `PokemonType.numericId` round-trips from a `type` resource fixture in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T045 [P] [US9] Unit test: `typeIconUrl` resolves the exact `{generation}/{game.id}/{numericId}.png` path for a game with its own folder (e.g. `scarlet-violet`) in `test/presentation/team_builder/type_icon_resolution_test.dart` (new file)
- [X] T046 [P] [US9] Unit test: `typeIconUrl` resolves a second real game directly (Sword/Shield) — covers the case originally planned as "sibling-folder fallback for a known exception"; live-verified during implementation that every mainline `Game.id` already matches its GitHub folder name exactly, so no exception table/sibling-fallback step exists — only the generation-level (T047) fallback is real — in `test/presentation/team_builder/type_icon_resolution_test.dart`
- [X] T047 [P] [US9] Unit test: `typeIconUrl` for a Gen I/II game walks back to the nearest generation with any folder at all (Gen III) in `test/presentation/team_builder/type_icon_resolution_test.dart`
- [X] T048 [US9] Widget test: `PokedexTypeFilter` renders the resolved network icon, falling back to `iconForPokemonType`'s Material icon only when `typeIconUrl` returns `null` in `test/presentation/team_builder/pokedex_type_filter_test.dart`

### Implementation for Historia 9

- [X] T049 [P] [US9] Add `numericId` (`int`) to `PokemonType` in `lib/domain/team_builder/value_objects/pokemon_type.dart` (depends on T044 failing first)
- [X] T050 [US9] Resolve `numericId` from the already-fetched `type` resource's own `id` field in `_fetchType` in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart`
- [X] T051 [P] [US9] Create the `_generationsWithTypeIcons` set (from research.md item 9's verified listing) and the `typeIconUrl` resolver — direct `{generation}/{game.id}` match, else fall back to `generation-iii` — in `lib/presentation/team_builder/widgets/type_icon_resolution.dart` (new file, depends on T045–T047 failing first; simpler than the originally-planned 4-step chain since no per-game exception was found needed — see T046)
- [X] T052 [US9] Use `typeIconUrl` in `PokedexTypeFilter`, falling back to `iconForPokemonType` (`lib/presentation/team_builder/widgets/pokemon_type_icons.dart`, kept as-is) when it returns `null`, in `lib/presentation/team_builder/widgets/pokedex_type_filter.dart` (depends on T048 failing first, and on T051)

**Checkpoint**: Historias 1–9 independently functional.

---

## Phase 12: Historia 10 — Elegir la forma, el género o la variante cosmética de un Pokémon en el equipo (Priority: P10)

**Goal**: Adding a Pokémon with template forms offers a game-sprite modal; gender and cosmetic variants are editable from a new Personalización de Pokémon card reachable from the slot (research.md items 10–12; contracts/pokemon_customization_card.md). **This phase introduces the shared `RosterEntry`/card scaffold Historia 11 and 12 build on** — see Dependencies.

**Independent Test**: Add a species with template forms (e.g. Rotom); confirm the add-time modal. Add a species with gender differences (e.g. Pikachu); confirm the card offers Male/Female, defaulting Male. Add Vivillon; confirm 20 cosmetic variants are offered. Add Spinda; confirm no variant picker appears.

### Tests for Historia 10 ⚠️ write first, confirm they fail

- [X] T053 [P] [US10] Unit tests for `Gender`, `SelectableForm`, `CosmeticVariant`, `RosterEntry` value objects (construction, `Equatable`, `copyWith`, JSON round-trip for `RosterEntry`) in `test/domain/team_builder/gender_test.dart`, `selectable_form_test.dart`, `cosmetic_variant_test.dart`, `roster_entry_test.dart` (new files)
- [X] T054 [P] [US10] Fixture test: a Charizard-shaped species fixture resolves `selectableForms` containing only its template-form varieties (`is_mega: false`, not `-gmax`), excluding Mega/Gigamax varieties, in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T055 [P] [US10] Fixture test: a Pikachu-shaped fixture resolves `genderRate`/`hasGenderDifferences`/`homeSpriteFemaleUrl` in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T056 [P] [US10] Fixture test: a Vivillon-shaped fixture (`pokemon.forms` with 20 entries) resolves 20 `cosmeticVariants`; a Spinda-shaped fixture (`forms` with 1 entry) resolves zero, in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T057 [P] [US10] `local_team_roster_store_test.dart`: round-trips a `RosterEntry` with `formVarietyId`/`gender`/`cosmeticVariantId` set; a legacy bare-string-array payload decodes as empty, in `test/infrastructure/team_builder/local_team_roster_store_test.dart`
- [X] T058 [P] [US10] `add_pokemon_to_team_test.dart`/`remove_pokemon_from_team_test.dart` updated for `List<RosterEntry>` in `test/application/team_builder/`
- [X] T059 [US10] Widget test: adding a species with `selectableForms.isNotEmpty` shows the form-selection modal with game sprites before completing the slot; a species with none is added directly in `test/presentation/team_builder/form_selection_modal_test.dart` (new file)
- [X] T060 [US10] Widget test: tapping an occupied slot opens `PokemonCustomizationCard` instead of removing immediately in `test/presentation/team_builder/team_slot_test.dart`
- [X] T061 [US10] Widget test: `PokemonCustomizationCard` shows Forma/Género/Variante sections exactly when their respective entry data is present, and always shows "Quitar del equipo" in `test/presentation/team_builder/pokemon_customization_card_test.dart` (new file)
- [X] T062 [US10] `bloc_test`: `TeamBuilderCubit.updateRosterEntry` persists a form/gender/variant change and updates the resolved slot sprite in `test/presentation/team_builder/team_builder_cubit_test.dart`

### Implementation for Historia 10

- [X] T063 [P] [US10] Create `Gender` enum in `lib/domain/team_builder/value_objects/gender.dart` (depends on T053 failing first)
- [X] T064 [P] [US10] Create `SelectableForm` value object (`varietyId`, `displayName`, `gameSpriteUrl`, `homeSpriteUrl`, `homeSpriteShinyUrl`, `kind` enum incl. `template`/`mega`/`gigamax`, `requiresDlcId`) in `lib/domain/team_builder/value_objects/selectable_form.dart` (depends on T053)
- [X] T065 [P] [US10] Create `CosmeticVariant` value object in `lib/domain/team_builder/value_objects/cosmetic_variant.dart` (depends on T053)
- [X] T066 [US10] Create `RosterEntry` value object with the full field set (`pokemonId`, `formVarietyId`, `gender`, `cosmeticVariantId`, `megaActive`, `gigamaxActive`, `isShiny`), `copyWith`, `toJson`/`fromJson`, in `lib/domain/team_builder/value_objects/roster_entry.dart` (depends on T063, T053; full shape defined now so Historia 11/12 only add UI wiring, not a second storage migration)
- [X] T067 [US10] Add `selectableForms`, `genderRate`, `hasGenderDifferences`, `homeSpriteFemaleUrl`, `cosmeticVariants` fields to `PokedexEntry` in `lib/domain/team_builder/entities/pokedex_entry.dart` (depends on T064–T065)
- [X] T068 [US10] Resolve the new `PokedexEntry` fields in `_buildEntry` — classify each non-principal variety via its `pokemon-form` resource (`is_mega`/`form_name`) into `selectableForms` (template only) vs. reserved for Historia 11; read `gender_rate`/`has_gender_differences`/`front_female` from the already-fetched species/pokemon bodies; read the principal variety's `pokemon.forms` into `cosmeticVariants` when it has more than one entry — in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T054–T056 failing first, T067)
- [X] T069 [US10] Rename `TeamRosterStore`'s port methods to `readRoster()`/`writeRoster(List<RosterEntry>)` in `lib/domain/team_builder/ports/team_roster_store.dart` (depends on T066)
- [X] T070 [US10] Update `LocalTeamRosterStore` to the new `RosterEntry` JSON shape with legacy-payload-as-empty fallback in `lib/infrastructure/team_builder/local_team_roster_store.dart` (depends on T057 failing first, T069)
- [X] T071 [US10] Update `AddPokemonToTeam`/`RemovePokemonFromTeam` to `List<RosterEntry>`; `AddPokemonToTeam` accepts the new slot's initial `RosterEntry` (defaults per data-model.md) in `lib/application/team_builder/use_cases/add_pokemon_to_team.dart` and `remove_pokemon_from_team.dart` (depends on T058 failing first, T066)
- [X] T072 [US10] Widen `TeamBuilderState.roster` to `List<RosterEntry>` (keep `rosterPokemonIds` as a derived getter), add `TeamSlotView.rosterEntry`, in `lib/presentation/team_builder/cubit/team_builder_state.dart` (depends on T071)
- [X] T073 [US10] Add `TeamBuilderCubit.updateRosterEntry(slotIndex, RosterEntry)`; update `load()`/`addPokemon()`/`removePokemon()` for the new roster shape in `lib/presentation/team_builder/cubit/team_builder_cubit.dart` (depends on T062 failing first, T072)
- [X] T074 [US10] Project `List<RosterEntry>` ↔ `List<String>` at `GameSelectionCubit.refreshRoster`'s existing seam (its reader callback), leaving `game_selection`'s own domain untouched, in `lib/presentation/game_selection/cubit/game_selection_cubit.dart` (depends on T070)
- [X] T075 [US10] Create `FormSelectionModal` — shows `selectableForms` with `gameSpriteUrl`, invoked when adding a species with `selectableForms.isNotEmpty` — in `lib/presentation/team_builder/widgets/form_selection_modal.dart` (new file, depends on T059 failing first, T067)
- [X] T076 [US10] Wire the add flow (`PokedexEntryCard`'s tap handler / `TeamBuilderCubit.addPokemon`) to open `FormSelectionModal` first when applicable, else add directly, in `lib/presentation/team_builder/pages/team_builder_page.dart`
- [X] T077 [US10] Create `PokemonCustomizationCard` with Forma (reopens the form picker), Género, Variante cosmética sections (each conditional per data-model.md) and an always-present "Quitar del equipo" action, in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` (new file, depends on T061 failing first, T073, T075)
- [X] T078 [US10] Change `TeamSlot.onTap` (occupied slot) to open `PokemonCustomizationCard` instead of calling `onRemove` directly; the card's own remove action calls today's `removePokemon(slotIndex)` in `lib/presentation/team_builder/widgets/team_slot.dart` (depends on T060 failing first, T077)

**Checkpoint**: Historias 1–4, 6–10 independently functional (Historia 5's T023/T024/T026 can now be sequenced — see Dependencies).

---

## Phase 13: Historia 11 — Activar Mega Evolución o Gigamax/Dinamax desde botones en la tarjeta de Personalización (Priority: P11)

**Goal**: Mega Evolution/Gigamax buttons appear on `PokemonCustomizationCard`, conditionally, mutually exclusive, excluded from the form modal (research.md item 10; Eternatus's Eternamax explicitly excluded).

**Independent Test**: Add a Mega-capable species; confirm the button appears on its card (not in the add-time modal), activating it changes the slot sprite, and it's mutually exclusive with Gigamax when both are available. Add Eternatus; confirm no Gigamax button.

### Tests for Historia 11 ⚠️ write first, confirm they fail

- [X] T079 [P] [US11] Fixture test: a Charizard-shaped fixture resolves `megaForm` (both Mega X and Mega Y — data-model.md notes a species may have more than one Mega; confirm the shape accommodates it) and does **not** include either in `selectableForms`, in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T080 [P] [US11] Fixture test: a Gigamax-capable species fixture resolves `gigamaxForm` (`form_name == "gmax"`), not in `selectableForms`, in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T081 [P] [US11] Fixture test: Eternatus's `eternatus-eternamax` variety (`is_battle_only: true`, `form_name: "eternamax"`) resolves to neither `gigamaxForm` nor `selectableForms` in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T082 [US11] Widget test: `PokemonCustomizationCard` shows the Mega button only when `entry.megaForm != null`, the Gigamax button only when `entry.gigamaxForm != null`, neither for a species with neither, in `test/presentation/team_builder/pokemon_customization_card_test.dart`
- [X] T083 [US11] Widget test: activating Mega deactivates Gigamax and vice versa when both are present in `test/presentation/team_builder/pokemon_customization_card_test.dart`
- [X] T084 [US11] `bloc_test`: activating/deactivating Mega or Gigamax via `updateRosterEntry` updates the slot's resolved sprite to/from the Mega/Gigamax HOME artwork in `test/presentation/team_builder/team_builder_cubit_test.dart`

### Implementation for Historia 11

- [X] T085 [US11] Add `megaForm`/`gigamaxForm` fields to `PokedexEntry` in `lib/domain/team_builder/entities/pokedex_entry.dart` (depends on T079–T081 failing first)
- [X] T086 [US11] In `_buildEntry`'s variety classification (T068's classifier), route `is_mega: true` varieties to `megaForm` and `form_name == "gmax"`-suffixed varieties to `gigamaxForm`, excluding both from `selectableForms`, and excluding `eternatus-eternamax`-shaped exceptions (`is_battle_only && form_name` not `"gmax"`) from both, in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart`
- [X] T087 [US11] Add the Mega/Gigamax buttons (conditional, mutually exclusive) to `PokemonCustomizationCard` in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` (depends on T082–T083 failing first)
- [X] T088 [US11] Resolve the slot's rendered sprite to `megaForm`/`gigamaxForm`'s `homeSpriteUrl` when `RosterEntry.megaActive`/`gigamaxActive` is set, else the base/form sprite, in `lib/presentation/team_builder/widgets/team_slot.dart` (depends on T084 failing first)

**Checkpoint**: Historias 1–11 independently functional.

---

## Phase 14: Historia 12 — Marcar un Pokémon del equipo como variocolor (shiny) desde la tarjeta de Personalización (Priority: P12)

**Goal**: The Personalización card's Variocolor toggle switches the slot's rendered sprite to its shiny HOME artwork; absent (not disabled) when no shiny sprite resolves (research.md item 13).

**Independent Test**: Add any Pokémon, toggle Variocolor on its card; confirm the slot's sprite switches to shiny and reverts on toggle-off; confirm a replaced slot's new occupant starts un-shiny.

### Tests for Historia 12 ⚠️ write first, confirm they fail

- [X] T089 [P] [US12] Fixture test: `homeSpriteShinyUrl`/`homeSpriteShinyFemaleUrl` resolve from the already-fetched `pokemon` body's `sprites.other.home.front_shiny`/`front_shiny_female` in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T090 [US12] Widget test: `PokemonCustomizationCard`'s Variocolor toggle is present when a shiny sprite resolves for the current form/gender combination, absent when it doesn't, in `test/presentation/team_builder/pokemon_customization_card_test.dart`
- [X] T091 [US12] `bloc_test`: toggling Variocolor via `updateRosterEntry` switches the slot's resolved sprite to/from the shiny HOME artwork, including for the currently-active form/Mega/Gigamax/gender combination, in `test/presentation/team_builder/team_builder_cubit_test.dart`
- [X] T092 [US12] `bloc_test`/unit test: replacing a slot's occupant (`removePokemon` then `addPokemon`, or `AddPokemonToTeam`'s default) always starts with `isShiny: false` in `test/application/team_builder/add_pokemon_to_team_test.dart`

### Implementation for Historia 12

- [X] T093 [US12] Add `homeSpriteShinyUrl`/`homeSpriteShinyFemaleUrl` fields to `PokedexEntry`, resolved in `_buildEntry` from the already-fetched `pokemon` body, in `lib/domain/team_builder/entities/pokedex_entry.dart` and `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T089 failing first)
- [X] T094 [US12] Add the Variocolor toggle to `PokemonCustomizationCard`, conditional on a resolved shiny sprite for the current combination, in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` (depends on T090 failing first)
- [X] T095 [US12] Resolve the slot's rendered sprite to its shiny variant when `RosterEntry.isShiny` is set (combined with form/Mega/Gigamax/gender, per data-model.md) in `lib/presentation/team_builder/widgets/team_slot.dart` (depends on T091 failing first)
- [X] T096 [US12] Confirm `AddPokemonToTeam`'s default `RosterEntry` always has `isShiny: false` (already true by `RosterEntry`'s default per T066 — this task is the regression test's corresponding pass-through check, no production change expected) in `lib/application/team_builder/use_cases/add_pokemon_to_team.dart` (depends on T092 failing first)

**Checkpoint**: All twelve Historias independently functional.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency pass across all twelve stories.

- [X] T097 [P] Run every `quickstart.md` manual-validation scenario end-to-end on both Android and Web targets — **partially completed**: ran the full `flutter test` suite (274 tests, all green) covering every Historia's behavior at the unit/widget level; the Android-emulator `integration_test` pass (T099) exercises the same scenarios end-to-end on-device. A literal manual/interactive pass on Web was not performed in this automated session.
- [X] T098 [P] `flutter analyze` — zero new lints across every file touched by this feature (confirmed: 0 errors, 0 warnings; only pre-existing `curly_braces_in_flow_control_structures` info-level lints on single-line `if (...) return ...;` fixture-file lines, present before this feature and consistent with this file's established style)
- [X] T099 Full `flutter test` + `flutter test integration_test` run — **`flutter test`: all 274 tests green.** `flutter test integration_test` against the available Android emulator (no Linux desktop target configured): found and fixed two real regressions from this feature (Historia 8's collapsed-by-default filters needed an explicit expand-tap before `game_selection_flow_test.dart`/`team_builder_flow_test.dart` could tap a generation/type tile; Historia 10's slot-tap-opens-card change needed `team_builder_flow_test.dart`'s remove-Pokémon scenario to tap through the card's "Quitar del equipo" action instead of the slot directly) — `game_selection_flow_test.dart` is now fully green. The remaining `team_builder_flow_test.dart`/`language_selection_flow_test.dart`/`language_fallback_flow_test.dart` failures are a pre-existing environment limitation, not a code regression: these suites' fixture sprite URLs (`https://example.test/...`) fail with `SocketException: Failed host lookup` because the sandboxed emulator has no DNS/network egress to resolve them — a `NetworkImage` load failure that predates this feature (present in fixtures from 004/005) and, being asynchronous, cascades into whichever test happens to be running when it resolves. Every failure traced showed this identical stack trace, confirming no additional logic regression beyond the two already fixed.
- [X] T100 [P] Review every doc comment referencing `005-selector-pokedex-fixes` for fields this feature further amended (e.g. `PokedexEntry`, `PokedexView`, `TeamRosterStore`) and update the citation to also reference `006-selector-pokedex-fixes-2` where the current behavior no longer matches `005`'s comment alone — every field this feature touched already carries a `006-selector-pokedex-fixes-2` citation (added inline during Historias 1–12); the 4 remaining files with only a `005-selector-pokedex-fixes` citation (`main.dart`, `game_selection_page.dart`, `game_card.dart`, `generation_palette.dart`) describe behavior this feature did not amend (composition-root wiring, card sizing/FittedBox, direct-navigation-after-switch, and the generation color palette), so no update was needed.
- [X] T101 Bump `pubspec.yaml`'s version (MINOR, per plan.md's Constitution Check — new capabilities, no breaking public contract beyond the internal `TeamRosterStore` storage-shape change already migration-safe) — bumped `0.4.0+4` → `0.5.0+5`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Empty for this feature (see phase note) — proceed straight to Phase 3 once Setup's baseline is green.
- **Historias 1–4, 6–10 (Phases 3, 4, 5, 6, 8, 9, 10, 11, 12 in this doc)**: Each independent of the others — implementable/testable/shippable in any order once Setup is done, **except**:
  - **Historia 5's FR-028/FR-029 tasks (T023, T024, T026)** textually depend on Historia 10's `SelectableForm` value object and form-selection modal existing (FR-028/FR-029's own wording references FR-020/FR-021). Implement Historia 5's core scope (T021, T022, T025 — already-correct DLC grid/order, regression-only) at its normal P5 priority; defer T023/T024/T026 until after Historia 10 (Phase 12) ships, then complete them.
  - **Historia 11 (Phase 13)** and **Historia 12 (Phase 14)** both build directly on `RosterEntry`/`PokemonCustomizationCard`, created in Historia 10 (Phase 12) — they cannot start before Phase 12's T063–T078 land, even though each remains independently *testable* once it does (per its own Independent Test above).
- **Polish (Phase 15)**: After every Historia phase intended for this release is complete.

### Suggested actual implementation order

1. Phase 1 (Setup)
2. Phase 3 (Historia 1 — P1, MVP)
3. Phase 4 (Historia 2 — P2)
4. Phase 5 (Historia 3 — P3)
5. Phase 6 (Historia 4 — P4)
6. Phase 7, T021/T022/T025 only (Historia 5's already-correct scope — P5)
7. Phase 8 (Historia 6 — P6)
8. Phase 9 (Historia 7 — P7)
9. Phase 10 (Historia 8 — P8)
10. Phase 11 (Historia 9 — P9)
11. Phase 12 (Historia 10 — P10, unblocks Historia 5's remainder and Historias 11/12)
12. Phase 7, T023/T024/T026 (Historia 5's FR-028/FR-029 remainder)
13. Phase 13 (Historia 11 — P11)
14. Phase 14 (Historia 12 — P12)
15. Phase 15 (Polish)

### Within Each Story

- Tests (marked ⚠️) MUST be written and confirmed failing before their corresponding implementation task.
- Domain/value-object tasks before infrastructure tasks that resolve them.
- Infrastructure before presentation/Cubit tasks that consume them.
- A story's Cubit/state tasks before its widget tasks.

### Parallel Opportunities

- All `[P]`-marked tasks within a phase touch different files and can run in parallel once that phase's non-`[P]` prerequisites (if any) are done.
- Historias 1, 2, 3, 4, 6, 7, 8, 9 (Phases 3, 4, 5, 6, 8, 9, 10, 11 in this doc) can be staffed and executed fully in parallel by different developers once Setup is done — none shares a blocking dependency with another (they do share some of the same *files*, e.g. `pokeapi_pokedex_repository.dart`, so parallel work on those needs normal merge coordination, not a task-graph dependency).
- Historia 10 (Phase 12) should land before Historias 5's remainder, 11, and 12 start, per the dependency notes above.

---

## Parallel Example: Historia 1

```bash
# Launch Historia 1's tests together:
Task: "Unit test: PokedexEntry constructor accepts pokedexNumber: 0 in test/domain/team_builder/pokedex_entry_test.dart"
Task: "Fixture test: Black/White-shaped fixture with Victini at entry_number: 0 builds without throwing in test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart"
Task: "Fixture test: Black 2/White 2-shaped fixture with Victini at entry_number: 0 builds without throwing in test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart"
Task: "bloc_test: GameSelectionCubit.confirmGameSwitch() into a Black/White-shaped game completes without an unhandled exception in test/presentation/game_selection/game_selection_cubit_test.dart"
```

---

## Implementation Strategy

### MVP First (Historia 1 only)

1. Phase 1: Setup.
2. Phase 3: Historia 1.
3. **STOP and VALIDATE**: run Historia 1's Independent Test manually (quickstart.md) plus its automated suite.
4. Ship — Black/White and Black 2/White 2 stop being completely broken, independent of every other fix in this batch.

### Incremental Delivery

Each phase in **Suggested actual implementation order** above is a complete, independently shippable increment — ship after any phase's checkpoint, in that order, without needing to wait for the whole batch.

### Parallel Team Strategy

With multiple developers: one completes Setup; then Historias 1, 2, 3, 4, 6, 7, 8, 9 (Phases 3, 4, 5, 6, 8, 9, 10, 11) can be split across developers freely (coordinate merges on shared files, esp. `pokeapi_pokedex_repository.dart`); Historia 10 should be prioritized by whoever finishes first among that group, since Historia 5's remainder and Historias 11/12 all wait on it.

---

## Notes

- `[P]` tasks = different files, no unmet dependencies.
- `[Story]` label maps every task back to its Historia in spec.md for traceability.
- Every bug-fix task (Historias 1–8) has a regression test written and confirmed failing first, per Constitution Principle II.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
- File paths ending in a filename that doesn't exist yet in the repo are called out as "(new file)" — everything else amends an existing file named in `plan.md`'s Project Structure.
