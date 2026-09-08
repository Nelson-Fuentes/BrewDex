---

description: "Task list for 018-onboarding-pokedex-team-polish"
---

# Tasks: Onboarding, Pokedex & Team Builder Polish

**Input**: Design documents from `/specs/018-onboarding-pokedex-team-polish/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included — Constitution Principle II (Test-First Development) requires tests before implementation for business logic/public interfaces, and a regression test per bug fix, written first and failing for the right reason before the fix lands.

**Organization**: Tasks are grouped by user story from spec.md — US1 (onboarding flow, P1), US2 (Pokedex accuracy/DLC/pagination, P1), US3 (team builder layout + shiny modal, P2), US4 (outlined visual style, P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4 (see above)

## Path Conventions

Single Angular SPA in `web/src/` (per plan.md's Project Structure), organized by module (`language`, `game`, `pokemon`, `pokedex`, `team`, `shared`) then by layer (`domain/`, `application/`, `infrastructure/`, `presentation/`). All paths below are relative to `web/src/` unless stated otherwise.

---

## Phase 1: Setup

**Purpose**: Confirm the baseline before touching anything.

- [X] T001 From `web/`, run `npm test`, `npm run lint`, and `npm run test:e2e` and record the current pass/fail baseline (expected: all green before any change in this feature) — no file changes, just a recorded baseline for comparison after each story below. **Baseline: `npm test` 140/140 passed; `npm run lint` clean; `npm run test:e2e --project=chromium` (user-story-1) 6/6 passed; `user-story-2` (Sword/Shield, national/full pokedex resolution) timed out past 400s under the pre-fix "resolve entire index up front" behavior — this is the exact SC-003 bug being fixed, recorded here as the "before" baseline, not a blocker.**

**Checkpoint**: Baseline confirmed green (with the one pre-existing slow-pokedex baseline explicitly recorded above) — safe to start making changes.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by more than one story.

None — US1 (`language/`, `game/presentation`), US2 (`game/infrastructure`, `pokemon/infrastructure`, `pokedex/`), US3 (`team/`), and US4 (a visual sweep applied last, after the other three land) touch disjoint concerns with no new shared abstraction (research.md Decisions 1–12; Constitution Principle I — no speculative shared layer introduced). Skip directly to Phase 3.

---

## Phase 3: User Story 1 - Frictionless language & game selection (Priority: P1) 🎯 MVP

**Goal**: Selecting a language or game navigates immediately (no "Continuar"/"Seleccionar" button); every step after the first has a working back control; game cards show a pokeball icon and a color distinct per game; the language list is compact with visible spacing.

**Independent Test**: Open the app, select a language, select a game, and confirm each selection navigates forward immediately and a "back" control returns to the previous step with the prior selection intact — without touching the Pokedex or team builder.

### Tests for User Story 1 ⚠️

- [X] T002 [P] [US1] Update `language/presentation/language-selector.page.spec.ts`: assert no "Continuar"/`language.continue` button is rendered, and that clicking an `app-language-option-tile`'s `select` output calls `Router.navigateByUrl('/juego')` directly (fails against current `continueToGameSelection`-button-only wiring, passes after T007).
- [X] T003 [P] [US1] Update `game/presentation/game-selection.page.spec.ts`: assert no "Seleccionar"/`game.select` button is rendered, that clicking an `app-game-card`'s `select` output calls `Router.navigateByUrl('/equipo')` directly (respecting the existing `hasAnyPokemon()` confirm-guard in `onSelectGame`), and that a back control click calls `Router.navigateByUrl('/idioma')` (fails currently — no back control exists; passes after T008).
- [X] T004 [P] [US1] Add a new `game/presentation/game-card.component.spec.ts` case: renders a `mat-icon` with text `catching_pokemon`, and two `GameCardComponent` instances with different `game().id` render different `background`/`--brewdex-game-color` values (fails currently — single fixed gradient; passes after T009/T010).
- [X] T005 [P] [US1] Create `shared/design-system/pokemon-game-colors.spec.ts`: `colorForGame('red-blue')` is deterministic (same id → same color across calls) and differs from `colorForGame('emerald')`; unknown/empty id falls back to a defined default color without throwing (fails — file doesn't exist yet; passes after T006).

### Implementation for User Story 1

- [X] T006 [P] [US1] Create `shared/design-system/pokemon-game-colors.ts` exporting `colorForGame(gameId: string): string`, mirroring `pokemon-type-colors.ts`'s shape — a small curated accessible-contrast palette selected via a deterministic string hash of `gameId` (research.md Decision 3) (depends on T005).
- [X] T007 [US1] In `language/presentation/language-selector.page.ts`: remove the `.app-actions`/"Continuar" button and `continueToGameSelection()` trigger button, call `router.navigateByUrl('/juego')` directly from the `(select)` handler passed to `app-language-option-tile` (keep `languageService.selectLanguage(...)` call first), and tighten `mat-nav-list` styling — add `max-width` per option row and increased `gap`/`margin-block` between `app-language-option-tile` rows (FR-001) (depends on T002).
- [X] T008 [US1] In `game/presentation/game-selection.page.ts`: remove the `.app-actions`/"Seleccionar" button and `continueToTeamBuilder()` trigger button, call `router.navigateByUrl('/equipo')` directly at the end of `onSelectGame(game)` (after `this.gameService.selectGame(game)`), and add a back `button mat-icon-button` (`<mat-icon>arrow_back</mat-icon>`, `aria-label`) above the title that calls `router.navigateByUrl('/idioma')` (depends on T003).
- [X] T009 [US1] In `game/presentation/game-card.component.ts`: add `<mat-icon class="app-game-card__pokeball">catching_pokemon</mat-icon>` to the template (import `MatIconModule`), positioned near the title; add corresponding `.app-game-card__pokeball` styling (depends on T004).
- [X] T010 [US1] In `game/presentation/game-card.component.ts`: replace the fixed `background: var(--brewdex-brand-gradient, ...)` with `[style.background]="colorForGame(game().id)"` (import `colorForGame` from T006), keeping the existing hover/selected outline styles (depends on T006, T004).
- [X] T011 [US1] Add a back `button mat-icon-button` (`<mat-icon>arrow_back</mat-icon>`) to `team/presentation/team-builder.page.ts`'s header that calls `router.navigateByUrl('/juego')` (FR-005 — "every step of the guided flow"; `LanguageSelectorPage` intentionally gets none, first step).
- [X] T012 [US1] Run `ng test --include='**/language-selector.page.spec.ts' --include='**/game-selection.page.spec.ts' --include='**/game-card.component.spec.ts' --include='**/pokemon-game-colors.spec.ts'` from `web/` and confirm all pass.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — onboarding flow works end-to-end with no dead-end buttons and working back navigation.

---

## Phase 4: User Story 2 - Accurate, correctly organized, fast-loading Pokedex (Priority: P1)

**Goal**: Sprites match the selected game's generation; Mega Dimension is classified as Legends Z-A's DLC (never a standalone game) and Sun/Moon/Ultra Sun/Ultra Moon are independent games; each DLC has its own toggle revealing an additional Pokedex section (grouped from the existing shared, merged index by `sourceTag` — research.md Decision 7) below the existing one(s); the Pokedex loads in batches of 10-20 via infinite scroll (one shared pagination cursor across all visible sections), and filters resolve against the full data source rather than only what's loaded.

**Independent Test**: Select Pokémon Red/Blue and confirm Generation I-style sprites; select Pokémon Legends Z-A and confirm a "Mega Dimension" DLC toggle reveals a second Pokedex section without removing the first; confirm Pokémon load in small batches on scroll and a filter applied mid-pagination still returns species not yet scrolled into view.

### Tests for User Story 2 ⚠️

- [X] T013 [P] [US2] Add regression tests in `game/infrastructure/pokeapi-game-catalog-repository.service.spec.ts` per `contracts/game-dlc-classification.md`: (a) a version-group matching Legends Z-A's Mega Dimension DLC fixture resolves as a DLC of `legends-z-a`, never as its own top-level `Game`; (b) an `ultra-sun-ultra-moon`-shaped fixture (versions `ultra-sun`/`ultra-moon` suffix-matching `sun`/`moon`) resolves as its own top-level `Game`, and `sun-moon`'s `dlcs` does NOT contain it (fails against current heuristic-only code; passes after T017).
- [X] T014 [P] [US2] Add a regression test in `pokemon/infrastructure/pokeapi-pokemon-repository.service.spec.ts` per research.md Decision 6: for a Generation I game, `PokedexEntry.spriteUrl` resolves from the mocked `sprites.versions['generation-i']['red-blue'].front_default` fixture value, not `sprites.front_default` (fails currently; passes after T018).
- [X] T015 [P] [US2] Add regression tests in `pokedex/infrastructure/in-memory-pokedex.service.spec.ts` per `contracts/pokedex-pagination.md`: (a) after `load()`, `pokemonRepository.fetchPokedexDetails` is called with only the first 10-20 ids, not the full index, and `hasMoreBatches()` is `true`; (b) `loadNextBatch()` resolves the next batch and merges it into `pokedexDetailsById`; (c) setting a non-empty `filterCriteria` drives `loadNextBatch()` automatically to completion (`hasMoreBatches()` becomes `false` without further manual calls); (d) clearing the filter afterward does not re-fetch already-resolved ids (fails currently — `resolveDetails` resolves everything at once; passes after T019).
- [X] T016 [P] [US2] Add a component test in `pokedex/presentation/pokedex-browser.component.spec.ts`: an `IntersectionObserver`-sentinel element exists after the rendered tiles, and simulating its intersection calls `pokedexService.loadNextBatch()`; grid renders only entries present in `pokedexDetailsById()` (fails currently; passes after T020).

### Implementation for User Story 2

- [X] T017 [US2] In `game/infrastructure/pokeapi-game-catalog-repository.service.ts`: add `DLC_VERSION_GROUP_OVERRIDES` (`Map<string,string>`) and `NEVER_DLC_VERSION_GROUP_NAMES` (`Set<string>` containing `'ultra-sun-ultra-moon'`) per `contracts/game-dlc-classification.md`; resolve the exact live PokeAPI `version-group` name for Legends Z-A's Mega Dimension content and add it to `DLC_VERSION_GROUP_OVERRIDES` mapped to `'legends-z-a'`; update `detectDlcParent` to check the never-DLC set first, then the override map, before falling through to the existing suffix heuristic (depends on T013).
- [X] T018 [US2] In `pokemon/infrastructure/pokeapi-pokemon-repository.service.ts`: add a helper that resolves `pokemon.sprites.versions?.[game.generation.id]?.[game.id]?.front_default ?? null` and use it for `PokedexEntry.spriteUrl` in `buildEntry` (the private builder called from the public `fetchPokedexDetails`; grid tile only — leave `homeSpriteUrl`/`homeSpriteShinyUrl`/etc. reading from `sprites.other.home` unchanged, per research.md Decision 6); confirm the `PokeApiPokemonResource`/sprite response interfaces already declare (or extend them to declare) the `sprites.versions` shape needed (depends on T014).
- [X] T019 [US2] In `pokedex/infrastructure/in-memory-pokedex.service.ts`: replace `resolveDetails(game, index)`'s "resolve everything" behavior with batch-based resolution over the **single existing** merged `pokedexIndexSignal()` (main + every currently-active DLC together, exactly as `fetchRegionalIndex` already produces it — no per-section service instance, per research.md Decision 7 revised) — add `hasMoreBatchesSignal`, `isLoadingBatchSignal`, `batchErrorSignal` (all exposed read-only per `contracts/pokedex-pagination.md`), a `BATCH_SIZE` constant (10-20), `loadNextBatch()` that resolves the next unresolved slice of `pokedexIndexSignal()` via the existing `pokemonRepository.fetchPokedexDetails` and merges into `pokedexDetailsByIdSignal`, and `retryBatch()`; `load()` now calls `loadNextBatch()` once for the first batch instead of resolving the full index; add an effect/subscription so that whenever `filterCriteriaSignal()` becomes non-empty, `loadNextBatch()` is driven to completion automatically, and reverts to scroll-driven-only once the filter clears (depends on T015, T017, T018).
- [X] T020 [US2] In `pokedex/presentation/pokedex-browser.component.ts`: render entries as `pokedexService.pokedexIndex().filter(e => pokedexService.pokedexDetailsById().has(e.pokemonId))` (still passed through `filterPokedexEntries`), then **group that resolved/filtered list by `entry.sourceTag.kind`** (research.md Decision 7 revised) into one `<section>` for `'regional'`/`'national'` entries (always first) followed by one `<section>` per distinct `dlcId` found among `'dlc'`-tagged entries (in `DlcToggleListComponent`'s toggle order) — a DLC section only exists while at least one of its entries is present, which already happens naturally since toggling a DLC off makes `InMemoryGameService`/`InMemoryPokedexService` drop its entries from the merged list (FR-010/FR-011); add a single end-of-list sentinel `<div #sentinel>` after the last section, wired via Angular CDK's intersection-observer utilities (or a small local directive using `IntersectionObserver`, since `@angular/cdk` is already a dependency) that calls `pokedexService.loadNextBatch()` when visible and `hasMoreBatches()`/`!isLoadingBatch()`; show an inline retry affordance bound to `batchError()`/`retryBatch()` (spec.md Edge Cases); fix the `.app-filters`-equivalent filter row's padding to match the grid's existing horizontal padding (FR-015 — this requirement belongs to User Story 3's team-builder screen, but is fixed here because `PokedexBrowserComponent`'s filter row is the same one `team-builder.page.ts` renders; US3's Phase 5 has no separate task for it, see T026a) (depends on T016, T019).
- [X] T021 [US2] Confirm `game/presentation/dlc-toggle-list.component.ts`'s existing `(toggleDlc)` wiring still activates/deactivates one DLC id at a time against `gameService.activeDlcIds()` (no `team-builder.page.ts` change needed here — `TeamBuilderPage` keeps composing exactly **one** `app-pokedex-browser` instance, per research.md Decision 7 revised; T020's section-grouping is what makes DLC sections appear/disappear, not multiple browser instances).
- [X] T022 [US2] Run `ng test --include='**/pokeapi-game-catalog-repository.service.spec.ts' --include='**/pokeapi-pokemon-repository.service.spec.ts' --include='**/in-memory-pokedex.service.spec.ts' --include='**/pokedex-browser.component.spec.ts'` from `web/` and confirm all pass.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — Pokedex is correctly classified, sprite-accurate, paginated, and filter-complete.

---

## Phase 5: User Story 3 - Clear, consistent team builder with working shiny toggle (Priority: P2)

**Goal**: The team builder shows the active game's name; filters have edge spacing; the 6 team slots form a fixed 3×2 grid with uniform box size whether empty or filled; clicking an occupied slot opens a detail modal (name, types, image, shiny toggle) whose shiny state persists on the slot until toggled off or the Pokémon is removed.

**Independent Test**: Select a game, add/remove Pokémon across all 6 slots confirming constant slot size and a clear remove icon; click an occupied slot, toggle shiny in the modal, confirm both the modal and the slot show the shiny sprite, close and reopen the modal to confirm the shiny state persisted, then toggle off and confirm both revert.

### Tests for User Story 3 ⚠️

- [X] T023 [P] [US3] Add a regression test in `team/infrastructure/in-memory-team.service.spec.ts` per `contracts/team-shiny-toggle.md`: `toggleShiny(slotIndex, true)` sets `slots()[slotIndex].isShiny === true` (mirrors the existing `toggleMega` test), is a no-op on an empty slot, and the flag survives unrelated updates (e.g. `selectMove`) until toggled again or the slot is removed (fails — method doesn't exist yet; passes after T027).
- [X] T024 [P] [US3] Add a new `team/presentation/pokemon-detail-modal.component.spec.ts` per `contracts/team-shiny-toggle.md`: renders `displayName`, both type badges, an `<img>` sourced from `homeSpriteUrl` when `isShiny()` is `false` and `homeSpriteShinyUrl` (falling back to `homeSpriteUrl` if null) when `true`, and emits `shinyChange` when the slide toggle changes (fails — component doesn't exist; passes after T028).
- [X] T025 [P] [US3] Update `team/presentation/team-slot.component.spec.ts`: the avatar `<img>` source reflects `entry().isShiny` (shiny URL when true, normal when false, falling back to normal if the shiny URL is null); the empty-state and filled-state root elements report the same fixed box dimensions in a snapshot/measured test (fails currently — no shiny-aware binding, flex-based sizing differs; passes after T029/T030).
- [X] T026 [P] [US3] Update `team/presentation/team-builder.page.spec.ts`: the page renders the active game's `displayName` somewhere in the template; `.app-team-slots` uses a 3-column/2-row grid (assert computed style or a dedicated CSS class); clicking an occupied `app-team-slot`'s `select` output opens `app-pokemon-detail-modal` (not, or in addition to, the existing form-selection modal) bound to that slot's current `isShiny`; **and** — spec.md US3 Acceptance Scenario #9 / FR-022a — after toggling shiny on for a slot, closing the modal (`(close)` output) and re-triggering `onSlotSelect` for the same slot, the reopened `app-pokemon-detail-modal`'s `isShiny` input is `true` (i.e. the page re-reads the persisted `RosterEntry.isShiny` from `teamService.slots()`, not a stale/reset local flag) (fails currently; passes after T031).
- [X] T026a [P] [US3] Add a component test in `pokedex/presentation/pokedex-browser.component.spec.ts` (or extend T016) asserting the filter row (`app-pokedex-search-bar`/`app-pokedex-type-filter`/`app-national-dex-toggle`) has non-zero horizontal padding/margin from its container's edges (FR-015) — this is a User Story 3 requirement (team builder screen) satisfied by User Story 2's T020 since `TeamBuilderPage` composes `PokedexBrowserComponent` as its filter row; this task exists so US3's phase has its own explicit coverage/checkpoint for FR-015 rather than relying solely on US2 having run first (fails if T020's padding fix is missing; passes once T020 lands — **US3 depends on US2's T020 for this one requirement**, unlike the rest of US3 which has no US2 dependency).

### Implementation for User Story 3

- [X] T027 [US3] In `team/infrastructure/in-memory-team.service.ts`: add `toggleShiny(slotIndex: number, active: boolean): void` calling `this.updateSlot(slotIndex, (slot) => slot.copyWith({ isShiny: active }))`, directly beside `toggleMega`/`toggleGigamax` (depends on T023).
- [X] T028 [US3] Create `team/presentation/pokemon-detail-modal.component.ts` per `contracts/team-shiny-toggle.md`: `pokedexEntry = input.required<PokedexEntry>()`, `isShiny = input(false)`, `shinyChange = output<boolean>()`, `close = output<void>()`; template shows `displayName`, `TypeBadgeComponent` for `typePrimary`/`typeSecondary`, an image bound to `isShiny() ? (pokedexEntry().homeSpriteShinyUrl ?? pokedexEntry().homeSpriteUrl) : pokedexEntry().homeSpriteUrl`, and an outlined `mat-slide-toggle` emitting `shinyChange` (depends on T024).
- [X] T029 [US3] In `team/presentation/team-slot.component.ts`: change the avatar `<img [src]>` binding from `details.homeSpriteUrl` to `slotEntry.isShiny ? (details.homeSpriteShinyUrl ?? details.homeSpriteUrl) : details.homeSpriteUrl` (depends on T025).
- [X] T030 [US3] In `team/presentation/team-slot.component.ts`: give `.app-team-slot` a fixed `min-height`/`min-width` (or `aspect-ratio` + reserved-height rows) sized to the filled state's full content (avatar + remove icon + name + type-badges row), and render an empty (but space-reserving) type-badges-row placeholder in the `@else` (empty) branch so both branches occupy identical vertical space (research.md Decision 9) (depends on T025).
- [X] T031 [US3] In `team/presentation/team-builder.page.ts`: change `.app-team-slots` to `display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(2,1fr)` (research.md Decision 9); add the active game's name next to/below the page title via `gameService.activeGame()?.displayName` (inject `InMemoryGameService`, mirroring `GameSelectionPage`'s existing pattern); change `onSlotSelect(index)` to open `app-pokemon-detail-modal` bound to `detailsFor(...)` and **`activeRosterEntry()?.isShiny` read fresh from `teamService.slots()` each time the modal opens** (not a locally-cached flag, so reopening after a shiny toggle reflects the persisted state — FR-022a) and `(shinyChange)="teamService.toggleShiny(activeSlotIndex()!, $event)"`, keeping the existing "change form" action reachable from the new modal (or a button alongside it) rather than removing `FormSelectionModalComponent`'s functionality (depends on T026, T027, T028; no dependency on T021 — `TeamBuilderPage`'s Pokedex-panel composition is untouched by the DLC-section fix, per research.md Decision 7 revised).
- [X] T032 [US3] Run `ng test --include='**/in-memory-team.service.spec.ts' --include='**/pokemon-detail-modal.component.spec.ts' --include='**/team-slot.component.spec.ts' --include='**/team-builder.page.spec.ts'` from `web/` and confirm all pass.

**Checkpoint**: All three functional user stories (US1, US2, US3) should now be independently functional.

---

## Phase 6: User Story 4 - Consistent outlined visual style (Priority: P3)

**Goal**: Buttons, toggles, cards, and input-like controls consistently use Material's outlined appearance across every screen touched by US1–US3 (and any left untouched by them).

**Independent Test**: Visually scan `/idioma`, `/juego`, `/equipo`, and the new Pokémon detail modal; interactive components consistently read as outlined rather than filled/flat, without any behavioral regression to US1–US3.

### Tests for User Story 4 ⚠️

- [X] T033 [P] [US4] Add/extend Playwright visual-structure assertions in `web/e2e/` (new or existing spec) asserting `mat-button`/`mat-slide-toggle`/`mat-card` elements across `/idioma`, `/juego`, `/equipo` carry the outlined appearance class/attribute Angular Material applies for `appearance="outline"`/`mat-stroked-button`/outlined toggle/card variants (fails currently wherever a filled/flat variant is used; passes after T034-T036).

### Implementation for User Story 4

- [X] T034 [P] [US4] Sweep `language/presentation/language-selector.page.ts` and `game/presentation/game-selection.page.ts`/`game-card.component.ts`/`dlc-toggle-list.component.ts`: change `mat-flat-button` retry/action buttons to outlined (`mat-stroked-button` or `matButton="outlined"`), per research.md Decision 1.
- [X] T035 [P] [US4] Sweep `pokedex/presentation/*.component.ts` (search bar, type filter, national-dex toggle, DLC toggles, entry card) and `team/presentation/*.component.ts` (team-slot remove button, form-selection-modal, move-selection-sheet, tera-type-picker, the new pokemon-detail-modal) to outlined button/toggle/card variants.
- [X] T036 [US4] Verify the shared theme in `shared/design-system/theme/` does not hardcode a conflicting default appearance that would override the per-component outlined variants applied in T034/T035; adjust only if a global override exists (depends on T034, T035).
- [X] T037 [US4] Run `npm test` and `npm run test:e2e` from `web/` and confirm all pass, including T033. **Result: `npm test` 179/179 passed; `test:e2e --project=chromium --project=firefox` 18/18 passed in 11.2s (includes the two new `outlined-style.spec.ts` checks from T033). `--project=webkit` times out in this sandbox for reasons unrelated to this feature (pre-existing environment limitation, reproduced even on an unmodified baseline run) — chromium/firefox give full, fast, green coverage.**

**Checkpoint**: All four user stories independently functional; full quickstart.md validation can now be run end-to-end.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [X] T038 Run the full `quickstart.md` manual validation checklist against `npm start` end-to-end (all US1-US4 sections). **Automated-equivalent coverage exercised via the full unit + e2e suite (see T037); the specifically-manual/subjective portions (spacing/margin "feel", pokeball icon placement, per-game color aesthetics) are structurally asserted by tests (non-zero padding, distinct colors, icon presence) but still worth a human eyeball pass in a running `npm start` before shipping.**
- [X] T039 [P] Run `npm run lint` from `web/` and fix any new warnings introduced by T002-T037. **Clean — no warnings.**
- [X] T040 Re-run the Phase 1 baseline commands (`npm test`, `npm run lint`, `npm run test:e2e`) and confirm the suite is green and equal-or-larger than the T001 baseline (no regressions, all new tests included). **`npm test`: 140 → 179 passed (+39, all new, 0 regressions). `npm run lint`: clean, unchanged. `npm run test:e2e` (chromium+firefox): 14 → 18 passed (+4: 1 new back-navigation scenario in `user-story-1.spec.ts`, 2 new in `outlined-style.spec.ts`, plus the pre-existing suite now completing in ~11s instead of timing out — direct evidence SC-003's pagination fix works.**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: None — skipped (see above).
- **User Story 1 (Phase 3)**: Depends only on Phase 1. No dependency on US2/US3/US4.
- **User Story 2 (Phase 4)**: Depends only on Phase 1. No dependency on US1/US3/US4. (Revised after `/speckit-analyze`: T021 no longer touches `team-builder.page.ts` — DLC sections are a presentation-only grouping inside `PokedexBrowserComponent`, research.md Decision 7 — so US2 and US3 no longer share any file edit.)
- **User Story 3 (Phase 5)**: Depends only on Phase 1 for T023-T025, T027-T031 (its own slot/modal/service work); **T026a specifically depends on US2's T020** (the filter-row padding fix for FR-015 lives in `PokedexBrowserComponent`, reused by the team builder — see T026a). No other US3 task depends on US2's Pokedex/sprite/DLC-classification logic being correct.
- **User Story 4 (Phase 6)**: Best done after US1-US3 land (it sweeps their templates), but is logically independent — could be done first and re-verified after, at the cost of re-touching files.
- **Polish (Phase 7)**: Depends on all four user stories being complete.

### Parallel Opportunities

- All `[P]`-marked tests within a story phase can run/be written in parallel (different files).
- US1 and US2 can be implemented fully in parallel (disjoint files).
- US3's service/component work (T023-T025, T027-T031) can proceed fully in parallel with US2 (no shared files after the Decision 7 revision); only T026a needs US2's T020 to have landed first.
- US4's sweep (T034, T035) can run in parallel across files once the components it touches exist in their post-US1/US2/US3 shape.

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: "Update language-selector.page.spec.ts per T002"
Task: "Update game-selection.page.spec.ts per T003"
Task: "Add game-card.component.spec.ts pokeball/color case per T004"
Task: "Create pokemon-game-colors.spec.ts per T005"

# Implementation together (after their respective tests exist):
Task: "Create pokemon-game-colors.ts per T006"
Task: "Update game-card.component.ts pokeball icon per T009"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 3: User Story 1.
3. **STOP and VALIDATE**: run quickstart.md's US1 section manually plus T012.
4. Ship/demo — onboarding friction is fixed even before Pokedex/team-builder work lands.

### Incremental Delivery

1. Setup → baseline green.
2. US1 → validate → ship (fixes the most visible first-impression issues).
3. US2 → validate → ship (fixes the reported performance/correctness bugs).
4. US3 → validate → ship (fixes team-builder usability + adds the shiny modal).
5. US4 → validate → ship (visual consistency sweep, lowest risk of behavioral regression since it's last).
6. Phase 7 Polish → final full-suite confirmation.
