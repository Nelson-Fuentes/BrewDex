---

description: "Task list template for feature implementation"
---

# Tasks: Ajustes de Tamaño de Tipos, Disponibilidad de Formas por Juego, Tarjetas y Análisis de Cobertura

**Input**: Design documents from `/specs/013-team-pokedex-ui-fixes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — Constitution Principle II (Test-First Development) requires tests for business logic/public interfaces, following the same pattern as `011-forms-icons-moves`/`012-slots-icons-moves-defaults`.

**Organization**: Tasks are grouped by user story (spec.md priorities) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)

## Path Conventions

Single Flutter project, Hexagonal/DDD layering (`lib/domain|application|infrastructure|presentation`, `test/` mirrors `lib/`) — unchanged from every prior feature.

---

## Phase 1: Setup

**Purpose**: No shared infrastructure/dependency setup is needed — every story below builds directly on already-shipped surface with no new package or cross-cutting scaffolding (`DataTable` in User Story 7 is a Flutter built-in).

None. Proceed directly to Phase 3 (US1).

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by more than one user story.

None — `kStandardTypeIconSize` (US1) is only consumed by US1's own three call sites; no other story reads it. Every user story below touches its own files with no shared blocking prerequisite. Proceed directly to Phase 3.

---

## Phase 3: User Story 1 - Los tipos se ven en un tamaño consistente y compacto (Priority: P1) 🎯 MVP

**Goal**: One shared `kStandardTypeIconSize` (24px) constant replaces the current 96–224px per-widget sizes in the team slot, the Pokédex type filter (which also loses its black background and its oversized touch box), and the customization card's type row.

**Independent Test**: Two-type Pokémon fits both badges on one row on web, minimal-gap stacking on mobile; Pokédex filter tiles are small/themed with no black background and a button no bigger than its icon; the customization card's type row uses the same size (quickstart.md Scenario 1/3).

### Tests for User Story 1 ⚠️

- [X] T001 [P] [US1] In `test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart`, update the type-badge size assertion from `128` to `kStandardTypeIconSize` (24) — leave the Tera Type badge assertion (`96`) untouched (contracts/standard_type_icon_size.md); add an assertion that two type badges' combined rendered width fits inside one `TeamSlot` cell at a representative web width, and that the type `Wrap`'s `runSpacing` is `<= 2`
- [X] T002 [P] [US1] In `test/presentation/team_builder/pokedex_type_filter_test.dart`, replace the `_TypeTile` size-208 assertion with `kStandardTypeIconSize`, assert no rendered tile's `Material`/`Container` decoration uses `Colors.black`, and assert the tile's rendered box width is within a small fixed allowance of `kStandardTypeIconSize` (e.g. `<= kStandardTypeIconSize + 16`), not `224` (contracts/pokedex_type_filter_compact.md)
- [X] T003 [P] [US1] In `test/presentation/team_builder/pokemon_customization_card_test.dart`, update the type-row `PokemonTypeIcon.size` assertion (currently `192`, around the "×4 again, from 48 to 192" comment) to `kStandardTypeIconSize` (contracts/standard_type_icon_size.md)

### Implementation for User Story 1

- [X] T004 [US1] Add `const double kStandardTypeIconSize = 24.0;` to `lib/presentation/team_builder/widgets/type_icon_resolution.dart`, documented per data-model.md's "New presentation-level constant" section (depends on T001–T003 existing and failing first)
- [X] T005 [P] [US1] In `lib/presentation/team_builder/widgets/team_slot.dart`, change the type-row `PokemonTypeIcon(type: type, size: 128)` to use `kStandardTypeIconSize` — leave the Tera Type badge's `size: 96` untouched (depends on T004)
- [X] T006 [P] [US1] In `lib/presentation/team_builder/widgets/pokedex_type_filter.dart`'s `_TypeTile`, replace `Material(color: Colors.black, ...)` with a themed surface color (`theme.colorScheme.surfaceContainerHigh`), replace the white selected border/icon-color forcing with `theme.colorScheme.primary`/`null` respectively, use `kStandardTypeIconSize`, and shrink the `BoxConstraints(minHeight: 224)` box down to only enough padding to hold the icon (contracts/pokedex_type_filter_compact.md) (depends on T004)
- [X] T007 [P] [US1] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, change the type-row `PokemonTypeIcon(type: type, size: 192)` (and its wrapping `SizedBox(width: 192, height: 192)`) to `kStandardTypeIconSize` (depends on T004)
- [X] T008 [US1] Run `flutter test test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart test/presentation/team_builder/pokedex_type_filter_test.dart test/presentation/team_builder/pokemon_customization_card_test.dart` and confirm T001–T003 pass

**Checkpoint**: User Story 1 fully functional and independently testable — verify via quickstart.md Scenarios 1 and 3.

---

## Phase 4: User Story 2 - Las formas disponibles dependen del juego seleccionado (Priority: P1)

**Goal**: `TeamBuilderCubit.load()` clears a roster entry's `formVarietyId`/`megaActive`/`gigamaxActive` when it no longer matches the freshly-resolved, game-scoped `PokedexEntry` — the actual mechanism behind Alola forms staying selected/selectable after switching to Rojo Fuego/Verde Hoja.

**Independent Test**: Build a team member with an Alola form (or Mega/Gigamax) active under a game that allows it, reopen the armador under Rojo Fuego/Verde Hoja against the same persisted roster — the entry reverts to its base form, and the form selector never lists that option (quickstart.md Scenario 2).

### Tests for User Story 2 ⚠️

- [X] T009 [US2] Add `test/presentation/team_builder/team_builder_cubit_form_reconciliation_test.dart`: (1) a persisted roster entry with `formVarietyId` set to a variety id absent from the active game's resolved `PokedexEntry.selectableForms` is reset to `null` on `load()`, and the reset is persisted via `teamRosterStore.writeRoster(...)`; (2) a persisted entry with `megaActive: true` where the active game's `PokedexEntry.megaForm` is `null` has `megaActive` reset to `false`; (3) a persisted entry with `gigamaxActive: true` where `PokedexEntry.gigamaxForm` is `null` has `gigamaxActive` reset to `false`; (4) an entry whose `formVarietyId` **is** in the active game's `selectableForms` is left unchanged, and (5) a plain entry (no form/mega/gigamax set) triggers no extra `writeRoster` call beyond what the existing obtainability reconciliation already does — per contracts/form_availability_revalidation.md, mirroring `team_builder_cubit_roster_test.dart`'s `_MockTeamRosterStore` fixture setup

### Implementation for User Story 2

- [X] T010 [US2] In `lib/presentation/team_builder/cubit/team_builder_cubit.dart`'s `load()`, immediately after `resolvedEntries`/`reconciledRoster` (species-obtainability pass) are computed and before `emit`, add the form/Mega/Gigamax reconciliation pass described in contracts/form_availability_revalidation.md: for each entry, clear `formVarietyId` (`clearFormVarietyId: true`) when absent from `resolvedEntries[pokemonId]!.selectableForms`, clear `megaActive`/`gigamaxActive` when the matching `megaForm`/`gigamaxForm` is now `null`; if any entry changed, `await _teamRosterStore.writeRoster(...)` the corrected list before emitting (depends on T009 existing and failing first)
- [X] T011 [US2] Run `flutter test test/presentation/team_builder/team_builder_cubit_form_reconciliation_test.dart` and confirm T009 passes; also run `flutter test test/presentation/team_builder/team_builder_cubit_roster_test.dart` to confirm no regression in the existing obtainability reconciliation

**Checkpoint**: User Stories 1–2 both independently functional — verify via quickstart.md Scenario 2.

---

## Phase 5: User Story 3 - La imagen del Pokémon en la tarjeta se ve notoriamente más grande (Priority: P2)

**Goal**: The customization card's sprite grows from 96×96 to 168×168 (exactly +75%).

**Independent Test**: Open any Pokémon's card — the sprite measures 168×168, and no other section overlaps/clips (quickstart.md Scenario 4).

### Tests for User Story 3 ⚠️

- [X] T012 [US3] In `test/presentation/team_builder/pokemon_customization_card_test.dart`, update the sprite `SizedBox`/`PokeballBackground` size assertion from `96` to `168`, and add a check that pumping a card with every optional section present (forms, variants, states, 4 filled moves) at a representative width throws no overflow exception (contracts/customization_card_image_size.md)

### Implementation for User Story 3

- [X] T013 [US3] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, change the sprite `SizedBox(width: 96, height: 96, ...)` to `SizedBox(width: 168, height: 168, ...)` (depends on T012 existing and failing first)
- [X] T014 [US3] Run `flutter test test/presentation/team_builder/pokemon_customization_card_test.dart` and confirm T012 passes

**Checkpoint**: User Stories 1–3 all independently functional — verify via quickstart.md Scenario 4.

---

## Phase 6: User Story 4 - La tarjeta ya no muestra debilidades por tipo (Priority: P2)

**Goal**: The "Debilidades de tipo" section and its two private widgets are removed from the customization card; the underlying `typeEffectivenessAgainst`/`TypeEffectivenessChart` domain calculation is kept for the Coverage Analysis section's future increments.

**Independent Test**: Open any Pokémon's card — no weaknesses section anywhere (quickstart.md Scenario 5).

### Tests for User Story 4 ⚠️

- [X] T015 [US4] In `test/presentation/team_builder/pokemon_customization_card_test.dart`, delete the `'010-layout-icons-stats-weaknesses, User Story 4 ... Type Weaknesses table'` test group's assertions that the weaknesses label/table render (replace with an assertion that `find.text(l10n.customizationCardWeaknessesLabel)` and any `_TypeWeaknessTable`/weakness-cell content are absent from a rendered card) — keep any of that group's fixtures/entries still needed by other tests (contracts/remove_type_weaknesses.md)

### Implementation for User Story 4

- [X] T016 [US4] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`, delete the "Debilidades de tipo" call site (label + spacers + `_TypeWeaknessTable(...)`) and the `_TypeWeaknessTable`/`_WeaknessCell` classes; remove the now-unused `type_effectiveness_chart.dart` import if nothing else in the file uses it (depends on T015 existing and failing first)
- [X] T017 [P] [US4] Remove the `customizationCardWeaknessesLabel` key (and its `@customizationCardWeaknessesLabel` metadata block) from all 10 `lib/l10n/app_*.arb` files, then regenerate `lib/l10n/generated/` (`flutter gen-l10n`) (contracts/remove_type_weaknesses.md)
- [X] T018 [US4] Run `flutter test test/presentation/team_builder/pokemon_customization_card_test.dart` and `flutter analyze` and confirm T015 passes with no new lints (e.g. no unused import/getter left behind)

**Checkpoint**: User Stories 1–4 all independently functional — verify via quickstart.md Scenario 5.

---

## Phase 7: User Story 5 - Los movimientos elegidos reutilizan la interfaz del selector (Priority: P2)

**Goal**: `MoveSelectionSheet`'s private `_MoveListTile` is promoted to a public `MoveListTile` (with a new optional `trailing` slot) and reused by the customization card's filled move slots, so both surfaces render moves identically.

**Independent Test**: A move already assigned in the card and the same move shown in the selector share the same row layout; the assigned row additionally shows its clear button (quickstart.md Scenario 6).

### Tests for User Story 5 ⚠️

- [X] T019 [P] [US5] In `test/presentation/team_builder/widgets/move_selection_sheet_test.dart` (or wherever the sheet's tests live), add/keep an assertion that `MoveListTile` (now public) still renders name/type/PP/power/description and calls `onSelected` on tap, with no `trailing` widget present when the selector calls it (contracts/reusable_move_list_tile.md) — *no dedicated sheet test file existed; added as an assertion (`find.byType(MoveListTile)`) inside `pokemon_customization_card_test.dart`'s existing "opens the move-selection sheet" test, which already exercises the sheet*
- [X] T020 [P] [US5] In `test/presentation/team_builder/pokemon_customization_card_test.dart`, update the filled-move-slot tests (currently asserting on `_MoveSlotTile`) to assert a filled slot renders via `MoveListTile` (name/type/PP/power/description) plus its own clear `IconButton` as `trailing`; tapping the row still opens the move-selection sheet for that slot, and tapping the clear button calls `onClearMoveSlot` without also triggering the row's `onTap` (contracts/reusable_move_list_tile.md)

### Implementation for User Story 5

- [X] T021 [US5] In `lib/presentation/team_builder/widgets/move_selection_sheet.dart`, promote `_MoveListTile` to public `MoveListTile`, adding an optional `final Widget? trailing;` rendered at the end of its `Row` (default `null`, unchanged rendering when omitted) (depends on T019 existing and failing first)
- [X] T022 [US5] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`'s `_MoveSlotTile`, replace the filled-slot (`move != null`) branch's bespoke `Row` with `MoveListTile(move: move, l10n: l10n, onTap: onTap, trailing: onClear == null ? null : IconButton(...))`, reusing the existing clear-button configuration verbatim; leave the empty-slot branch unchanged (depends on T020 existing and failing first, T021)
- [X] T023 [US5] Run `flutter test test/presentation/team_builder/widgets/move_selection_sheet_test.dart test/presentation/team_builder/pokemon_customization_card_test.dart` and confirm T019/T020 pass

**Checkpoint**: User Stories 1–5 all independently functional — verify via quickstart.md Scenario 6.

---

## Phase 8: User Story 6 - El botón Quitar del equipo queda sticky (Priority: P3)

**Goal**: "Quitar del equipo" moves out of the scrollable column into a fixed footer, per contracts/sticky_remove_button.md.

**Independent Test**: Scroll a long card's content to its end — the button never moved, and still works (quickstart.md Scenario 7).

### Tests for User Story 6 ⚠️

- [X] T024 [US6] In `test/presentation/team_builder/pokemon_customization_card_test.dart`, add a test that pumps a card with enough content to require scrolling (all optional sections + 4 filled moves) inside a bounded-height ancestor, records the "Quitar del equipo" button's global `Offset` (`tester.getTopLeft`), performs a scroll-to-end gesture on the content area, and asserts the button's `Offset` is unchanged; keep tapping it still calling `onRemove` regardless of scroll position (contracts/sticky_remove_button.md)

### Implementation for User Story 6

- [X] T025 [US6] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`'s `build`, restructure `SafeArea(child: SingleChildScrollView(child: Padding(child: Column([...everything]))))` into `SafeArea(child: Column([Expanded(child: SingleChildScrollView(child: Padding(child: Column([...everything except the remove button])))), Padding(child: SizedBox(width: double.infinity, child: OutlinedButton.icon(/* unchanged Quitar del equipo */)))]))`, per contracts/sticky_remove_button.md (depends on T024 existing and failing first)
- [X] T026 [US6] Run `flutter test test/presentation/team_builder/pokemon_customization_card_test.dart` and confirm T024 (and the pre-existing header/name/type-row/remove-button ordering test) still pass

**Checkpoint**: User Stories 1–6 all independently functional — verify via quickstart.md Scenario 7.

---

## Phase 9: User Story 7 - Primera versión de la sección de Análisis de Cobertura (Priority: P3)

**Goal**: A new `CoverageAnalysisPage`, reachable from the armador's app bar, shows a `DataTable` whose first (and only, for this increment) column lists every Pokémon type by name via the existing `kAllPokemonTypes` constant.

**Independent Test**: Open the new app-bar action — a table appears listing every type by name, no icons (quickstart.md Scenario 8).

### Tests for User Story 7 ⚠️

- [X] T027 [P] [US7] Create `test/presentation/team_builder/widgets/coverage_table_test.dart`: pumping `CoverageTable` renders exactly `kAllPokemonTypes.length` rows, row `i`'s first cell shows `kAllPokemonTypes[i].label` as plain `Text`, and no `PokemonTypeIcon`/`Image` widget exists anywhere in the table (contracts/coverage_analysis_table.md)
- [X] T028 [P] [US7] Create `test/presentation/team_builder/coverage_analysis_page_test.dart`: pumping `CoverageAnalysisPage` renders its localized title and a `CoverageTable`; a test on `TeamBuilderPage` (or a new small test) confirms tapping the new app-bar action navigates to a page showing the coverage table's header (contracts/coverage_analysis_table.md)

### Implementation for User Story 7

- [X] T029 [P] [US7] Add `coverageAnalysisNavTooltip`, `coverageAnalysisPageTitle`, `coverageAnalysisTypeColumnHeader` keys (with translations) to all 10 `lib/l10n/app_*.arb` files, then regenerate `lib/l10n/generated/` (contracts/coverage_analysis_table.md)
- [X] T030 [US7] Create `lib/presentation/team_builder/widgets/coverage_table.dart` (`CoverageTable`): a `SingleChildScrollView(scrollDirection: Axis.horizontal, child: DataTable(...))` with one `DataColumn` (localized "Tipo" header) and one `DataRow`/`DataCell(Text(type.label))` per `kAllPokemonTypes` entry, per contracts/coverage_analysis_table.md (depends on T027 existing and failing first, T029)
- [X] T031 [US7] Create `lib/presentation/team_builder/pages/coverage_analysis_page.dart` (`CoverageAnalysisPage`): `AdaptiveScaffold(title: l10n.coverageAnalysisPageTitle, body: const CoverageTable())` (depends on T028 existing and failing first, T030)
- [X] T032 [US7] In `lib/presentation/team_builder/pages/team_builder_page.dart`, add an `IconButton` (e.g. `Icons.query_stats`, tooltip `l10n.coverageAnalysisNavTooltip`) to `AdaptiveScaffold.actions` that `Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CoverageAnalysisPage()))` (depends on T028 existing and failing first, T031)
- [X] T033 [US7] Run `flutter test test/presentation/team_builder/widgets/coverage_table_test.dart test/presentation/team_builder/coverage_analysis_page_test.dart` and confirm T027/T028 pass

**Checkpoint**: All 7 user stories independently functional — verify via quickstart.md Scenario 8.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Full-suite validation across every story, matching the closing step of every prior feature in this repo.

- [X] T034 Run `flutter test` for the entire suite and confirm no regressions beyond any pre-existing, unrelated known failures documented in prior features' tasks.md — 441/441 passed, no failures at all
- [X] T035 Run `flutter analyze` and confirm no new findings beyond the pre-existing baseline — confirmed identical (4 pre-existing info lints, no new findings, no errors)
- [ ] T036 Walk through quickstart.md's 8 manual validation scenarios end-to-end in a running app instance (left for the user, per the established pattern in every prior feature this session)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** / **Foundational (Phase 2)**: Both empty — proceed directly to Phase 3.
- **User Stories (Phases 3–9)**: All 7 are mutually independent — no user story's implementation tasks depend on another story's tasks completing first.
- **Polish (Phase 10)**: Depends on every user story phase being complete.

### User Story Dependencies

- **US1 (P1)**, **US3 (P2)**, **US4 (P2)**, **US5 (P2)**, **US6 (P3)**, **US7 (P3)**: No dependency on any other story.
- **US2 (P1)**: No dependency on any other story's tasks; touches only `team_builder_cubit.dart` and its own new test file.
- **US4** and **US6** both touch `pokemon_customization_card.dart` (weaknesses removal vs. sticky-footer restructuring) and **US3**/**US5** touch it too (image size, move-slot reuse) — all four edit disjoint regions of the same file; implement sequentially (in priority order) or coordinate carefully if working concurrently to avoid merge conflicts, per the same posture `012`'s tasks.md already called out for this file.

### Within Each User Story

- Tests written and failing before their corresponding implementation task, per Constitution Principle II.
- US2: cubit test before the `load()` reconciliation change (T009 → T010).
- US5: sheet promotion before the card's reuse of it (T021 before T022).
- US7: l10n keys before the widgets that read them; `CoverageTable` before `CoverageAnalysisPage` before the nav action (T029 → T030 → T031 → T032).

### Parallel Opportunities

- T001, T002, T003 (different test files) can run in parallel within US1; their corresponding implementation tasks T005, T006, T007 (different files) can then also run in parallel once T004 (the shared constant) lands.
- T019 and T020 (different test files) can run in parallel within US5, though T022 depends on T021 first.
- T027, T028, T029 (different files) can run in parallel to start within US7.
- Once Phase 2 completes (immediately, since it's empty), all 7 user story phases can be worked in parallel across contributors, subject to the `pokemon_customization_card.dart` coordination note above.

---

## Parallel Example: User Story 1

```bash
# Launch all three type-icon-size tests together:
Task: "Update type badge size assertion in test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart"
Task: "Update _TypeTile size/background assertions in test/presentation/team_builder/pokedex_type_filter_test.dart"
Task: "Update type row size assertion in test/presentation/team_builder/pokemon_customization_card_test.dart"

# Then, once the shared constant lands, launch all three corresponding call-site updates together:
Task: "Use kStandardTypeIconSize in lib/presentation/team_builder/widgets/team_slot.dart"
Task: "Use kStandardTypeIconSize + themed background in lib/presentation/team_builder/widgets/pokedex_type_filter.dart"
Task: "Use kStandardTypeIconSize in lib/presentation/team_builder/widgets/pokemon_customization_card.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001–T008).
2. **STOP and VALIDATE**: quickstart.md Scenarios 1 and 3.
3. Deploy/demo if ready — this alone fixes the most visible, most-repeated complaint (oversized type badges) across every screen that shows them.

### Incremental Delivery

1. Add US1 → validate → demo (MVP: standard type badge size everywhere).
2. Add US2 → validate → demo (Alola forms no longer leak into Rojo Fuego/Verde Hoja).
3. Add US3 → validate → demo (bigger card image).
4. Add US4 → validate → demo (weaknesses section gone).
5. Add US5 → validate → demo (moves list reuses the selector's row).
6. Add US6 → validate → demo (sticky remove button).
7. Add US7 → validate → demo (first Coverage Analysis increment).

### Parallel Team Strategy

With multiple contributors: assign US1–US7 to different contributors in parallel — coordinate on `pokemon_customization_card.dart` since US1, US3, US4, US5, and US6 all touch it (in disjoint sections); every other story's files are untouched by any other story.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Every user story is independently completable and testable, per spec.md.
- Tests are written first and MUST fail before their implementation task, per Constitution Principle II.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
