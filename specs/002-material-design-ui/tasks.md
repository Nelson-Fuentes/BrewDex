---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Diseño Material Web-First y Responsive

**Input**: Design documents from `/specs/002-material-design-ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the project constitution (Principle II, Test-First Development) requires tests before implementation for business logic and public interfaces; `Breakpoints`, `BrewDexTheme`, `ResponsiveLayout`, and `AdaptiveScaffold` are all documented public contracts (see `contracts/`).

**Organization**: Tasks are grouped by user story (US1/US2/US3 from `spec.md`) so each can be implemented and validated independently, after a shared Foundational phase that all three stories build on.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are exact and repo-relative

## Path Conventions

Single Flutter project (unchanged from `001-select-game`): `lib/`, `test/`, `integration_test/` at repository root.

---

## Phase 1: Setup

**Purpose**: Prepare the shared design-system location; no new dependency is introduced (see `research.md` Decision 1).

- [X] T001 Create the `lib/shared/design_system/theme/`, `lib/shared/design_system/layout/`, and `lib/shared/design_system/widgets/` directories, and the mirrored `test/shared/design_system/theme/` and `test/shared/design_system/layout/` test directories, per `plan.md` Project Structure
- [X] T002 [P] Run `flutter analyze` and `flutter test` against the current `main` branch state to confirm a clean baseline before this feature's changes begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared design-system primitives (`Breakpoints`, `BrewDexTheme`, `ResponsiveLayout`, `AdaptiveScaffold`) that every user story below depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational primitives ⚠️

> Write these tests FIRST; confirm they FAIL (files under test don't exist yet) before implementing.

- [X] T003 [P] Unit test `Breakpoints.resolve` at boundary widths (599/600/839/840dp map to `compact`/`medium`/`expanded` per `data-model.md`) in `test/shared/design_system/layout/breakpoints_test.dart`
- [X] T004 [P] Unit test `BrewDexTheme.light` and `.dark` expose the same `ColorScheme` roles and `TextTheme` scale, differing only in `brightness`/color values, per `contracts/brew_dex_theme.md` in `test/shared/design_system/theme/brew_dex_theme_test.dart`
- [X] T005 [P] Widget test `ResponsiveLayout` builds `mobile` for `compact` width, `web` for `expanded` width, and falls back to `mobile` when `medium` is omitted, per `contracts/responsive_layout.md` in `test/shared/design_system/layout/responsive_layout_test.dart`
- [X] T006 [P] Widget test `AdaptiveScaffold` renders `body`/`actions` unchanged across `compact`/`medium`/`expanded` (FR-004: no capability hidden) and caps+centers content width only in `expanded`, per `contracts/adaptive_scaffold.md` in `test/shared/design_system/widgets/adaptive_scaffold_test.dart`

### Implementation for Foundational primitives

- [X] T007 [P] Implement `ScreenSize` enum and pure `Breakpoints.resolve(double width)` per `contracts/responsive_layout.md` and `data-model.md` in `lib/shared/design_system/layout/breakpoints.dart` (makes T003 pass)
- [X] T008 [P] Implement `BrewDexTheme.light`/`.dark` (`useMaterial3: true`, `ColorScheme.fromSeed` on a single brand seed color, shared `TextTheme`/shape tokens) per `contracts/brew_dex_theme.md` in `lib/shared/design_system/theme/brew_dex_theme.dart` (makes T004 pass)
- [X] T009 Implement `ResponsiveLayout` widget (`mobile`/`medium`/`web` builders driven by `Breakpoints.resolve`) per `contracts/responsive_layout.md` in `lib/shared/design_system/layout/responsive_layout.dart` (depends on T007; makes T005 pass)
- [X] T010 Implement `AdaptiveScaffold` widget (compact/medium/expanded variants, max-content-width cap on expanded) per `contracts/adaptive_scaffold.md` in `lib/shared/design_system/widgets/adaptive_scaffold.dart` (depends on T009; makes T006 pass)

**Checkpoint**: `Breakpoints`, `BrewDexTheme`, `ResponsiveLayout`, and `AdaptiveScaffold` all exist, are unit/widget-tested, and are ready to be consumed — user story implementation can now begin.

---

## Phase 3: User Story 1 - Experiencia visual consistente basada en Material en web (Priority: P1) 🎯 MVP

**Goal**: Every screen (starting with the existing game-selection flow) draws its colors, typography, spacing, and component styling from the single shared `BrewDexTheme`/`AdaptiveScaffold`, so the app looks and feels coherent on its primary web platform.

**Independent Test**: Load the game-selection flow in a web-sized viewport and confirm every screen/component uses the same Material-based design system rather than ad hoc styling (spec.md Escenarios de Aceptación 1–3).

### Tests for User Story 1 ⚠️

- [X] T011 [P] [US1] Widget test: `GameSelectionPage` renders inside `AdaptiveScaffold` and its `AppBar`/background/text styles resolve from `BrewDexTheme` (no hardcoded `Colors.*`/`TextStyle`) at an expanded/web width, in `test/presentation/game_selection/game_selection_theme_test.dart`

### Implementation for User Story 1

- [X] T012 [US1] Wire `MaterialApp(theme: BrewDexTheme.light, darkTheme: BrewDexTheme.dark, themeMode: ThemeMode.system)` in `lib/main.dart`
- [X] T013 [US1] Replace `GameSelectionPage`'s ad hoc `Scaffold`/`AppBar` with `AdaptiveScaffold` in `lib/presentation/game_selection/pages/game_selection_page.dart` (depends on T010, T012; makes T011 pass)
- [X] T014 [P] [US1] Restyle `game_card.dart` to read colors/typography/shape from `Theme.of(context)` instead of any hardcoded styles, in `lib/presentation/game_selection/widgets/game_card.dart` (depends on T012)
- [X] T015 [P] [US1] Restyle `game_search_bar.dart` to read colors/typography/shape from `Theme.of(context)`, in `lib/presentation/game_selection/widgets/game_search_bar.dart` (depends on T012)
- [X] T016 [P] [US1] Restyle `generation_filter.dart` to read colors/typography/shape from `Theme.of(context)`, in `lib/presentation/game_selection/widgets/generation_filter.dart` (depends on T012)
- [X] T017 [P] [US1] Restyle `dlc_toggle_list.dart` to read colors/typography/shape from `Theme.of(context)`, in `lib/presentation/game_selection/widgets/dlc_toggle_list.dart` (depends on T012)

**Checkpoint**: User Story 1 is fully functional and independently testable — the game-selection flow is visually consistent and Material-based on web. This is the MVP.

---

## Phase 4: User Story 2 - Interfaz adaptada y totalmente funcional en mobile (Priority: P2)

**Goal**: Every capability available on web remains reachable and usable on a mobile-sized viewport, laid out with mobile-appropriate touch targets and no horizontal scrolling.

**Independent Test**: Open the game-selection flow at a mobile viewport width and complete search → filter by generation → select a game end-to-end, with nothing out of reach, clipped, or requiring horizontal scroll (spec.md Escenarios de Aceptación 1–3).

### Tests for User Story 2 ⚠️

- [X] T018 [P] [US2] Widget test: `GameSelectionPage` at a 320–375px compact width renders search bar, generation filter, game cards, and DLC toggle list with no horizontal overflow, in `test/presentation/game_selection/game_selection_compact_layout_test.dart`
- [X] T019 [P] [US2] Widget test: every interactive control (search field, filter chips, game cards, DLC toggles) meets a minimum touch-target size at compact width, in `test/presentation/game_selection/game_selection_touch_target_test.dart`

### Implementation for User Story 2

- [X] T020 [US2] Adjust `GameSelectionPage`'s body layout to stack/scroll correctly through `AdaptiveScaffold`'s compact variant instead of assuming wide-viewport space, in `lib/presentation/game_selection/pages/game_selection_page.dart` (depends on T013; makes T018 pass)
- [X] T021 [P] [US2] Ensure `game_search_bar.dart` and `generation_filter.dart` controls meet minimum touch-target sizing and reflow without horizontal scroll at narrow widths, in `lib/presentation/game_selection/widgets/game_search_bar.dart` and `lib/presentation/game_selection/widgets/generation_filter.dart` (depends on T015, T016; makes T019 pass)
- [X] T022 [P] [US2] Ensure `game_card.dart`'s grid/list reflows to a narrow-column layout without clipped or truncated-unreadable text at narrow widths, in `lib/presentation/game_selection/widgets/game_card.dart` (depends on T014; makes T019 pass)
- [X] T023 [US2] Extend `integration_test/game_selection_flow_test.dart` to run the full select/search/filter flow at a mobile viewport width (depends on T020, T021, T022)

**Checkpoint**: User Stories 1 AND 2 both work independently — the app is visually consistent on web and fully functional on mobile.

---

## Phase 5: User Story 3 - Transición fluida entre tamaños de pantalla (Priority: P3)

**Goal**: Resizing the browser window, rotating a device, or using a tablet-sized viewport reflows the layout smoothly between the mobile and web designs, with no broken UI at any intermediate width (spec.md Escenarios de Aceptación 1–3, Casos Límite).

**Independent Test**: Progressively resize the surface between the mobile and web breakpoints (or use a tablet-sized viewport) and confirm no overlapping, clipped, or inaccessible elements appear at any point, including a mid-interaction resize with a transient element open.

### Tests for User Story 3 ⚠️

- [X] T024 [P] [US3] Widget test: resizing the test surface across the compact/medium/expanded thresholds re-renders the correct `ResponsiveLayout`/`AdaptiveScaffold` variant with no overflow exceptions, in `test/shared/design_system/layout/responsive_transition_test.dart`
- [X] T025 [P] [US3] Widget test: an open transient element (e.g. the generation filter's dropdown/menu) remains usable or closes predictably when the surface is resized mid-interaction, in `test/presentation/game_selection/game_selection_resize_edge_case_test.dart`

### Implementation for User Story 3

- [X] T026 [US3] Verify/adjust `AdaptiveScaffold`'s `medium` variant (tablet-width side margins) renders correctly for `GameSelectionPage` between the compact and expanded thresholds, in `lib/presentation/game_selection/pages/game_selection_page.dart` (depends on T020; makes T024 pass)
- [X] T027 [US3] Cap and center `AdaptiveScaffold`'s expanded-width body at a maximum content width so very wide desktop viewports don't stretch content illegibly (Casos Límite), in `lib/shared/design_system/widgets/adaptive_scaffold.dart` (depends on T010; makes T024 pass)
- [X] T028 [US3] Extend `integration_test/game_selection_flow_test.dart` to progressively resize the surface from web to mobile width and assert no overflow errors at any intermediate width (quickstart.md Escenario 3), in `integration_test/game_selection_flow_test.dart` (depends on T026, T027)

**Checkpoint**: All three user stories are independently functional — consistent on web, fully usable on mobile, and fluid across every width in between.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans all three user stories.

- [X] T029 [P] Verify color contrast and keyboard/focus navigability on web meet WCAG 2.1 AA-equivalent expectations across `BrewDexTheme` and the redesigned `game_selection` screens (FR-008), noting results in `specs/002-material-design-ui/quickstart.md`
- [X] T030 [P] Run `flutter analyze` and resolve any lint/analyzer warnings introduced by this feature
- [X] T031 Run the full `quickstart.md` validation guide (3 manual scenarios + `flutter test` + `integration_test` suites) and confirm everything passes
- [X] T032 [P] Update `specs/002-material-design-ui/quickstart.md` and `checklists/requirements.md` with any deviations discovered during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — starts immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; its implementation tasks build on US1's `GameSelectionPage`/widget changes (T013–T017) since both restyle the same screen — sequence US1 before US2
- **User Story 3 (Phase 5)**: Depends on Foundational; its implementation tasks build on US2's compact-layout changes (T020) and on `AdaptiveScaffold` (T010) — sequence US2 before US3
- **Polish (Phase 6)**: Depends on all desired user stories being complete

> Note: unlike a feature with fully data-independent stories, US1/US2/US3 here all redesign the same single existing screen (`game_selection`), so they are sequenced P1 → P2 → P3 rather than parallelized across stories. Within each phase, tasks marked `[P]` (different files) can still run in parallel.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Foundational primitives before screen/widget changes
- Screen wiring (e.g. T013, T020, T026) before the widget-level restyling tasks that depend on it
- Story complete (its checkpoint reached) before moving to the next priority

### Parallel Opportunities

- T003–T006 (Foundational tests) can run in parallel
- T007 and T008 (Breakpoints, BrewDexTheme) can run in parallel; T009 depends on T007, T010 depends on T009
- T014–T017 (US1 widget restyles) can run in parallel once T012 is done
- T021 and T022 (US2 widget adjustments) can run in parallel
- T029, T030, T032 (Polish) can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all Foundational tests together:
Task: "Unit test Breakpoints.resolve boundary widths in test/shared/design_system/layout/breakpoints_test.dart"
Task: "Unit test BrewDexTheme.light/.dark structural parity in test/shared/design_system/theme/brew_dex_theme_test.dart"
Task: "Widget test ResponsiveLayout builder selection in test/shared/design_system/layout/responsive_layout_test.dart"
Task: "Widget test AdaptiveScaffold variants in test/shared/design_system/widgets/adaptive_scaffold_test.dart"

# Then, once tests are red:
Task: "Implement Breakpoints.resolve in lib/shared/design_system/layout/breakpoints.dart"
Task: "Implement BrewDexTheme.light/.dark in lib/shared/design_system/theme/brew_dex_theme.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md Escenario 1, confirm the game-selection flow is visually consistent on web
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → shared design system ready
2. Add User Story 1 → validate (quickstart Escenario 1) → demo (MVP!)
3. Add User Story 2 → validate (quickstart Escenario 2) → demo
4. Add User Story 3 → validate (quickstart Escenario 3) → demo
5. Polish (Phase 6) → full quickstart.md sign-off

---

## Notes

- `[P]` tasks touch different files with no unmet dependency
- `[Story]` labels trace each task back to its spec.md user story
- Verify each test fails before implementing the code that makes it pass
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- No new pubspec.yaml dependency is introduced by this feature (research.md Decision 1)
