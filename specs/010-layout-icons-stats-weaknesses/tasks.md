---

description: "Task list template for feature implementation"
---

# Tasks: Layout Mitad y Mitad, Íconos de Tipo, Colores de Estadísticas y Tabla de Debilidades

**Input**: Design documents from `/specs/010-layout-icons-stats-weaknesses/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — Constitution Principle II requires tests for new/changed behavior, and plan.md's Technical Context/Testing section commits to `flutter test` coverage for all four stories, especially the type-effectiveness chart (data correctness matters here more than in most features).

**Organization**: Tasks are grouped by user story (US1–US4, matching `spec.md`'s numbering and priorities: US1/US4 are P1, US2/US3 are P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- File paths are exact, relative to the repo root

## Path Conventions

Existing single Flutter app; this feature touches `lib/presentation/team_builder/widgets/` (four files) and adds exactly one new domain file, `lib/domain/team_builder/value_objects/type_effectiveness_chart.dart` — no application/infrastructure change.

---

## Phase 1: Setup

No new project, dependency, or tooling setup — this feature amends existing `team_builder` presentation widgets and adds one framework-free domain file (plan.md Technical Context: no new dependencies).

- [X] T001 Run `flutter test` at the repo root to confirm a clean baseline before any change in this feature (expect the one pre-existing, unrelated `test/widget_test.dart` failure noted since `008-configurador-equipo-correcciones`'s tasks.md — everything else should pass) — confirmed: 359 tests, 358 pass, only the known pre-existing failure

---

## Phase 2: Foundational

No cross-story blocking prerequisites — US1 (layout), US2 (icons), US3 (stat colors), and US4 (weakness table) touch four disjoint files apart from `pokemon_customization_card.dart`, which US2/US3/US4 all touch but in non-overlapping sections (the type row, `_StatBarRow`, and a brand-new section respectively). Each story is independently implementable and testable in any order.

**Checkpoint**: No foundational work to wait on — proceed straight to any user story phase.

---

## Phase 3: User Story 1 - El equipo y la Pokédex se reparten la pantalla en partes iguales (Priority: P1)

**Goal**: In the expanded/desktop two-pane layout, the slots column and the Pokédex column are always exactly equal width (research.md Decision 1, contracts/two_pane_half_split.md).

**Independent Test**: Open the armador on a desktop-width window; measure both panels — they're equal, and the divider sits at the horizontal midpoint. Resize the window; they stay equal.

### Tests for User Story 1

- [X] T002 [P] [US1] Replaced the existing `008-configurador-equipo-correcciones` test group (bounded 280–420px assertion) in `test/presentation/team_builder/widgets/team_builder_two_pane_layout_test.dart` with a group asserting the slots column's measured width equals the Pokédex column's measured width, and that each equals exactly half the width remaining after the 1px divider, at three window widths (900/1600/2400px) — contracts/two_pane_half_split.md Verification

### Implementation for User Story 1

- [X] T003 [US1] In `lib/presentation/team_builder/widgets/team_builder_two_pane_layout.dart`: replaced the `LayoutBuilder`/clamped-width `SizedBox` slots column with `Expanded(flex: 1, ...)`, and the Pokédex `Expanded` now has an explicit `flex: 1` too; removed `_minSlotsColumnWidth`, `_maxSlotsColumnWidth`, `_slotsColumnWidthFraction`, and the outer `LayoutBuilder` entirely (no longer needed — `Expanded` doesn't need to measure anything itself) (research.md Decision 1)
- [ ] T004 [US1] Manually verify (quickstart.md Scenario 1) at a few representative desktop widths that both panels stay visually equal and the team slots look noticeably larger than before

**Checkpoint**: User Story 1 is independently functional — the two panes are always exactly equal.

---

## Phase 4: User Story 2 - Los íconos de tipo se ven grandes y claros, sin texto (Priority: P2)

**Goal**: `TeamSlot`, `PokemonCustomizationCard`'s type row, and `PokedexTypeFilter`'s `_TypeTile` all drop their visible type-name label and any padding around the icon, letting `PokemonTypeIcon` fill its box — while `_TypeTile` keeps its existing `Semantics` label for accessibility (research.md Decision 2, contracts/type_icon_no_label_no_padding.md).

**Independent Test**: Look at a team slot, the customization card's type row, and a Pokédex type filter tile — none show the type name as text, each icon fills its container with no padding, and (for the filter) the type is still identifiable via accessibility tooling.

### Tests for User Story 2

- [X] T005 [P] [US2] Updated `test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart` — asserts the type-badge `PokemonTypeIcon` renders at the new `size: 20` (types were already icon-only in `TeamSlot`, so this mainly locks in the new size)
- [X] T006 [P] [US2] Updated `test/presentation/team_builder/pokemon_customization_card_test.dart`'s type-row rendering — covered implicitly by every existing test in that file now that the type row is `PokemonTypeIcon`-only (no `Chip`/label anywhere to assert against); also updated `pokemon_customization_card_reactivity_test.dart`'s form-change test, which previously asserted on `find.text('Water')`/`find.text('Fire')` for the type row and had to switch to matching `PokemonTypeIcon.type.id` instead (scoped to the type row's own `Wrap` specifically, since the new Type Weaknesses table (US4) also renders `PokemonTypeIcon`s for all 18 types including `water`)
- [X] T007 [P] [US2] Rewrote `test/presentation/team_builder/pokedex_type_filter_test.dart` — every test now locates a tile via `find.bySemanticsLabel(type.label)` instead of `find.text(type.label)`, directly proving FR-005 (the `Semantics` label is required to find the tile at all now); added an explicit assertion that no `find.text(type.label)` exists and that the tile's `PokemonTypeIcon` is tinted white — contracts/type_icon_no_label_no_padding.md Verification

### Implementation for User Story 2

- [X] T008 [P] [US2] In `lib/presentation/team_builder/widgets/team_slot.dart`: increased the type-badge `PokemonTypeIcon`'s `size` from `12` to `20`, and the Tera Type badge's from `10` to `16`, within the existing `Wrap`
- [X] T009 [P] [US2] In `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`: replaced the type row's `Chip(avatar: PokemonTypeIcon(size: 18), label: Text(type.label))` with a `36×36` `SizedBox` holding an unpadded `PokemonTypeIcon(size: 36)`, no label
- [X] T010 [P] [US2] In `lib/presentation/team_builder/widgets/pokedex_type_filter.dart`'s `_TypeTile`: removed `Text(type.label)` and the spacing `SizedBox`; removed the `Container`'s internal padding (kept the `BoxConstraints(minHeight: 48, minWidth: 64)` touch-target minimum and the pre-existing `IntrinsicWidth` wrapper, which is unrelated to this feature — it prevents the tile from greedily expanding to the full `Wrap` row width) and grew `PokemonTypeIcon` to `size: 40` to fill that minimum box
- [ ] T011 [US2] Manually verify (quickstart.md Scenario 2) all three locations, including a screen-reader/semantics-inspector check on a type filter tile

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Las barras de estadísticas se colorean según qué tan buena es cada estadística (Priority: P2)

**Goal**: Each bar in the Base Stats chart is colored along a red→amber→green gradient based on its own value, recomputed whenever the selected form changes (research.md Decision 3, contracts/stat_bar_color_scale.md).

**Independent Test**: Open the customization card for a Pokémon with a very low and a very high stat — the low one's bar is reddish, the high one's is greenish; switching form updates the colors along with the values.

### Tests for User Story 3

- [X] T012 [P] [US3] Added a test group to `test/presentation/team_builder/pokemon_customization_card_test.dart` asserting (via `HSVColor.hue`) `statBarColor(0)`/`statBarColor(30)` are closer to red, `statBarColor(150)`/`statBarColor(130)` are closer to green, `statBarColor(75)` is the amber midpoint, `statBarColor(x)` is deterministic, and values above 150 clamp to the same color as 150 — contracts/stat_bar_color_scale.md Verification
- [X] T013 [P] [US3] Added a widget test asserting two stat bars with clearly different values (10 vs. 150) render `FractionallySizedBox`-descendant `Container` fills with visibly different colors — form-change color recompute is already covered transitively by the existing 008/009 form-change tests, which now also implicitly exercise `statBarColor` since it's wired into every bar render

### Implementation for User Story 3

- [X] T014 [US3] Added the pure `Color statBarColor(int value)` function to `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` — clamp to `[0, 150]`, two-segment `Color.lerp` (red→amber for `[0,75]`, amber→green for `[75,150]`) per research.md Decision 3
- [X] T015 [US3] Wired `statBarColor(value)` into `_StatBarRow`'s fill `Container` color, replacing `theme.colorScheme.primary` (track color unchanged)
- [ ] T016 [US3] Manually verify (quickstart.md Scenario 3) with a lopsided-stat Pokémon and a form change

**Checkpoint**: User Stories 1–3 all work independently.

---

## Phase 6: User Story 4 - Ver las debilidades de tipo del Pokémon en una tabla (Priority: P1)

**Goal**: A new Type Weakness table section in the customization card shows all 18 attacking types' damage multiplier against the Pokémon's currently active types, computed from a new static domain type-effectiveness chart (research.md Decision 4, data-model.md, contracts/type_weakness_table.md).

**Independent Test**: Open the customization card for a Pokémon with a well-known weakness/resistance/immunity; the table shows the correct multiplier for all 18 types, with non-neutral cells visually distinguished; changing form recomputes it.

### Tests for User Story 4

- [X] T017 [P] [US4] Created `test/domain/team_builder/type_effectiveness_test.dart` — one case per single defending type (18 cases, expected values written independently from the production chart, as a cross-check) asserting the full returned map matches data-model.md's table exactly; plus 5 dual-type cases (Water/Ground → Electric `0`; Fire/Flying → Rock `4`; Steel/Fairy → Dragon `0`; a resistance-stacking case → `0.25`; single-type sanity check) — contracts/type_weakness_table.md Verification. **Caught one real transcription bug in the test's own independent cross-check data during this run** (an erroneous `normal: 0.5` under `fighting`'s non-neutral entries — Fighting does not resist Normal in the official chart) — fixed in the test, confirming the production chart itself was correct
- [X] T018 [P] [US4] Added a widget test to `test/presentation/team_builder/pokemon_customization_card_test.dart` opening the card for a fixture with known types (pure Poison: weak to Ground/Psychic, resists Grass/Fighting/Poison/Bug/Fairy) and asserting the weakness table shows the expected multiplier text for the weakness/resistance/neutral cases, plus a second test asserting it recomputes (a Poison→Steel form change introduces a `—` immunity cell that didn't exist before)

### Implementation for User Story 4

- [X] T019 [US4] Created `lib/domain/team_builder/value_objects/type_effectiveness_chart.dart` — the `const Map<String, Map<String, double>>` non-neutral-only chart authored in data-model.md, `kAllTypeIds` (PokeAPI's own numeric-id order), plus `Map<String, double> typeEffectivenessAgainst(List<PokemonType> defendingTypes)` combining 1–2 defending types multiplicatively, defaulting each individual lookup to `1.0`
- [X] T020 [US4] Added `_TypeWeaknessTable`/`_WeaknessCell` to `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` — calls `typeEffectivenessAgainst(resolveSlotTypes(entry, rosterEntry))`, renders all 18 attacking types (`kAllTypeIds` order, numeric id derived from that order's index) as `PokemonTypeIcon` + multiplier text, with weakness (error-container red), resistance (primary-container), immunity (a `—` dash instead of "0×", muted), and neutral ("1×", plain) each styled distinctly per contracts/type_weakness_table.md
- [X] T021 [US4] Added the new "Type Weaknesses" section (label + `_TypeWeaknessTable`) to the customization card's build method, after the existing type-badge/stats sections
- [ ] T022 [US4] Manually verify (quickstart.md Scenario 4) with a known dual-type weakness/immunity case and a form change

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T023 [P] Ran `flutter analyze` (whole project, including `integration_test/`) — no findings introduced by this feature; the 4 remaining infos are pre-existing (`curly_braces_in_flow_control_structures` in code this feature didn't touch)
- [X] T024 Ran the full `flutter test` suite — 390 tests, 389 pass; the 1 failure is the same pre-existing `test/widget_test.dart` baseline issue noted since `008-configurador-equipo-correcciones`'s T001. **Not separately tasked but required**: added the new `customizationCardWeaknessesLabel` l10n key (T021's section label) to all 10 `lib/l10n` ARB locale files (not just `app_en.arb`/`app_es.arb`) — the repo's `test/l10n/arb_completeness_test.dart` (discovered in `009-stats-chart-full-pokedex`) requires every locale file to define every template key.
- [ ] T025 Walk through every scenario in `quickstart.md` manually (`flutter run -d chrome` or equivalent) and confirm each matches its "Expected" outcome

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first.
- **Foundational (Phase 2)**: Empty — no cross-story blocking work.
- **User Stories (Phase 3–6)**: All four are independent of each other — US2, US3, and US4 all touch `pokemon_customization_card.dart`, but in non-overlapping sections (type row / `_StatBarRow` / new weakness-table section), so they can proceed in parallel without file-content conflicts as long as edits are sequenced at the file level (see below).
- **Polish (Phase 7)**: Depends on all four user stories being complete.

### Within `pokemon_customization_card.dart` (touched by US2, US3, US4)

Since three stories edit the same file, sequence actual edits to that one file (T009, T014/T015, T019–T021) one at a time even if planned/tested in parallel — merge conflicts, not logical dependencies, are the reason.

### Parallel Opportunities

- US1, US2, US3, US4 can all be implemented in parallel by different developers (US2/US3/US4's shared-file edits just need sequencing as noted above).
- Within US2: T005–T007 (tests, three files) are parallel; T008–T010 (implementation, three files) are parallel.
- Within US4: T017 (domain test) and T019 (domain implementation) can be done together as a tight red→green pair before T020/T021 (presentation) start, since the widget depends on the chart function.

---

## Parallel Example: User Story 2

```bash
# All three icon-site test updates can be worked on simultaneously:
Task: "Update team_slot_pokeball_and_types_test.dart for the larger icon size"
Task: "Update pokemon_customization_card_test.dart's type-row assertions"
Task: "Update pokedex_type_filter_test.dart for no-label + Semantics-preserved"

# Then all three implementation changes, same parallelism:
Task: "Enlarge TeamSlot's type icons"
Task: "Replace the customization card's type-row Chip with a bare icon"
Task: "Strip PokedexTypeFilter._TypeTile's label and padding"
```

---

## Implementation Strategy

### MVP First

US1 and US4 are both P1. Recommended order: **US1** (smallest, most visible layout fix) → **US4** (the new weakness-table feature, the highest-value addition) → **US2** → **US3** (both P2 polish).

### Incremental Delivery

1. Complete Setup.
2. US1 → validate (quickstart.md Scenario 1) → demo (panels are equal).
3. US4 → validate (quickstart.md Scenario 4) → demo (weakness table) — **P1 scope complete**.
4. US2 → validate (quickstart.md Scenario 2) → demo (icons).
5. US3 → validate (quickstart.md Scenario 3) → demo (stat colors) — **feature complete**.
6. Polish: `flutter analyze`, full `flutter test`, full quickstart walkthrough.

### Parallel Team Strategy

With up to four developers: one takes US1 (`team_builder_two_pane_layout.dart` only), one takes US4 (the new domain file + a dedicated card section), and two share US2/US3 (both touch `pokemon_customization_card.dart` alongside US4 — coordinate edit order on that one file, everything else is disjoint).

---

## Notes

- [P] tasks = different files, no dependencies (or, within `pokemon_customization_card.dart`, no *logical* dependency — still sequence the actual edits).
- [Story] label maps each task to its `spec.md` user story for traceability.
- The type-effectiveness chart (T017/T019) is the one place in this feature where correctness matters more than usual — verify every one of the 18 single-type test cases against the official chart before trusting the widget on top of it.
- Verify each new/updated test fails before its corresponding implementation task, then passes after (Constitution Principle II).
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
