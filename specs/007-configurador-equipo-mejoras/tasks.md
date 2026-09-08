---

description: "Task list for feature implementation"
---

# Tasks: Mejoras al Configurador de Equipo Pokémon

**Input**: Design documents from `/specs/007-configurador-equipo-mejoras/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Included and REQUIRED — Constitution Principle II (Test-First Development) mandates a failing test before implementation for business logic and public interfaces, and Principle II further requires a bug fix to ship with a regression test. Every implementation task below is preceded by its own failing-test task.

**Organization**: Tasks are grouped by user story (spec.md priorities) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- File paths are exact and relative to the repo root

---

## Phase 1: Setup

**Purpose**: Confirm the existing toolchain still resolves — this feature adds no new dependency.

- [X] T001 Run `flutter pub get` at the repo root and `flutter analyze` to capture the pre-feature baseline (no new dependencies are introduced by this feature — `pubspec.yaml` is not expected to change)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain value-object/port/infrastructure/pure-helper changes shared by every user story below. **No user story can be implemented until this phase is complete.**

### Domain value objects

- [X] T002 [P] Write failing tests for the new `PokedexIndexEntry` value object (equality by `pokemonId`, fields per data-model.md) in `test/domain/team_builder/value_objects/pokedex_index_entry_test.dart`
- [X] T003 [P] Implement `PokedexIndexEntry` in `lib/domain/team_builder/value_objects/pokedex_index_entry.dart` (depends on T002)
- [X] T004 [P] Write failing tests for `RosterEntry.teraType` (`copyWith`, `toJson`/`fromJson` round-trip omitting `null`, `props`) in `test/domain/team_builder/value_objects/roster_entry_test.dart`
- [X] T005 [P] Add the nullable `teraType` field to `RosterEntry` in `lib/domain/team_builder/value_objects/roster_entry.dart` (depends on T004)
- [X] T006 [P] Write failing tests for `SelectableForm`'s new `typePrimary`/`typeSecondary`/`homeSpriteFemaleUrl`/`homeSpriteShinyFemaleUrl` fields (construction + that `props` stays `[varietyId]`-only) in `test/domain/team_builder/value_objects/selectable_form_test.dart`
- [X] T007 [P] Add the four new fields to `SelectableForm` in `lib/domain/team_builder/value_objects/selectable_form.dart` (depends on T006)

### Pokédex port + infrastructure (contracts/pokedex_repository_pagination.md)

- [X] T008 Replace `fetchPokedex` with `fetchPokedexIndex`/`fetchPokedexDetails` on the `PokedexRepository` port in `lib/domain/team_builder/ports/pokedex_repository.dart` (depends on T003)
- [X] T009 Write failing tests for `PokeApiPokedexRepository.fetchPokedexIndex` (returns the full ordered index with no per-species HTTP call, preserving today's regional-offset/national-scope/DLC-merge rules) in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` (depends on T008)
- [X] T010 Write failing tests for `PokeApiPokedexRepository.fetchPokedexDetails` (resolves only the requested id subset; a non-principal variety's `SelectableForm` carries `typePrimary`/`typeSecondary`/female/shiny-female sprites from its already-fetched body) in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` (depends on T008, T007)
- [X] T011 Implement the `fetchPokedexIndex`/`fetchPokedexDetails` split in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart`, populating the new `SelectableForm` fields from the variety body `_classifyOtherVarieties` already fetches (depends on T009, T010)

### Application use cases

- [X] T012 [P] Write failing tests for `GetPokedexIndex` (thin pass-through) in `test/application/team_builder/use_cases/get_pokedex_index_test.dart`
- [X] T013 [P] Implement `GetPokedexIndex` in `lib/application/team_builder/use_cases/get_pokedex_index.dart` (depends on T012, T011)
- [X] T014 [P] Write failing tests for `GetPokedexDetails` (thin pass-through, batch of ids) in `test/application/team_builder/use_cases/get_pokedex_details_test.dart`
- [X] T015 [P] Implement `GetPokedexDetails` in `lib/application/team_builder/use_cases/get_pokedex_details.dart` (depends on T014, T011)
- [X] T016 Delete the now-unused `GetPokedex` use case and its test: `lib/application/team_builder/use_cases/get_pokedex.dart`, `test/application/team_builder/use_cases/get_pokedex_test.dart` (depends on T013, T015)

### Shared sprite/type resolution fix (research.md Decision 4 — feeds US4 and US5)

- [X] T017 Write failing regression tests reproducing today's shiny/gender-ignores-selected-form bug, plus expectations for a new `resolveSlotTypes(entry, rosterEntry)` helper (returns the matched form's types when a form/Mega/Gigamax is active, else the entry's own) in `test/presentation/team_builder/widgets/slot_sprite_resolution_test.dart` (depends on T007)
- [X] T018 Fix `resolveSlotSpriteUrl`/`hasShinySprite` to read the matched form's `homeSpriteFemaleUrl`/`homeSpriteShinyFemaleUrl` instead of falling through to `entry.*`, and add `resolveSlotTypes` in `lib/presentation/team_builder/widgets/slot_sprite_resolution.dart` (depends on T017)

### Pokéball background widget (contracts/pokeball_background.md — feeds US5 and US6)

- [X] T019 [P] Write failing tests for `PokeballBackground` (`neutral`/`accent` tones map to the documented `colorScheme` roles; `child` centers on top) in `test/presentation/team_builder/widgets/pokeball_background_test.dart`
- [X] T020 [P] Implement `PokeballBackground` in `lib/presentation/team_builder/widgets/pokeball_background.dart` (depends on T019)

**Checkpoint**: Foundation ready — every user story phase below can now proceed.

---

## Phase 3: User Story 1 - Cambiar de juego sin interrupciones (Priority: P1) 🎯 MVP

**Goal**: Every `selectGame` call — including re-selecting the already-active game — resets the team to empty immediately, with no confirmation dialog and no removal-notice dialog (contracts/game_switch_reset.md).

**Independent Test**: With a partially-built team for Game A, select Game B (and, separately, re-select Game A) from the game selector → armador opens immediately with an empty team, no dialog appears either time.

- [X] T021 [P] [US1] Write failing tests: `GameSelectionCubit.selectGame` always resets `rosterPokemonIds` to empty, for both `game != activeGame` and `game == activeGame`, in `test/presentation/game_selection/cubit/game_selection_cubit_test.dart`
- [X] T022 [P] [US1] Write failing widget tests: tapping a `GameCard` never shows an `AlertDialog` and navigates to the armador immediately, for both a fresh selection and a re-selection, in `test/presentation/game_selection/pages/game_selection_page_test.dart`
- [X] T023 [US1] Update `GameSelectionCubit.selectGame` to unconditionally call `TeamRosterStore.writeRoster(const [])` and remove `requestGameSwitch`/`cancelGameSwitch`/`confirmGameSwitch`/`acknowledgeRemovalNotice` in `lib/presentation/game_selection/cubit/game_selection_cubit.dart` (depends on T021)
- [X] T024 [US1] Remove `pendingGameSwitch`/`rosterRemovalNotice` from `GameSelectionState` (and its `copyWith`/`props`) in `lib/presentation/game_selection/cubit/game_selection_state.dart` (depends on T023)
- [X] T025 [US1] Remove `_showConfirmSwitchDialog`/`_showRemovalNoticeDialog` and wire a `GameCard` tap straight to `selectGame` + navigation in `lib/presentation/game_selection/pages/game_selection_page.dart` (depends on T022, T024)
- [X] T026 [US1] Delete the `SwitchGame` use case and its test (grep the repo first for any other reference to `SwitchGame`/`TeamBuildingSession`'s reconciliation role before deleting): `lib/application/game_selection/use_cases/switch_game.dart`, `test/application/game_selection/use_cases/switch_game_test.dart` (depends on T025)
- [X] T027 [US1] Remove the orphaned `changeGameDialogTitle`/`changeGameDialogContent`/`removedPokemonDialogTitle`/`removedPokemonDialogContent` keys from the ARB files and regenerate localizations in `lib/l10n/` (depends on T025)

**Checkpoint**: User Story 1 is fully functional and independently testable/demoable — smallest possible MVP slice.

---

## Phase 4: User Story 3 - Cargar la Pokédex nacional rápidamente (Priority: P1)

**Goal**: The Pokédex shows its first ~20 entries almost instantly and loads the rest via scroll-triggered batches; searching finds a Pokémon even if it hasn't been detail-resolved yet (contracts/pokedex_repository_pagination.md).

**Independent Test**: Open a National Dex-eligible game's armador with National Dex on → first ~20 entries render near-instantly; scrolling to the loaded end fetches more without a visible stall; searching a name known to be past #20 still returns it.

- [X] T028 [P] [US3] Write failing tests for the amended `TeamBuilderState` (`index`, `resolvedEntries`, `resolvedCount`, `isLoadingMore`, and a derived "what to render" list mixing resolved entries with placeholders for unresolved index rows) in `test/presentation/team_builder/cubit/team_builder_state_test.dart`
- [X] T029 [US3] Amend `TeamBuilderState` per `data-model.md` in `lib/presentation/team_builder/cubit/team_builder_state.dart` (depends on T028)
- [X] T030 [P] [US3] Write failing tests for `TeamBuilderCubit`: `load()` resolves only the first ~20 ids; a next-batch call resolves the next ~20; `updateSearch` resolves an index match outside the currently-resolved window; a game/view change discards a still-in-flight previous batch's result, in `test/presentation/team_builder/cubit/team_builder_cubit_test.dart`
- [X] T031 [US3] Rewire `TeamBuilderCubit.load`/`_fetchAndApplyView`/`updateSearch` onto `GetPokedexIndex` + batched `GetPokedexDetails` calls (first ~20 on load, index-filtered search resolving unresolved matches) in `lib/presentation/team_builder/cubit/team_builder_cubit.dart` (depends on T029, T030, T013, T015)
- [X] T032 [US3] Add `TeamBuilderCubit.loadMoreIfNeeded()` for the scroll-driven next-~20-ids batch, guarded against duplicate concurrent calls via `isLoadingMore` (depends on T031)
- [X] T033 [P] [US3] Write failing widget tests: scrolling the Pokédex grid near its loaded end calls `loadMoreIfNeeded`; an unresolved index row renders a placeholder tile, in `test/presentation/team_builder/pages/team_builder_page_test.dart`
- [X] T034 [US3] Wire a scroll-position listener in the Pokédex grid to call `loadMoreIfNeeded()` near the end, and render a placeholder tile for unresolved index rows, in `lib/presentation/team_builder/pages/team_builder_page.dart` (depends on T032, T033)

**Checkpoint**: User Story 3 is independently functional/testable (fast initial load, infinite scroll, search-anywhere), without requiring US1 or US2.

---

## Phase 5: User Story 2 - Configurar el equipo cómodamente en escritorio (Priority: P1)

**Goal**: At the app's existing `expanded` breakpoint, team slots render in a fixed left panel and the Pokédex in an independently-scrollable right panel; below that breakpoint, today's single-column layout is unchanged (research.md Decision 2).

**Independent Test**: Open the armador at ≥ 840px width → slots left, Pokédex right, each scrolls independently; resize below 840px → falls back to the existing single-column layout.

> Depends on User Story 3 (Phase 4) for the finalized `TeamBuilderState` shape the Pokédex column renders from — do this story after US3 to avoid rework.

- [X] T035 [P] [US2] Write failing widget tests for `TeamBuilderTwoPaneLayout`: at `ScreenSize.expanded` renders slots left / Pokédex right with two independent `Scrollable`s; below `expanded` is not used at all, in `test/presentation/team_builder/widgets/team_builder_two_pane_layout_test.dart`
- [X] T036 [US2] Implement `TeamBuilderTwoPaneLayout` (`Row` of a fixed-width slots column and an `Expanded` Pokédex column, each independently scrollable) in `lib/presentation/team_builder/widgets/team_builder_two_pane_layout.dart` (depends on T035)
- [X] T037 [US2] Have `TeamBuilderPage` pick `TeamBuilderTwoPaneLayout` vs. the existing single-column `CustomScrollView` body via `Breakpoints.resolve(MediaQuery.sizeOf(context).width)` in `lib/presentation/team_builder/pages/team_builder_page.dart` (depends on T036, T034)

**Checkpoint**: US1 + US3 + US2 — all three P1 stories — are independently functional. This is the recommended fuller MVP checkpoint.

---

## Phase 6: User Story 4 - Ver el sprite correcto según forma, shiny y género (Priority: P2)

**Goal**: The shiny/gender sprite shown always matches the currently selected form — the actual fix already landed in Foundational (T017/T018); this story proves it end-to-end through the widgets that display it.

**Independent Test**: Pick a non-default form on a Pokémon with both alternate forms and a gender difference, toggle shiny → shiny sprite is that form's; switch gender → gender sprite is that form's.

- [X] T038 [P] [US4] Write failing widget tests: `PokemonCustomizationCard` and `TeamSlot` render the selected form's shiny/gender sprite (not the default form's) across form + shiny + gender combinations, in `test/presentation/team_builder/widgets/pokemon_customization_card_test.dart` and `test/presentation/team_builder/widgets/team_slot_test.dart`
- [X] T039 [US4] Confirm every sprite-rendering call site in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` and `lib/presentation/team_builder/widgets/team_slot.dart` goes through the fixed `resolveSlotSpriteUrl` (T018), fixing any remaining direct `entry.*` read (depends on T038, T018)

**Checkpoint**: User Story 4 is independently testable — the sprite bug is closed end-to-end, not just at the resolver level.

---

## Phase 7: User Story 5 - Identificar el estado y los tipos de un Pokémon de un vistazo (Priority: P2)

**Goal**: Pokéball backgrounds change color by selection/active state everywhere a sprite renders; team slots and the customization card show type(s) (recalculated per form) plus a Tera Type (Escarlata/Púrpura only, default = primary type, user-editable) (contracts/tera_type.md, contracts/pokeball_background.md).

**Independent Test**: Add a Pokémon → its Pokédex tile's pokéball recolors; open its slot → that slot's pokéball recolors, others don't; slot/card show correct type(s) that update on form change; in Escarlata/Púrpura, a Tera Type badge (defaulted, then user-changeable) appears — and nowhere else.

- [X] T040 [P] [US5] Write failing tests: `PokedexEntryCard` uses `PokeballBackground` with `accent` iff `inTeam`, else `neutral`, in `test/presentation/team_builder/widgets/pokedex_entry_card_test.dart`
- [X] T041 [US5] Wire `PokeballBackground` into `PokedexEntryCard` in `lib/presentation/team_builder/widgets/pokedex_entry_card.dart` (depends on T040, T020)
- [X] T042 [P] [US5] Write failing tests: `TeamBuilderState.activeSlotIndex` is set when a slot's customization card opens and cleared when it closes, in `test/presentation/team_builder/cubit/team_builder_state_test.dart` and `test/presentation/team_builder/cubit/team_builder_cubit_test.dart`
- [X] T043 [US5] Add `activeSlotIndex` to `TeamBuilderState`, set/cleared by `TeamBuilderCubit` around the customization card's open/close, in `lib/presentation/team_builder/cubit/team_builder_state.dart` and `lib/presentation/team_builder/cubit/team_builder_cubit.dart` (depends on T042)
- [X] T044 [P] [US5] Write failing tests: `TeamSlot` uses `PokeballBackground` with `accent` iff it's the active slot, and renders up to 2 type badges via `resolveSlotTypes`, in `test/presentation/team_builder/widgets/team_slot_test.dart`
- [X] T045 [US5] Add `isActive`/`activeIndex` params through `TeamSlotRow`→`TeamSlot`, wire `PokeballBackground` + `resolveSlotTypes` type badges, and pass `state.activeSlotIndex` from `TeamBuilderPage` in `lib/presentation/team_builder/widgets/team_slot.dart`, `lib/presentation/team_builder/widgets/team_slot_row.dart`, `lib/presentation/team_builder/pages/team_builder_page.dart` (depends on T044, T043, T018)
- [X] T046 [P] [US5] Write failing tests: `AddPokemonToTeam` sets the new `RosterEntry.teraType` to the added entry's `typePrimary` only when the target game is Escarlata/Púrpura, else leaves it `null`, in `test/application/team_builder/use_cases/add_pokemon_to_team_test.dart`
- [X] T047 [US5] Implement the Tera Type default in `lib/application/team_builder/use_cases/add_pokemon_to_team.dart` (depends on T046, T005)
- [X] T048 [P] [US5] Write failing tests: `TeraTypePicker` renders all 18 `PokemonType`s and selecting one calls back with the picked type, in `test/presentation/team_builder/widgets/tera_type_picker_test.dart`
- [X] T049 [US5] Implement `TeraTypePicker` in `lib/presentation/team_builder/widgets/tera_type_picker.dart` (depends on T048)
- [X] T050 [US5] Wire the type badge row + `TeraTypePicker` (Escarlata/Púrpura only, updates `RosterEntry.teraType` via `updateRosterEntry`, unaffected by a later form change) into `PokemonCustomizationCard` in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` (depends on T049, T047, T018)

**Checkpoint**: User Story 5 is independently testable — pokéball state colors, slot/card type badges, and the full Tera Type default+picker flow all work.

---

## Phase 8: User Story 6 - Tarjeta de configuración rediseñada (Priority: P3)

**Goal**: `PokemonCustomizationCard` matches the user-supplied reference layout (header, image on an always-accent pokéball, name, type row, Forma thumbnails, Género 3-way toggle, Estados Especiales row, full-width Quitar del equipo) while preserving every field-change wire-up already in place.

**Independent Test**: Open a slot's card → matches the reference structure; change form/género/estado → highlight and sprite update immediately, consistent with the slot/Pokédex.

> Depends on User Story 5 (Phase 7) — the type row and Tera picker it lays out already need to exist on the card.

- [X] T051 [P] [US6] Write failing widget tests asserting the reference layout's structure and ordering (header row with back/title/favorite, image on `PokeballBackground`, name, type row, Forma as image thumbnails, Género as a 3-way toggle including "sin género", Estados Especiales as a labeled row of icon buttons, full-width Quitar del equipo button) in `test/presentation/team_builder/widgets/pokemon_customization_card_test.dart`
- [X] T052 [US6] Redesign `PokemonCustomizationCard` to the reference layout, preserving every existing `onChanged`/`onRemove` wiring (Forma/Mega/Gigamax/Género/Variante/Shiny/Tipo/Tera/Quitar) in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` (depends on T051, T050)

**Checkpoint**: All six user stories are independently functional and demoable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide consistency and final validation across every story above.

- [X] T053 [P] Run `flutter analyze` and resolve any warning introduced by this feature
- [X] T054 [P] Grep `lib/` and `test/` for stray references to removed symbols (`GetPokedex`, `SwitchGame`, `TeamBuilderState.allEntries`/`.visibleEntries`/`.entryCache`, `GameSelectionCubit.requestGameSwitch`/`.cancelGameSwitch`/`.confirmGameSwitch`/`.acknowledgeRemovalNotice`) and finish migrating any stragglers
- [X] T055 Execute every scenario in `specs/007-configurador-equipo-mejoras/quickstart.md`'s manual validation section end-to-end
- [X] T056 [P] Run the full `flutter test` suite and confirm it passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS every user story phase**.
- **User Stories (Phase 3–8)**: All depend on Foundational. Priority order from spec.md: US1 = US2 = US3 (P1), US4 = US5 (P2), US6 (P3).
  - US1 (Phase 3) has no dependency on any other story — safe to do first (smallest MVP).
  - US3 (Phase 4) has no dependency on US1; only on Foundational.
  - US2 (Phase 5) is sequenced after US3 to reuse its finalized `TeamBuilderState` shape (avoids rework), though its own widget is new/independent.
  - US4 (Phase 6) depends only on Foundational (the fix already landed there).
  - US5 (Phase 7) depends only on Foundational (`PokeballBackground`, `resolveSlotTypes`, `RosterEntry.teraType`).
  - US6 (Phase 8) is sequenced after US5 because it re-lays-out the same card US5 already wired the type row/Tera picker into.
- **Polish (Phase 9)**: Depends on all stories being complete.

### Within Each User Story

- Failing tests are written and confirmed failing before the implementation task that follows them (Constitution Principle II).
- Domain/application changes before the presentation wiring that consumes them.
- Story complete (its own checkpoint) before starting a story that's sequenced after it.

### Parallel Opportunities

- All `[P]`-marked Foundational tasks (T002/T003, T004/T005, T006/T007, T012–T015, T019/T020) can run in parallel with each other, respecting each pair's own test-before-implementation order.
- US1 and US3 (Phases 3–4) touch entirely different files/bounded contexts (`game_selection` vs. `team_builder`) — a second contributor can start US3 as soon as Foundational is done, without waiting on US1.
- US4 and US5 (Phases 6–7) similarly touch disjoint concerns and can proceed in parallel once Foundational is done.
- Within any phase, `[P]`-marked test tasks for different files can run together.

---

## Parallel Example: Foundational Phase

```bash
# Once Setup is done, these test tasks can be written in parallel (different files):
Task: "Write failing tests for PokedexIndexEntry in test/domain/team_builder/value_objects/pokedex_index_entry_test.dart"
Task: "Write failing tests for RosterEntry.teraType in test/domain/team_builder/value_objects/roster_entry_test.dart"
Task: "Write failing tests for SelectableForm's new fields in test/domain/team_builder/value_objects/selectable_form_test.dart"
Task: "Write failing tests for PokeballBackground in test/presentation/team_builder/widgets/pokeball_background_test.dart"
```

## Parallel Example: User Story 5

```bash
# These US5 test tasks touch disjoint files and can be written together:
Task: "Write failing tests for PokedexEntryCard pokéball tone in test/presentation/team_builder/widgets/pokedex_entry_card_test.dart"
Task: "Write failing tests for TeamBuilderState.activeSlotIndex in test/presentation/team_builder/cubit/team_builder_state_test.dart"
Task: "Write failing tests for AddPokemonToTeam's Tera Type default in test/application/team_builder/use_cases/add_pokemon_to_team_test.dart"
Task: "Write failing tests for TeraTypePicker in test/presentation/team_builder/widgets/tera_type_picker_test.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational — required even for US1, since it's the shared domain baseline).
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: confirm no dialog ever appears and every selection resets the team.
4. Demo/deploy if ready — this alone fixes the reported "no responde siempre" bug.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → validate → demo (smallest MVP, fixes the reported bug).
3. US3 → validate → demo (fast Pokédex load).
4. US2 → validate → demo (all three P1 stories done — the "full P1 slice").
5. US4 → validate → demo (sprite bug closed).
6. US5 → validate → demo (visual state cues + Tera Type).
7. US6 → validate → demo (redesigned card — feature complete).
8. Polish → final validation across everything.

### Parallel Team Strategy

With more than one contributor, after Foundational:

- Contributor A: US1 (Phase 3), independent of everything else.
- Contributor B: US3 (Phase 4), independent of US1.
- Once US3 lands: Contributor B (or C) continues to US2 (Phase 5).
- Contributor C: US4 (Phase 6) and US5 (Phase 7) in parallel with the above (disjoint files).
- Whoever finishes US5 first continues to US6 (Phase 8).
