---

description: "Task list template for feature implementation"
---

# Tasks: Correcciones del Configurador de Equipo y la Pokédex

**Input**: Design documents from `/specs/008-configurador-equipo-correcciones/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the Constitution (Principle II) requires a regression test per bug fix, and `plan.md`'s Technical Context/Testing section commits to `flutter test` coverage for every story.

**Organization**: Tasks are grouped by user story (US1–US8, matching `spec.md`'s numbering and priorities) to enable independent implementation and testing of each.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US8)
- File paths are exact, relative to the repo root

## Path Conventions

Existing single Flutter app, Hexagonal/DDD layering: `lib/domain/team_builder/`, `lib/application/team_builder/`, `lib/infrastructure/team_builder/`, `lib/presentation/team_builder/`, mirrored 1:1 under `test/`.

---

## Phase 1: Setup

No new project, dependency, or tooling setup is required — this feature amends the existing `team_builder` bounded context in place (plan.md Technical Context: no new dependencies). Confirm the toolchain is ready before starting:

- [X] T001 Run `flutter pub get` and `flutter test` at the repo root to confirm a clean baseline before any change in this feature — baseline confirmed: 1 pre-existing, unrelated failure (`test/widget_test.dart`, the stock `flutter create` counter-demo smoke test — asserts against a `MyApp` counter UI that doesn't exist in this app), every other test (100+) passes

---

## Phase 2: Foundational

No cross-story blocking prerequisites — each user story below amends an independent piece of the existing `team_builder` code (a different file or a self-contained addition), per research.md's six independent decisions. Skip directly to the user story phases; each is independently implementable and testable in any order, though P1 stories (US1, US2, US4, US6, US7) form the suggested MVP (see Implementation Strategy).

**Checkpoint**: No foundational work to wait on — proceed straight to Phase 3.

---

## Phase 3: User Story 1 - Ver la Pokédex nacional completa (Priority: P1) 🎯 MVP

**Goal**: Every species in the active Pokédex becomes resolvable — by scrolling to the end or by searching — instead of batch resolution silently stalling once the initially-visible viewport looks "full" of placeholder tiles (research.md Decision 2).

**Independent Test**: Open a game's National Dex, scroll to the very end without pausing partway, and confirm the last species (highest dex number) is a real, tappable tile — then search by name for a species known to be near the end and confirm it appears without ever having been scrolled into view.

### Tests for User Story 1

- [X] T002 [P] [US1] Add a regression test to `test/presentation/team_builder/widgets/pokedex_grid_sliver_lookahead_test.dart` (new file) asserting `PokedexGridSliver` calls `onLoadMore` when a tile within the last 10 index entries is built — including on first paint (no prior scroll notification), covering the "short/already-visible list never gets a qualifying scroll event" gap
- [X] T003 [P] [US1] Extend the same new test file with a case asserting `onLoadMore` is NOT called merely for building a tile far from the end (index well within the first batch), so the lookahead trigger stays bounded and doesn't fire on every build

### Implementation for User Story 1

- [X] T004 [US1] Add an `onLoadMore` callback parameter to `PokedexGridSliver` and call it from `SliverChildBuilderDelegate`'s `builder` when the tile index being built is within `_loadMoreLookahead = 10` of `indexEntries.length`, in `lib/presentation/team_builder/widgets/pokedex_pane_slivers.dart` (research.md Decision 2 — superseded the originally-planned Cubit-side chaining, see research.md's "Alternatives considered")
- [X] T005 [US1] Wire `buildPokedexPaneSlivers`'s existing `onLoadMore`/equivalent parameter through to both `PokedexGridSliver` call sites (base grid and each DLC section) in the same file, and confirm the two existing scroll-notification triggers (`team_builder_page.dart`, `team_builder_two_pane_layout.dart`) are left in place as a redundant, idempotent second trigger path — additionally updated the pre-existing `test/presentation/team_builder/team_builder_page_infinite_scroll_test.dart` scenario, whose "only the first batch resolves before any scroll" premise no longer held for its 30-species fixture now that the initial viewport already reaches the near-the-end tiles (the intended behavior change); split into a short-dex (30 species, resolves fully with no scroll) and a large-dex (200 species, still genuinely needs a scroll for its tail) scenario

**Checkpoint**: User Story 1 is independently functional — the Pokédex converges to fully resolved without requiring precise scroll gestures. Verified: `flutter test test/presentation/team_builder test/application/team_builder test/domain/team_builder test/infrastructure/team_builder` — all pass.

---

## Phase 4: User Story 2 - El equipo aprovecha todo el espacio disponible (Priority: P1)

**Goal**: The expanded/desktop team-slots column grows/shrinks with the available window width (within a bounded range) and its tiles fill the column's available height, instead of a fixed 320px, content-sized island (research.md Decision 1).

**Independent Test**: Open the armador on a desktop-width window and resize it; the slots column visibly reflows with the window and leaves no large empty strip below the 6 tiles on a tall window.

### Tests for User Story 2

- [X] T006 [P] [US2] Add/extend a test in `test/presentation/team_builder/widgets/team_builder_two_pane_layout_test.dart` asserting the slots column's width is no longer a hardcoded constant (e.g. renders at two different `MediaQuery` widths and asserts the column's measured width differs, within its bounded range)
- [X] T007 [P] [US2] Add/extend a test asserting `TeamSlotRow`'s grid expands to fill available vertical space (e.g. via a `Flexible`/`Expanded` ancestor check or a golden/layout assertion) instead of `shrinkWrap: true` sizing purely to content

### Implementation for User Story 2

- [X] T008 [US2] Replace the fixed `_slotsColumnWidth = 320` `SizedBox` in `lib/presentation/team_builder/widgets/team_builder_two_pane_layout.dart` with a `LayoutBuilder`/`ConstrainedBox`-driven width that grows with available window width up to a bounded cap (research.md Decision 1). Note: the `LayoutBuilder` had to wrap the whole `Row`, not sit as one of its non-`Expanded` children — a `Row` hands a non-flex child unbounded (0..infinity) width, so a `LayoutBuilder` placed there would always see `constraints.maxWidth == double.infinity` and the clamp would always resolve to the max bound (caught by T006's own test during implementation, since both the narrow- and wide-window cases came back identical at first).
- [X] T009 [US2] Amend `lib/presentation/team_builder/widgets/team_slot_row.dart` so its `GridView` fills the available height of its column (added an opt-in `shrinkWrap` parameter, default `true` unchanged for the existing compact/medium `SliverToBoxAdapter` usage; `TeamBuilderTwoPaneLayout` now passes `shrinkWrap: false`)
- [X] T010 [US2] Verified via T006/T007's automated assertions at representative widths (900 and 2400 logical px) that the slots column stays within its 280–420px bound and the Pokédex column keeps the remaining majority of the space; a full manual `flutter run -d chrome` walkthrough of quickstart.md Scenario 2 was not additionally performed in this pass

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Iconos oficiales de tipo Pokémon (Priority: P2)

**Goal**: Every type icon shown anywhere in the armador (team slot, customization card, filter chips) renders the same, single official icon per type — not a per-generation variant, and not a generic Material-icon stand-in (research.md Decision 3).

**Independent Test**: Add two Pokémon of the same type from two different games; both show the identical icon. Open a team slot and the customization card for any Pokémon and confirm the type badge is real Pokémon-type art, not a generic circle/flame/star glyph.

### Tests for User Story 3

- [X] T011 [P] [US3] Update `test/presentation/team_builder/type_icon_resolution_test.dart` so `typeIconUrl` no longer takes a `game` parameter and every type id resolves to the fixed `generation-ix/scarlet-violet` URL regardless of which game the test previously passed — also added direct `PokemonTypeIcon` widget coverage (network-icon and Material-fallback cases)
- [X] T012 [P] [US3] Add a widget test asserting `TeamSlot` renders its type row via the new `PokemonTypeIcon` widget, not a bare `Icon(iconForPokemonType(...))` — added `test/presentation/team_builder/widgets/official_type_icons_rendering_test.dart` (new file, covers both T012 and T013 together since both surfaces share the same defect/fix)
- [X] T013 [P] [US3] Add the same assertion for `PokemonCustomizationCard`'s type chip row — see T012 (same new file)

### Implementation for User Story 3

- [X] T014 [US3] Amend `typeIconUrl` in `lib/presentation/team_builder/widgets/type_icon_resolution.dart` to drop the `game`/generation branching and always resolve against a single fixed `generation-ix`/`scarlet-violet` pair; deleted `_generationsWithTypeIcons`/`_oldestIconGeneration` (research.md Decision 3, contracts/official_type_icons.md)
- [X] T015 [US3] Added the new public `PokemonTypeIcon` widget to `lib/presentation/team_builder/widgets/type_icon_resolution.dart` (network icon with Material-icon fallback on `null`/load error; `color` tints only the fallback, never the network art, since the real per-type icon already carries its own colors)
- [X] T016 [P] [US3] Replaced `pokedex_type_filter.dart`'s private `_TypeIcon` with the new `PokemonTypeIcon` in `lib/presentation/team_builder/widgets/pokedex_type_filter.dart`; kept its now-unused `game` constructor field for call-site compatibility (8 existing test call sites), with an updated doc comment explaining it
- [X] T017 [P] [US3] Replaced the bare `Icon(iconForPokemonType(type.id), size: 12)` type row **and** the Tera Type badge icon in `lib/presentation/team_builder/widgets/team_slot.dart` with `PokemonTypeIcon` (the Tera badge is the same "type icon" concern, not called out separately in the task but in scope of FR-004)
- [X] T018 [P] [US3] Replaced the bare `Icon(iconForPokemonType(type.id), size: 18)` `Chip` avatar in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` with `PokemonTypeIcon`

**Checkpoint**: User Stories 1, 2, and 3 all work independently.

---

## Phase 6: User Story 4 - Alternar género del Pokémon correctamente (Priority: P1)

**Goal**: The customization card becomes reactive to `TeamBuilderCubit`'s live state instead of a frozen open-time snapshot, so the gender toggle visibly and durably changes the selected gender (research.md Decision 4). **This is the foundational fix that User Stories 6 and 7 below both build on** — implement this story first among US4/US6/US7.

**Independent Test**: Open the customization card for a species with gender differences, tap Hembra, and confirm the segmented control immediately highlights Hembra and the sprite updates in the same open card (not only after closing).

### Tests for User Story 4

- [X] T019 [US4] Added `test/presentation/team_builder/pokemon_customization_card_reactivity_test.dart` (new file, exercises the sheet end-to-end through the real `TeamBuilderPage`/`TeamBuilderCubit`) — opens the card, taps a gender segment, and asserts (a) the segmented control's visible selection updates within the same open sheet and (b) the persisted `RosterEntry.gender` matches; this is the primary regression test for contracts/pokemon_customization_card_reactivity.md (the same file also carries T025/T026's Shiny+Mega composition tests, since all three share one root cause and one end-to-end harness)

### Implementation for User Story 4

- [X] T020 [US4] In `lib/presentation/team_builder/pages/team_builder_page.dart`, changed `_openCustomizationCard`'s `showModalBottomSheet` `builder` to wrap `PokemonCustomizationCard` in a `BlocBuilder<TeamBuilderCubit, TeamBuilderState>` that re-reads `state.slots[slotIndex]` on every emission, instead of passing the `entry`/`rosterEntry` captured once before the sheet opens (research.md Decision 4, contracts/pokemon_customization_card_reactivity.md). **Discovered during implementation and documented in the code**: the `BlocBuilder` must be given `bloc: cubit` explicitly — a modal route pushed via `showModalBottomSheet` mounts as a *sibling* subtree on the same `Navigator`/`Overlay`, not a descendant of the page's `BlocProvider`, so a default provider-lookup `BlocBuilder` throws `ProviderNotFoundException` from inside the sheet's own context (caught by T019's end-to-end test during implementation).
- [X] T021 [US4] In the same file, close the sheet (deferred `Navigator.of(sheetContext).pop()`, guarded by `canPop()`) if `state.slots[slotIndex]` becomes empty while the sheet is open (contract Rule 3), instead of rendering with a null/stale entry

**Checkpoint**: User Stories 1–4 all work independently; the gender toggle is now durably functional.

---

## Phase 7: User Story 5 - El control de género solo aparece cuando corresponde (Priority: P2)

**Goal**: A species with a genuinely fixed single gender (`gender_rate` 0 or 8) gets that gender auto-applied at add-time instead of being left indistinguishable from a truly genderless species (research.md Decision 5).

**Independent Test**: Add a genderless species (no gender section at all) and a single-fixed-gender species (no picker, but its one real gender is reflected) and a both-genders species (picker offered and functional, via US4).

### Tests for User Story 5

- [X] T022 [P] [US5] Add cases to `test/application/team_builder/add_pokemon_to_team_test.dart` asserting `RosterEntry.gender` is auto-set to `Gender.male` for `genderRate == 0`, `Gender.female` for `genderRate == 8`, and left `null` for `genderRate == -1` (genderless), for `1 ≤ genderRate ≤ 7` (both genders — user picks), and when `genderRate` isn't passed at all

### Implementation for User Story 5

- [X] T023 [US5] Amended `AddPokemonToTeam.call` in `lib/application/team_builder/use_cases/add_pokemon_to_team.dart` — added an optional `genderRate` parameter and a private `_fixedGenderFor` helper, mirroring the existing `typePrimary`→`teraType` pattern
- [X] T024 [US5] Updated the call site in `lib/presentation/team_builder/cubit/team_builder_cubit.dart`'s `addPokemon` to also pass `genderRate: state.resolvedEntries[pokemonId]?.genderRate`

**Checkpoint**: User Stories 1–5 all work independently.

---

## Phase 8: User Story 6 - Combinar shiny con formas alternativas (mega, regional, etc.) (Priority: P1)

**Goal**: Confirm and lock in — via a dedicated regression test — that Shiny and a selected Mega/Gigamax/alternate form now compose correctly once the card is reactive (US4), instead of the later toggle silently discarding the earlier one.

**Independent Test**: Select a Mega-capable, shiny-capable species; tap Shiny, then tap Mega (without closing the sheet); the card shows the Mega form's shiny sprite, and both toggles remain visibly active.

**Dependency**: Requires User Story 4 (T020/T021) — the reactive-card fix is what makes this composition survive at all; this story's task is the regression test that pins the exact bug report down.

### Tests for User Story 6

- [X] T025 [US6] Added the Shiny-then-Mega composition test described in `contracts/pokemon_customization_card_reactivity.md`'s Verification section to `test/presentation/team_builder/pokemon_customization_card_reactivity_test.dart` (built as an end-to-end test through the real page/cubit, not the standalone-widget `pokemon_customization_card_test.dart`, since the bug only reproduces through the sheet's real open/BlocBuilder wiring): tap Shiny, then tap Mega, without closing the sheet between taps — the resulting persisted `RosterEntry` has both `isShiny: true` and `megaActive: true`
- [X] T026 [P] [US6] Added the reverse-order case (Mega then Shiny) to the same file, per spec.md Acceptance Scenario 2. (A "Shiny-then-alternate-template-form" case was not added separately — User Story 7's own new test, `T028`, already exercises a template-form change end-to-end on the same reactive card, and Decision 4's fix is form-agnostic — Mega/Gigamax/template forms all resolve through the same `_matchedForm`/`onChanged` path.)

### Implementation for User Story 6

No new production code beyond US4 (T020/T021) is expected — `slot_sprite_resolution.dart`'s form/shiny/gender combination logic was already correct (research.md Decision 4); this phase exists to prove it with tests now that the UI actually reaches it. If T025/T026 reveal any remaining gap in `_resolveFormSprite`/`_matchedForm` (`lib/presentation/team_builder/widgets/slot_sprite_resolution.dart`), fix it here:

- [X] T027 [US6] Not needed — T025/T026 passed on the first run against the US4 fix alone, confirming `slot_sprite_resolution.dart`'s form/shiny/gender composition logic was already correct as research.md Decision 4 predicted.

**Checkpoint**: User Stories 1–6 all work independently.

---

## Phase 9: User Story 7 - La tarjeta refleja la forma seleccionada por completo (Priority: P1)

**Goal**: Confirm and lock in — via a dedicated regression test — that changing form inside the customization card updates the card's own sprite, types, and (once US8 lands) base stats immediately, not only the team slot behind it.

**Independent Test**: Select an alternate Forma thumbnail inside the open card; the card's sprite/types update in place, without closing and reopening.

**Dependency**: Requires User Story 4 (T020/T021) for the same reason as US6.

### Tests for User Story 7

- [X] T028 [US7] Added a widget test to `test/presentation/team_builder/pokemon_customization_card_reactivity_test.dart` (end-to-end, same reasoning as T025) that opens the card for a species (Rotom) with `selectableForms`, taps an alternate Forma thumbnail (Heat), and asserts the card's own rendered type chips update within the same open sheet (Water gone, Fire now present) — not just the underlying `RosterEntry.formVarietyId`

### Implementation for User Story 7

No new production code beyond US4 (T020/T021) is expected — `_applyFormChange` already computes the correct `RosterEntry`; the previous bug was purely the card not re-rendering. If T028 reveals a remaining gap, fix it here:

- [X] T029 [US7] Not needed — T028 passed on the first run against the US4 fix alone.

**Checkpoint**: User Stories 1–7 all work independently.

---

## Phase 10: User Story 8 - Ver las estadísticas base en la tarjeta (Priority: P2)

**Goal**: The customization card shows the six base stats (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad) of the currently selected form, sourced from data already fetched by the repository (research.md Decision 6).

**Independent Test**: Open any Pokémon's customization card and see all six labeled stat values; switch to a Mega Evolution and see the values update to that form's own stats.

### Tests for User Story 8

- [X] T030 [P] [US8] Added `test/domain/team_builder/pokemon_stats_test.dart` covering `PokemonStats`' construction, equality, and the non-negative assertion
- [X] T031 [P] [US8] Extended `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` (new `pokemonBody` `stats`/`statRefs` fixture helpers) with a Charizard/Mega-Charizard-X fixture asserting `PokedexEntry.baseStats` and `SelectableForm.baseStats` parse independently and correctly from their own `pokemon.stats` JSON arrays (contracts/pokemon_base_stats.md)
- [X] T032 [P] [US8] Added a `resolveSlotStats` group to `test/presentation/team_builder/slot_sprite_resolution_test.dart` asserting it follows the same `_matchedForm` precedence as `resolveSlotTypes`, including the cosmetic-variant fallthrough case
- [X] T033 [P] [US8] Added a widget test to `test/presentation/team_builder/pokemon_customization_card_test.dart` asserting the card renders all six labeled stat values, and that they change when the selected form changes (via a `StatefulBuilder` wrapper simulating the reactive parent, since this file tests the standalone widget — the reactivity wiring itself is covered end-to-end by `pokemon_customization_card_reactivity_test.dart`)

### Implementation for User Story 8

- [X] T034 [P] [US8] Created `lib/domain/team_builder/value_objects/pokemon_stats.dart` — the `PokemonStats` value object (`hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed`), `Equatable`, non-negative assertion (data-model.md)
- [X] T035 [US8] Added `baseStats` (required `PokemonStats`) to `lib/domain/team_builder/entities/pokedex_entry.dart`'s constructor and `props`
- [X] T036 [US8] Added `baseStats` (required `PokemonStats`) to `lib/domain/team_builder/value_objects/selectable_form.dart`'s constructor (`props`/equality stay `varietyId`-only per the type's existing rule)
- [X] T037 [US8] Added a private `_parseStats(List<dynamic> statsJson) → PokemonStats` helper to `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (defaults a missing stat name to `0` rather than throwing)
- [X] T038 [US8] Wired `_parseStats(pokemonBody['stats'])` into `_buildEntry`'s returned `PokedexEntry.baseStats` in the same file
- [X] T039 [US8] Wired `_parseStats(varietyPokemonBody['stats'])` into `_classifyOtherVarieties`'s constructed `SelectableForm.baseStats` in the same file
- [X] T040 [US8] Added `resolveSlotStats(PokedexEntry entry, RosterEntry? rosterEntry) → PokemonStats` to `lib/presentation/team_builder/widgets/slot_sprite_resolution.dart`, reusing the existing `_matchedForm` precedence
- [X] T041 [US8] Added a labeled "Base Stats" section (new private `_StatsTable` widget) to `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` rendering `resolveSlotStats(entry, rosterEntry)`'s six values
- [X] T042 [P] [US8] Added the seven new keys (`customizationCardStatsLabel` + 6 stat labels) to all 10 `lib/l10n` ARB sources — `app_en.arb` and `app_es.arb` with deliberate translations, and (discovered during implementation: the repo has a strict `test/l10n/arb_completeness_test.dart` requiring every locale file to define every template key, not just `app_en.arb`) the remaining 8 locales (de/fr/it/ja/ko/zh/zh_Hans/zh_Hant) with their own translations too, rather than relying on gen-l10n's template fallback — then regenerated via `flutter gen-l10n`

**Checkpoint**: All 8 user stories are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [X] T043 [P] Updated every test fixture/builder across `test/` (and `integration_test/`) that constructs a `PokedexEntry`/`SelectableForm` directly — 22 files, 58 call sites, via a scripted sweep inserting a uniform `baseStats: const PokemonStats(hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1)` then `dart format`, so they compile against the new required `baseStats` field
- [X] T044 Ran `flutter analyze` (whole project, including `integration_test/`) and fixed the findings introduced by this feature: `dart fix --apply` cleared `unnecessary_const` (from the T043 sweep) plus a large batch of pre-existing `curly_braces_in_flow_control_structures` infos it happened to also fix; manually braced the one `if` this feature's own new code (`_openCustomizationCard`'s deferred pop) introduced. Remaining infos (2 in `team_builder_cubit.dart`, 1 in `slot_sprite_resolution.dart`, 1 in the repository test file) are pre-existing code this feature didn't touch — left as out of scope. The one remaining error (`test/widget_test.dart`'s `MyApp` reference) is the same pre-existing, unrelated baseline failure noted in T001.
- [X] T045 Ran the full `flutter test` suite repeatedly through this implementation and at the end: 361 tests, 360 passing, the 1 failure being the same pre-existing `test/widget_test.dart` baseline issue from T001 — no regression introduced by this feature.
- [ ] T046 Walk through every scenario in `quickstart.md` manually (`flutter run -d chrome` or equivalent) and confirm each matches its "Expected" outcome

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first.
- **Foundational (Phase 2)**: Empty — no cross-story blocking work for this feature.
- **User Stories (Phase 3–10)**: Each depends only on Setup, **except**:
  - **US6 (Phase 8)** and **US7 (Phase 9)** depend on **US4 (Phase 6)** — both bugs share US4's root cause (research.md Decision 4); their own phases are regression tests confirming the shared fix, not independent production code.
  - Every other story (US1, US2, US3, US5, US8) is fully independent of every other story.
- **Polish (Phase 11)**: Depends on every user story intended for this release being complete (T043 specifically depends on US8's T035/T036).

### Parallel Opportunities

- US1, US2, US3, US5, US8 can all be implemented in parallel (by different developers, or sequentially in any order) once Setup is done.
- US4 should land before US6/US7's regression tests are written (T025–T029 depend on T020/T021).
- Within US3: T016, T017, T018 (the three call-site swaps) are parallel once T014/T015 land.
- Within US8: T030–T033 (tests) and T034 (the new value object) are parallel; T035/T036 depend on T034; T037 is independent of T034–T036 but T038/T039 depend on both.

---

## Parallel Example: User Story 3 (Iconos oficiales de tipo)

```bash
# After T014 (typeIconUrl generation-independence) and T015 (PokemonTypeIcon widget) land:
Task: "Replace _TypeIcon with PokemonTypeIcon in lib/presentation/team_builder/widgets/pokedex_type_filter.dart"
Task: "Replace the bare type Icon in lib/presentation/team_builder/widgets/team_slot.dart with PokemonTypeIcon"
Task: "Replace the bare type Icon in lib/presentation/team_builder/widgets/pokemon_customization_card.dart with PokemonTypeIcon"
```

---

## Implementation Strategy

### MVP First (the five P1 stories)

1. Complete Phase 1: Setup.
2. Phase 2 is empty — proceed directly to user stories.
3. Implement, in order: **US1** (Phase 3) → **US2** (Phase 4) → **US4** (Phase 6, unlocks US6/US7) → **US6** (Phase 8) → **US7** (Phase 9).
4. **STOP and VALIDATE**: run `quickstart.md` Scenarios 1, 2, and 4 independently.
5. This is the MVP — every P1 bug report is resolved.

### Incremental Delivery

1. Setup → US1 → validate (Scenario 1) → demo.
2. + US2 → validate (Scenario 2) → demo.
3. + US4 → validate (Scenario 4, gender half) → demo.
4. + US6 → validate (Scenario 4, shiny+mega half) → demo.
5. + US7 → validate (Scenario 4, form-change half) → demo — **P1 scope complete**.
6. + US3 → validate (Scenario 3) → demo.
7. + US5 → validate (Scenario 5) → demo.
8. + US8 → validate (Scenario 6) → demo — **all 8 stories complete**.
9. Phase 11: Polish, full regression, quickstart walkthrough.

### Parallel Team Strategy

With multiple developers: Team completes Setup together, then splits — one developer takes US4 first (it unlocks US6/US7 for whoever picks those up next), while others take US1, US2, US3, US5, US8 independently in parallel. Stories integrate without conflict since each touches a distinct, mostly non-overlapping set of files (research.md's six decisions were scoped file-by-file for exactly this reason).

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps each task to its `spec.md` user story for traceability.
- US6 and US7 are unusual in this feature: their "implementation" tasks are conditional (T027, T029) because research.md Decision 4 already identified US4's fix as sufficient — their phases exist primarily to add the regression tests that pin the reported bugs down and catch any residual gap.
- Verify each new/updated test fails before its corresponding implementation task, then passes after (Constitution Principle II).
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
