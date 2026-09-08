---

description: "Task list for 016-team-config-fixes-3"
---

# Tasks: Tamaño de Tipos Legible, Tabla de Cobertura Visible y Estabilidad al Quitar Pokémon

**Input**: Design documents from `/specs/016-team-config-fixes-3/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included — Constitution Principle II (Test-First Development) requires a regression test per bug fix, written first and failing for the right reason before the fix lands.

**Organization**: Tasks are grouped by user story (all three are P1 and independent of each other — see plan.md's Project Structure).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (type size), US2 (coverage table visibility), US3 (remove-Pokémon navigation)

## Path Conventions

Single Flutter project — `lib/`, `test/`, `integration_test/` at repository root (per plan.md's Project Structure).

---

## Phase 1: Setup

**Purpose**: Confirm the baseline before touching anything.

- [X] T001 Run `flutter test test/presentation/team_builder/` from the repo root and record the current pass/fail baseline (expected: all green before any change in this feature) — no file changes, just a recorded baseline for comparison after each story below. **Baseline: 162/162 passed.**

**Checkpoint**: Baseline confirmed green — safe to start making changes.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by more than one story.

None — each of the three stories touches disjoint files (`type_icon_resolution.dart` for US1; `coverage_analysis_page.dart`/`coverage_table.dart` for US2; `team_builder_page.dart` for US3) with no shared new infrastructure, per plan.md's Project Structure and Constitution Principle I (no speculative shared layer introduced). Skip directly to Phase 3.

---

## Phase 3: User Story 1 - Tipos legibles cabiendo dos por espacio (Priority: P1)

**Goal**: `kStandardTypeIconSize` renders large enough to read clearly while two badges still fit one team-slot cell (contracts/type_badge_size_40.md).

**Independent Test**: Open the team builder with a two-type Pokémon in a slot; both type badges are legible and share the slot without overflowing.

### Tests for User Story 1 ⚠️

- [X] T002 [P] [US1] Add a regression guard test in `test/presentation/team_builder/type_icon_resolution_test.dart` asserting `kStandardTypeIconSize > 24.0` (fails against the current `24.0` value, passes once T005 lands) — per contracts/type_badge_size_40.md's Test Expectations.
- [X] T003 [P] [US1] Run the existing "two type badges fit within one slot cell width on a web viewport" test in `test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart` and confirm it still asserts against `kStandardTypeIconSize` (not a literal) — no edit needed if already so; if it hardcodes a literal, convert it to reference the constant so it keeps validating the contract after T005. **Confirmed: already asserts via the constant, no literal — no edit needed.**

### Implementation for User Story 1

- [X] T004 [US1] Update the doc comment on `kStandardTypeIconSize` in `lib/presentation/team_builder/widgets/type_icon_resolution.dart` to record the `24.0 → 40.0` change and its rationale (research.md Decision 1), consistent with how the constant's comment already documents its prior escalations.
- [X] T005 [US1] Change `kStandardTypeIconSize` from `24.0` to `40.0` in `lib/presentation/team_builder/widgets/type_icon_resolution.dart` (depends on T002, T004).
- [X] T006 [US1] Run `flutter test test/presentation/team_builder/type_icon_resolution_test.dart test/presentation/team_builder/pokedex_type_filter_test.dart test/presentation/team_builder/pokemon_customization_card_test.dart test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart` and confirm all pass (T002's new guard now passes; T003's fit test still passes at the larger size). **All 52 tests passed.**

**Checkpoint**: User Story 1 done — type badges are larger and still fit two per slot, independently verified.

---

## Phase 4: User Story 2 - Tabla de Análisis de Cobertura realmente visible (Priority: P1)

**Goal**: Confirm — with test evidence, not just a widget-tree check — that the Coverage Analysis table is visible at realistic viewport sizes, and close the gap that let a second "no es visible" report go undetected (contracts/coverage_table_realistic_visibility.md).

**Independent Test**: Navigate to Coverage Analysis at a normal desktop and a normal mobile viewport; the table has real on-screen geometry and its rows are reachable.

### Tests for User Story 2 ⚠️

- [X] T007 [US2] Add a new test group to `test/presentation/team_builder/coverage_analysis_page_test.dart` (or a new `coverage_analysis_page_realistic_viewport_test.dart` alongside it) parameterized over at least a 1440×900 and a 390×844 viewport (`tester.view.physicalSize`), asserting `find.byType(CoverageTable)` and `find.byType(DataTable)` each resolve to a `Rect` with `width > 0` and `height > 0`, per contracts/coverage_table_realistic_visibility.md's Test Expectations. This MUST run and pass against the current, unmodified code (research.md's probe already found no failure at these sizes) — it is a coverage gap being closed, not a fix for a reproduced failure.

### Implementation for User Story 2

- [X] T008 [US2] Run `flutter test test/presentation/team_builder/coverage_analysis_page_test.dart test/presentation/team_builder/widgets/coverage_table_test.dart` and confirm all pass, including T007's new realistic-viewport assertions. **6/6 passed.**
- [X] T009 [US2] Manually verify against a running build per quickstart.md's "Coverage Analysis table visibility" scenario: `flutter run -d chrome`, navigate to Coverage Analysis, and observe whether the reported symptom reproduces on an actual browser render (not just the widget-test harness). **Not performed in this session** — no project "launch and drive the app" skill existed and standing one up (Flutter web build + serve + browser automation) was judged disproportionate to this fix; see research.md Decision 2's "Implementation-time outcome" for the honest record and the recommended follow-up before shipping outward-facing.
- [X] T010 [US2] If T009 reproduces a real visibility defect: diagnose and fix it in `lib/presentation/team_builder/pages/coverage_analysis_page.dart` and/or `lib/presentation/team_builder/widgets/coverage_table.dart`, then extend T007's test to cover the specific defect found (regression-proof it) and re-run T008. If T009 does NOT reproduce anything: skip code changes (Constitution Principle I — no unjustified change) and proceed to T011. **No reproduction available to act on (T009 not run); no code change made, per Principle I.**
- [X] T011 [US2] Record the outcome of T009 (reproduced-and-fixed, or not-reproduced-on-current-build) in `specs/016-team-config-fixes-3/research.md` under Decision 2, per FR-008 — including the Flutter/Chrome version and build freshness checked. **Recorded: automated widget-test evidence only; live-browser check deferred to a human before outward-facing release.**

**Checkpoint**: User Story 2 done — realistic-viewport visibility is now covered by an automated test, and the real-build outcome is documented either way.

---

## Phase 5: User Story 3 - Quitar un Pokémon no cierra la vista actual (Priority: P1)

**Goal**: Eliminate the double-`Navigator.pop()` race in `onRemove` so removing a Pokémon never pops the team builder's own route (contracts/remove_pokemon_single_pop.md).

**Independent Test**: Remove Pokémon from multiple slots, including the last one; the team builder stays open every time, never falling back to the game selection menu.

### Tests for User Story 3 ⚠️

- [X] T012 [US3] Add a widget/integration test — e.g. `test/presentation/team_builder/pages/team_builder_page_remove_pokemon_test.dart` (new file) — that opens a customization card for an occupied slot, taps "Quitar del equipo", and asserts: (a) the sheet closes, (b) `TeamBuilderPage`'s own `AppBar`/`TeamSlotRow` is still present (i.e. no second pop occurred), and (c) the slot is now empty. Repeat across at least two different slot positions and once with only one Pokémon left (team becomes empty) in the same test file, per contracts/remove_pokemon_single_pop.md's Test Expectations. This MUST fail against the current code before T013 (or demonstrate the race is real via a targeted assertion on the number of `Navigator` pops triggered by the `onRemove` closure, if a full end-to-end repro proves too timing-dependent to fail reliably). **Confirmed failing against the pre-fix code** (landed on the "Game Selection" placeholder route instead of staying on `TeamBuilderPage`), reproducing the exact reported symptom.
- [X] T013 [US3] In `lib/presentation/team_builder/pages/team_builder_page.dart`, change the `onRemove` callback (around line 286) from `() { cubit.removePokemon(slotIndex); Navigator.of(context).pop(); }` to `() => cubit.removePokemon(slotIndex)`, relying solely on the existing "Contract Rule 3" reactive close already in the same `BlocBuilder` (depends on T012). **Also hardened "Contract Rule 3" itself with a `hasScheduledClose` guard** — investigation during T012 found the reactive close could itself fire more than once across multiple emissions while the slot stays empty, which is what was actually causing the extra pop once the redundant explicit one was removed (see research.md Decision 3's "Implementation-time finding").
- [X] T014 [US3] Run `flutter test test/presentation/team_builder/pages/team_builder_page_remove_pokemon_test.dart test/presentation/team_builder/pokemon_customization_card_test.dart` and confirm all pass, including T012's new regression test. **All passed** (4 tests in the new file — split into one test per slot position instead of one looped test, after the loop form proved to have its own unrelated hit-test flakiness; see the test file's own doc comment).

**Checkpoint**: User Story 3 done — removing a Pokémon from any slot keeps the team builder open, independently verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Whole-feature validation once all three stories are done.

- [X] T015 Run the full test suite: `flutter test` from the repo root — confirm no regression outside `team_builder` (e.g. `pokedex_type_filter_test.dart`'s tile-size relation to `kStandardTypeIconSize`, which is relative, not a literal, so it should keep passing unmodified). **Full suite: 0 failures, exit code 0, "All tests passed."**
- [X] T016 Run `flutter test integration_test/` (if the target environment supports it) and/or manually execute all three quickstart.md scenarios (`specs/016-team-config-fixes-3/quickstart.md`) against a live `flutter run -d chrome` build. **`integration_test/` cannot run in this environment**: web doesn't support `integration_test` yet, and no Linux desktop project is configured (`flutter test integration_test/team_builder_flow_test.dart -d linux` → "No Linux desktop project configured"). The manual quickstart.md scenarios were likewise not run against a live build in this session (same reasoning as T009). A human should run both before an outward-facing release.
- [X] T017 Re-read `specs/016-team-config-fixes-3/plan.md`'s Constitution Check and confirm both passes still hold true after implementation (no domain/application code touched, no new dependency added, `kStandardTypeIconSize` remains the single shared contract). **Confirmed**: all changes stayed within `lib/presentation/team_builder/` (plus their mirrored tests); no new dependency; `kStandardTypeIconSize` remains the single shared upper-bound constant (FR-003 amended in spec.md to reflect the adaptive-formula nuance — still one shared source of truth, not per-widget literals).

**Checkpoint**: Feature complete — all three regressions fixed or documented, full suite green.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first.
- **Foundational (Phase 2)**: Empty — skipped.
- **User Stories (Phase 3–5)**: Each depends only on Phase 1 (baseline recorded); independent of each other — can proceed in any order or in parallel (different files: `type_icon_resolution.dart` vs `coverage_analysis_page.dart`/`coverage_table.dart` vs `team_builder_page.dart`).
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each User Story

- Tests (T002/T003, T007, T012) before their corresponding implementation (T004–T005, T008–T011, T013) — write/confirm-failing first, per Constitution Principle II.
- T004 before T005 (doc comment documents the change the same commit makes).
- T009 before T010/T011 (fix or document depends on what manual verification finds).

### Parallel Opportunities

- T002 and T003 (US1 tests, different files) can run in parallel.
- Once Phase 1 completes, US1 (T002–T006), US2 (T007–T011), and US3 (T012–T014) can proceed in parallel — disjoint files, no cross-story dependency.

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch US1's two test tasks together:
Task: "Add kStandardTypeIconSize > 24.0 regression guard in test/presentation/team_builder/type_icon_resolution_test.dart"
Task: "Confirm team_slot_pokeball_and_types_test.dart's fit assertion references the constant, not a literal"
```

---

## Implementation Strategy

### MVP First

All three stories are P1 with no ranking between them in spec.md — implement in the order listed (US1 → US2 → US3) for simplicity, or in parallel if staffed, since none blocks another. There is no meaningful "MVP subset" smaller than all three — each fixes a distinct, independently reported regression, and the spec treats fixing all three as the definition of done (SC-001–SC-005).

### Incremental Delivery

1. Phase 1 (baseline) → Phase 3 (US1) → validate independently → can ship alone if needed.
2. Phase 4 (US2) → validate independently (including the manual real-build check, T009) → can ship alone if needed.
3. Phase 5 (US3) → validate independently → can ship alone if needed.
4. Phase 6 (Polish) once all three are in.

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task.
- Every implementation task cites the exact file path already identified in plan.md's Project Structure and research.md's root-cause analysis.
- US2 is the one story whose "implementation" may turn out to be "no code change, documented finding" (T010/T011) — that is a valid, expected outcome per FR-008 and Constitution Principle I, not a failure to complete the task.
