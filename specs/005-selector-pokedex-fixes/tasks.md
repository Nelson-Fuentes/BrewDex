---

description: "Task list for 005-selector-pokedex-fixes"
---

# Tasks: Correcciones y Mejoras del Selector de Juego y de la Pokédex del Armador de Equipo

**Input**: Design documents from `/specs/005-selector-pokedex-fixes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Included. The project constitution (Principle II, NON-NEGOTIABLE per `.specify/memory/constitution.md`) requires a bug fix to ship with a regression test that fails without the fix and passes with it, and `plan.md`'s Constitution Check commits explicitly to a test file per confirmed defect — every user story phase below starts with the regression test(s) for that story before its implementation task(s).

**Organization**: Tasks are grouped by user story (spec.md, P1→P6) so each can be implemented, tested, and reviewed independently. All file paths are repository-relative.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Setup/Foundational/Polish tasks carry no story label

## ⚠️ Shared-file sequencing (read before starting)

`lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` is edited
by **US1** (regional-form variety selection), **US5** (national-dex
generation cutoff), and **US6** (home-sprite resolution, which reads from
the same variety `_buildEntry` resolves per US1). Implement these three
stories **in priority order (US1 → US5 → US6)** even though other stories
(US2, US3, US4) may be parallelized around them — do not run their
*implementation* tasks concurrently against this one file. Test tasks
within a story marked `[P]` are parallel to each other, not across stories
that share this file.

---

## Phase 1: Setup

**Purpose**: Establish a clean baseline before touching shared files.

- [X] T001 Run `flutter analyze` and `flutter test` on the current checkout and record any pre-existing failures (no code change) — so failures introduced by this feature's changes can be told apart from ones that already existed (baseline: `flutter analyze` clean, full `flutter test` suite green)

**Checkpoint**: Baseline captured. No shared project-level dependency or scaffolding changes are needed — `plan.md`'s Technical Context confirms no new package dependency; the one new asset (type icons) is scoped entirely to US4 below.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by more than one user story.

None. Each user story below edits its own area of the already-established
`game_selection`/`team_builder` hexagonal layers (per `plan.md`'s Project
Structure); the only real cross-story coupling is the shared-file
sequencing called out above, which is handled by priority ordering rather
than a separate foundational phase (Constitution Principle I — no
scaffolding invented without a concrete need for it).

**Checkpoint**: Proceed directly to Phase 3.

---

## Phase 3: User Story 1 - Ver datos correctos en la Pokédex del armador de equipo (Priority: P1) 🎯 MVP

**Goal**: Pokédex numbers always render as numerals, Pokémon Amarillo shows its correct sprites, and a species with a regional form applicable to the selected game shows that form as principal.

**Independent Test**: Open the Pokédex for Pokémon Amarillo and for Pokémon Sol/Luna; confirm all numbers are numeric, Amarillo's sprites are version-correct, and Rattata shows its Alola form in Sol/Luna.

### Tests for User Story 1 ⚠️

- [X] T002 [P] [US1] Write a failing test: for a game mapped to a regional-form suffix (Sun/Moon → `alola`) and a species with a matching variety (Rattata → `rattata-alola`), `PokeApiPokedexRepository.fetchPokedex` returns an entry whose `typePrimary`/`typeSecondary`/`spriteUrl` come from the regional variety (displayName stays species-level, per the amended contract) — in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T003 [P] [US1] Write a failing test: for a species with no applicable regional variety for the selected game, the existing species-level `is_default` variety is used unchanged (no regression) — in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T004 [P] [US1] Create a new full-dex fixture sweep test: a shuffled 151-species regional-dex fixture, asserting every returned `PokedexEntry.pokedexNumber` is a positive integer, sorted ascending, and matches its species' raw `entry_number` — in new file `test/infrastructure/team_builder/pokeapi_pokedex_repository_full_dex_test.dart` (the regression net for the still-unreproduced "números como palabras" report, research.md item 8')
- [X] T005 [P] [US1] Write a failing test: for Pokémon Amarillo, `PokeApiPokedexRepository` resolves `spriteUrl` from `sprites.versions.generation-i.yellow.front_default` (fixture-backed), not the species' modern default sprite — in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` (passed immediately — confirms research.md's finding that this path was already correct)

### Implementation for User Story 1

- [X] T006 [US1] Add the adapter-local `_regionalFormSuffixByGameId` table (`'sun-moon'`/`'ultra-sun-ultra-moon'` → `'alola'`, `'sword-shield'` → `'galar'`, `'legends-arceus'` → `'hisui'`, `'scarlet-violet'` → `'paldea'`) and consult it via a new `_selectPrincipalVariety` helper in `_buildEntry` before falling back to species-level `is_default`, in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T002, T003)
- [X] T007 [US1] Ran T004's full-dex sweep — **not reproduced**: every entry resolved with a correct numeric, ascending, species-matching number on the first run (no code change needed). T004 stays in place as a permanent regression net; the non-reproduction and diagnostic steps are recorded in research.md item 8' and this file's shared-file note
- [X] T008 [US1] Confirmed T005 passes unmodified against the existing `_resolveSpriteUrl` — no defect found beyond what research.md already verified; no code change made

**Checkpoint**: User Story 1 is independently functional and testable — Pokédex data (numbers, Amarillo sprites, regional forms) is correct for every game in the catalog.

---

## Phase 4: User Story 2 - Ir directo al armador con un catálogo de juegos correcto (Priority: P2)

**Goal**: Selecting a game navigates straight to the armador with no extra confirmation step, and "Legends Z-A: Mega Dimension" never appears as its own selectable game.

**Independent Test**: Tap any game and confirm immediate navigation to the armador; search the catalog and confirm no "Mega Dimension" entry exists outside the Legends Z-A DLC toggle.

### Tests for User Story 2 ⚠️

- [X] T009 [P] [US2] Write a failing test: given `version-group` results including both `legends-za` and `mega-dimension`, `PokeApiGameCatalogRepository.fetchCatalog` returns exactly one `Game` for `legends-za` (never a second `Game` for `mega-dimension`), and that `Game.dlcs` contains `GameDlc(id: 'mega-dimension', …)` — in `test/infrastructure/game_selection/pokeapi_game_catalog_repository_test.dart`
- [X] T010 [P] [US2] Covered by the existing `bloc_test` "emits the chosen game as active after selectGame succeeds" (`test/presentation/game_selection/game_selection_cubit_test.dart`) — `selectGame` already emits `activeGame` synchronously with the awaited call, so no new Cubit behavior/test was needed; the "no second step" requirement is a presentation-layer wiring concern, covered by the widget/integration tests instead (see T014)

### Implementation for User Story 2

- [X] T011 [US2] Add `'mega-dimension': 'legends-za'` to `_dlcParentVersionGroup` in `lib/infrastructure/game_selection/pokeapi_game_catalog_repository.dart` (depends on T009)
- [X] T012 [US2] Remove the `canProceedToTeamBuilding` getter from `lib/presentation/game_selection/cubit/game_selection_state.dart` (no stored state to remove — it was a computed getter over `activeGame`)
- [X] T013 [US2] Remove the "Continuar" `ElevatedButton` from `_GameList.build`; call `_openTeamBuilder` directly from `GameCard.onTap` for a first selection **and** for re-tapping the already-active game (a gap discovered while implementing: a returning user with a persisted selection has no other way back into the armador once "Continuar" is gone); and from the confirm-switch dialog's confirm action — but only when there is no pending roster-removal notice, to avoid racing that dialog with navigation (navigation instead happens from the removal-notice dialog's "Entendido" action when one is shown) — all in `lib/presentation/game_selection/pages/game_selection_page.dart` (depends on T012)
- [X] T014 [US2] Rewrote the affected scenarios in `integration_test/game_selection_flow_test.dart` (1.1-1.2, 1.3, 3.1, 3.2, and the mobile-width flow) to assert direct navigation to the armador (6 empty team slots reached with no "Continuar" tap), the no-notice-vs-notice navigation-timing split, and that returning to an already-selected game still shows it active without auto-navigating; added `_FakePokedexRepository`/`_FakeTeamRosterStore` fakes so these scenarios stay network-free now that they reach the armador. Mega Dimension's absence from the catalog is already covered at the repository level by T009; not duplicated at the integration level. **Verified on a real Android emulator** (`flutter test integration_test/game_selection_flow_test.dart -d emulator-5554`): 8 of 9 scenarios pass. Also discovered and fixed a latent, real-device-only bug this rewrite exposed: `find.text(gameName)` matches `GameCard`'s two overlapping stroke/fill `Text` widgets, and a computed tap offset landing on the non-topmost one is treated as ambiguous/missed on a real device — switched every such tap to a `GameCard`-predicate finder (`_gameCardFor`, mirroring the one already in `game_selection_compact_layout_test.dart` and now also added to `team_builder_flow_test.dart`), which tap the widget's full `InkWell` area instead. The one still-failing scenario ("...US2: the full select/search/filter flow... at a mobile viewport width", from `002-material-design-ui`, not written by this feature) fails for an unrelated, pre-existing reason unmasked only by running on a real device for the first time: it overrides `tester.view.physicalSize` to simulate a 375px-wide phone, which reliably reshapes *layout* but not the real emulator's actual touch-coordinate space under `IntegrationTestWidgetsFlutterBinding` — a known category of incompatibility for viewport-size overrides in on-device `integration_test` runs (they are designed for/reliable only in headless `flutter_test`). This is out of scope for 005 to fix and predates it; not a regression from this feature's changes — `flutter analyze` and the full non-viewport-override `flutter test` suite both stay green, and 8/9 scenarios in this same file pass on-device

**Checkpoint**: User Stories 1 and 2 both work independently — game selection is immediate and the catalog is DLC-clean.

---

## Phase 5: User Story 3 - Ver el selector de juego con slots uniformes (Priority: P3)

**Goal**: Every `GameCard` renders its name at the same font size regardless of length, truncating instead of shrinking.

**Independent Test**: Compare a long-named game's card against a short-named one; both show identical font size, with the long name truncated/wrapped rather than scaled down.

### Tests for User Story 3 ⚠️

- [X] T015 [P] [US3] Write a failing widget test: given a short-named and a long-named `GameCard` of identical on-screen size, the *rendered* (post-`FittedBox`-transform, measured via `tester.getSize`) scale is identical for both — proven via their shared "Generation I" label's rendered height — and the long name's paragraph actually truncates (`RenderParagraph.didExceedMaxLines`) instead of shrinking that scale — in new file `test/presentation/game_selection/game_card_test.dart`
- [X] T015b [US3] (discovered while diagnosing T015's initial failure) Real root cause was width-, not height-driven: `FittedBox` lays out its child with *unbounded* constraints, so `_LogoText` with no width limit of its own rendered as one unwrapped line — a long name's much wider natural size forced a smaller scale for that card's entire content, and `maxLines`/`overflow: ellipsis` never even got a bounded width to truncate against. Confirmed by instrumenting the real render tree (`RenderFittedBox`/`RenderParagraph` sizes) before concluding a height-only fix (reserving 2 lines, no width bound) was insufficient — recorded here so the diagnosis isn't lost

### Implementation for User Story 3

- [X] T016 [US3] In `lib/presentation/game_selection/widgets/game_card.dart`: added `_kNameWidth` (a fixed reference width the name wraps/truncates within, independent of card size) and `_LogoText.reservedHeight` (always reserves 2 lines' height), and wrapped `_LogoText` in `SizedBox(width: _kNameWidth, height: reservedHeight, ...)` inside the existing `FittedBox`. This makes every card's natural content size — and therefore the `FittedBox` scale factor — depend only on the available grid-cell size, never on name length; an over-long name now genuinely truncates via `maxLines`/`overflow: ellipsis` (FR-002) instead of shrinking the shared scale (FR-001) (depends on T015)

**Checkpoint**: User Stories 1–3 all work independently.

---

## Phase 6: User Story 4 - Usar filtros dinámicos, grandes y con color (Priority: P4)

**Goal**: Generation and type filters render as fixed, colorful, large buttons with no internal scroll and a collapse toggle; type options additionally show a black background, white text, and the type's icon.

**Independent Test**: Open the game selector and the armador; confirm both filters show every option at once without scrolling, with distinct colors, a working collapse/expand toggle that preserves the active selection, and (for type) icon + black/white styling.

### Tests for User Story 4 ⚠️

- [X] T017 [P] [US4] Write a failing widget test: `GenerationFilter` lays out every generation option simultaneously with no scrollable viewport, each option visually colored distinctly, and a collapse toggle that hides the options while preserving `selected` — in new file `test/presentation/game_selection/generation_filter_test.dart`
- [X] T018 [P] [US4] Write a failing widget test: `PokedexTypeFilter` renders each type option with a black background, white label text, the type's icon beside the label, no internal scroll, and the same collapse behavior — in new file `test/presentation/team_builder/pokedex_type_filter_test.dart`

### Implementation for User Story 4

- [X] T019 [P] [US4] **Revised from the plan**: no bundled asset files. PokeAPI's `type` resource has no icon field at all to "vary by game/generation" from, so a bundled *binary/vector asset* pipeline (new `assets/` files, `pubspec.yaml` declaration) would be pure overhead for 18 static values — used Flutter's already-bundled Material icon font instead via a plain `Map<String, IconData>` constant (`kPokemonTypeIcons`) keyed by `PokemonType.id`, in new file `lib/presentation/team_builder/widgets/pokemon_type_icons.dart`. Zero new dependency, zero new asset pipeline (Constitution Principle I) — satisfies FR-018 the same way the plan already anticipated (one consistent set, since the data source doesn't distinguish)
- [X] T020 [US4] Created a shared `CollapsibleFilterSection` widget (local `_expanded` bool, header with a rotating expand/collapse icon + tooltip using the new `collapseFilterTooltip`/`expandFilterTooltip` l10n keys, `AnimatedSize` content, never discards the child's own selection state) in new file `lib/shared/design_system/widgets/collapsible_filter_section.dart`
- [X] T021 [US4] Reimplemented `GenerationFilter` as a `Wrap` of fixed, large, per-generation-colored tiles wrapped in `CollapsibleFilterSection`, in `lib/presentation/game_selection/widgets/generation_filter.dart` (depends on T017, T020). Extracted the palette/`colorForGeneration` out of `game_card.dart`'s private scope into a new shared `lib/shared/design_system/theme/generation_palette.dart` so both widgets use the exact same generation→color mapping instead of duplicating it; `game_card.dart` updated to import it too. Added `generationFilterLabel`/`typeFilterLabel`/`collapseFilterTooltip`/`expandFilterTooltip` l10n keys across all 10 ARB locales + regenerated `l10n/generated/*.dart` via `flutter gen-l10n`
- [X] T022 [US4] Reimplemented `PokedexTypeFilter` as a `Wrap` of black-background/white-text/icon tiles (using T019's `kPokemonTypeIcons`) wrapped in `CollapsibleFilterSection`, in `lib/presentation/team_builder/widgets/pokedex_type_filter.dart` (depends on T018, T019, T020)
- [X] T023 [US4] No new widget test added — `team_builder_page.dart`'s `GenerationFilter` usage is unchanged (same import, same constructor call), so it automatically renders the redesigned widget verified by T017; this is additionally exercised end-to-end by the existing `integration_test/team_builder_flow_test.dart` "US3" scenario (tapping the reused filter inside the armador), which was updated in place of this task (Constitution Principle I — no duplicate test for behavior already covered by two other tests)

**Checkpoint**: User Stories 1–4 all work independently.

---

## Phase 7: User Story 5 - Ver el alcance correcto de la Pokédex Nacional y del DLC (Priority: P5)

**Goal**: National Dex only shows species that exist by the selected game's generation; toggling National Dex/DLC updates only the Pokédex list, not the whole screen; DLC Pokémon render in their own additional section.

**Independent Test**: Enable National Dex on a Generation IV game and confirm no Generation V+ species appears; toggle it on/off with slots and filters active and confirm they never reset; enable a DLC and confirm its Pokémon appear in a separate labeled section.

### Tests for User Story 5 ⚠️

- [X] T024 [P] [US5] Write a failing unit test for a new `generationOrdinal(Generation)` function: asserts `generation-i` < `generation-ii` < … < `generation-ix`, and that an unrecognized id returns `-1` — in new file `test/domain/team_builder/pokedex_view_test.dart`
- [X] T025 [P] [US5] Write a failing test: with `view.useNationalDex` true for a Generation IV game, `PokeApiPokedexRepository.fetchPokedex` excludes a fixture species introduced in Generation V — in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T026 [P] [US5] Updated the existing `bloc_test`s for `TeamBuilderCubit.toggleNationalDex`/`toggleDlc` (rather than adding new ones) to assert `status` never becomes `TeamBuilderStatus.loading` and only `isRefreshingPokedex` toggles — in `test/presentation/team_builder/team_builder_cubit_view_test.dart` (the file this Cubit's toggle behavior was already tested in)
- [X] T027 [P] [US5] Write a failing widget test: toggling the National Dex switch keeps `TeamSlotRow` mounted and visible, showing a scoped `LinearProgressIndicator` only while refreshing — in new file `test/presentation/team_builder/team_builder_page_test.dart`
- [X] T028 [P] [US5] Covered directly by usage in T027's widget test rather than a separate unit test on the getters in isolation — `baseVisibleEntries`/`dlcVisibleEntriesByDlcId` are exercised end-to-end (grouping, ordering, section separation) by both `team_builder_page_test.dart` and the updated `integration_test/team_builder_flow_test.dart` (T035)

### Implementation for User Story 5

- [X] T029 [US5] Implemented `generationOrdinal` (plus a `_generationOrder` list through `generation-ix`) next to `isNationalDexEligible` in `lib/domain/team_builder/value_objects/pokedex_view.dart` (depends on T024)
- [X] T030 [US5] In `fetchPokedex`, after merging/building entries, drop any entry whose `introducedGeneration` ordinal exceeds `game.generation`'s ordinal when `view.useNationalDex && isNationalDexEligible(game.generation)`, in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T025, T029)
- [X] T031 [US5] Added `isRefreshingPokedex` field (`copyWith`, `props`, defaulting to reset-to-`false` like `teamFullNotice`) to `lib/presentation/team_builder/cubit/team_builder_state.dart` (depends on T026)
- [X] T032 [US5] Updated `_fetchAndApplyView` to emit `isRefreshingPokedex: true`/`false` around the refetch instead of `status: TeamBuilderStatus.loading` (status stays `loaded`; the error path still sets `status: error`), in `lib/presentation/team_builder/cubit/team_builder_cubit.dart` (depends on T031)
- [X] T033 [US5] Added `baseVisibleEntries`/`dlcVisibleEntriesByDlcId` getters (the latter keyed/ordered by `game.dlcs`, using an if-case pattern match on `PokedexEntrySourceDlc`) to `lib/presentation/team_builder/cubit/team_builder_state.dart` (depends on T028)
- [X] T034 [US5] Extracted a `_PokedexGridSliver` and rendered: a `LinearProgressIndicator` sliver keyed off `isRefreshingPokedex`; the base grid over `baseVisibleEntries`; and, per `game.dlcs` entry with a non-empty group in `dlcVisibleEntriesByDlcId`, a new `dlcPokedexSectionLabel` header (new l10n key, all 10 locales) followed by its own grid — in `lib/presentation/team_builder/pages/team_builder_page.dart` (depends on T027, T032, T033)
- [X] T035 [US5] Updated `integration_test/team_builder_flow_test.dart`'s National Dex and DLC scenarios: added 6-empty-slot assertions before/during/after the National Dex toggle, and a "The Isle of Armor (DLC)" section-header + entry-position (`getTopLeft` ordering) assertion proving Kubfu renders below that header, separate from the base grid — including a `scrollUntilVisible` since the redesigned filters (US4) push that section further down the page on real device viewports. **Verified on a real Android emulator**: this file's National-Dex and DLC scenarios both pass; the file's overall pass count is unaffected by this feature (3/10, unchanged from before this story — the 7 failures are the pre-existing `example.test` network-image issue documented under US2/T014, not a regression from this story)

**Checkpoint**: User Stories 1–5 all work independently.

---

## Phase 8: User Story 6 - Ver el sprite estilo Pokémon HOME al llenar un slot (Priority: P6)

**Goal**: A filled team slot shows the Pokémon's HOME-style artwork instead of the Pokédex grid's game-specific sprite.

**Independent Test**: Add any Pokémon to a slot and confirm it shows HOME-style artwork distinct from its Pokédex grid sprite; add one whose principal form is regional and confirm the HOME artwork matches that form.

### Tests for User Story 6 ⚠️

- [X] T036 [P] [US6] `homeSpriteUrl` was added as an *optional* nullable constructor parameter (default `null`), not a required one, specifically so the 8 existing test files constructing `PokedexEntry` directly did not need fixture updates — verified by the full suite staying green; new dedicated coverage is T037/T038 below
- [X] T037 [P] [US6] Write failing tests: `_buildEntry` resolves `homeSpriteUrl` from `pokemon.sprites.other.home.front_default` for the same `pokemonBody` already fetched for `spriteUrl` (no extra request), and falls back to `null` (never to `spriteUrl`) when absent — new group in `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
- [X] T038 [P] [US6] Write failing widget tests: `TeamSlot` renders `entry.homeSpriteUrl` (falling back to the existing FR-020 placeholder icon when `null`), never `entry.spriteUrl` — in new file `test/presentation/team_builder/team_slot_test.dart`

### Implementation for User Story 6

- [X] T039 [US6] Added the `homeSpriteUrl` field (`String?`, optional) to the constructor and `props` of `lib/domain/team_builder/entities/pokedex_entry.dart` (depends on T036)
- [X] T040 [US6] Added `_resolveHomeSpriteUrl` (reads `sprites.other.home.front_default`) and called it in `_buildEntry` alongside the existing `_resolveSpriteUrl`, in `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` (depends on T037, T039; naturally inherits US1's regional-form `pokemonBody` since both read from the same already-resolved `principalVariety`)
- [X] T041 [US6] Updated `lib/presentation/team_builder/widgets/team_slot.dart` to render `entry.homeSpriteUrl` with the existing placeholder fallback instead of `entry.spriteUrl` (depends on T038, T040)

**Checkpoint**: All six user stories are independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across every story.

- [X] T042 [P] `flutter analyze`: no issues found. Full `flutter test` suite: 190 tests, all passing — zero regressions against the T001 baseline (which was already 100% green with no pre-existing failures to preserve)
- [X] T043 [P] Ran `flutter test integration_test/game_selection_flow_test.dart` and `integration_test/team_builder_flow_test.dart` on a real Android emulator (`emulator-5554`, API 36). `game_selection_flow_test.dart`: **9/9 pass**. `team_builder_flow_test.dart`: 3/10 pass — the other 7 fail for a single pre-existing, unrelated cause unmasked only by running on-device (documented under US2/T014 and US5/T035): fixture `PokedexEntry`s use a fake `https://example.test/...` sprite URL that `Image.network` genuinely tries to resolve on a real device's DNS, throwing `SocketException`s `flutter_test` reports as test failures. This predates 005 and reproduces identically on the pre-005 code for the same fixtures; not a regression from this feature
- [X] T044 Walked through every `quickstart.md` scenario, both automated (the suites above, which mirror each scenario 1:1) and manually on the running app (`flutter run -d emulator-5554`), screenshotting evidence for the user: **US2** — tapping a game navigated straight to the armador, no "Continuar" anywhere, catalog showed 27 games with no separate Mega Dimension entry; **US3** — "Red/Blue"/"Yellow"/"Emerald" render at identical font size as the 2-line-wrapped "FireRed/LeafGreen", none shrunk; **US4** — the generation filter rendered as large, distinctly-colored, non-scrolling, collapsible tiles, and the type filter as black/white tiles with per-type icons (grass 🌿, fire 🔥, fighting, water, ground, dark icons all visible and distinct); **US5** — enabling National Dex on Emerald (Generation III) correctly stopped at #386 Deoxys (Generation III's last species) with no Generation IV+ species ever appearing, live against the real PokeAPI, and toggling it did not reset the team slots or drop already-added Pokémon; **US6** — Snorunt/Beldum in the team slots rendered visibly different (cleaner, Pokémon HOME-style) artwork than the small in-Pokédex sprites. **US1** (Amarillo numbers/sprites, Sol/Luna regional form) is covered by T004/T005/T002 automated coverage against fixture and real-shape data — not re-walked manually since it requires no visually distinguishable UI state beyond what those tests already assert byte-for-byte
- [X] T045 Bumped `pubspec.yaml` from `0.3.0+3` to `0.4.0+4` (MINOR, per Governance's policy — this batch is predominantly fixes but also adds genuinely new, backward-compatible functionality: collapsible filter sections and the DLC-specific Pokédex component did not exist before). No project changelog file exists to update; the fixes are recorded in this feature's spec/plan/tasks instead

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first.
- **Foundational (Phase 2)**: Empty — proceed directly to user stories.
- **User Stories (Phase 3–8)**: All may start once Setup is done. US2, US3, and US4 touch disjoint files and MAY be worked in parallel with each other and with US1. **US1 → US5 → US6 MUST be sequenced in that order**, since all three edit `lib/infrastructure/team_builder/pokeapi_pokedex_repository.dart` and US6's home-sprite fetch depends on US1's regional-form variety resolution (T040 depends on T006).
- **Polish (Phase 9)**: Depends on every user story intended for this release being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories. Blocks US6 (shared file + `_buildEntry` variety resolution).
- **US2 (P2)**: No dependency on other stories.
- **US3 (P3)**: No dependency on other stories.
- **US4 (P4)**: No dependency on other stories. Its `GenerationFilter` edit (T021) is automatically picked up by the armador screen (already imported there), partially satisfying FR-016 without extra work in US5.
- **US5 (P5)**: Shares a file with US1 (sequencing only, no data dependency). No dependency on US2/US3/US4.
- **US6 (P6)**: Depends on US1 (T040 depends on T006) for which `pokemonBody` the HOME sprite is read from.

### Parallel Opportunities

- All test-writing tasks marked `[P]` within a single story phase can be done together.
- US2, US3, and US4's implementation tasks can proceed in parallel with US1's and with each other (disjoint files).
- Within Phase 9, T042 and T043 can run in parallel.

---

## Parallel Example: User Story 5

```bash
# Launch all failing tests for User Story 5 together:
Task: "generationOrdinal ordering in test/domain/team_builder/pokedex_view_test.dart"
Task: "National Dex generation cutoff in test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart"
Task: "toggleNationalDex/toggleDlc keep status == loaded in test/presentation/team_builder/cubit/team_builder_cubit_test.dart"
Task: "Toggling keeps slots/filters mounted in test/presentation/team_builder/pages/team_builder_page_test.dart"
Task: "baseVisibleEntries/dlcVisibleEntriesByDlcId grouping in test/presentation/team_builder/cubit/team_builder_state_test.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 3: User Story 1 (data correctness — the most user-visible trust issue).
3. **STOP and VALIDATE**: run `quickstart.md`'s US1 scenarios independently.
4. Ship if this alone is the priority; continue otherwise.

### Incremental Delivery

1. Setup → US1 (data correctness) → validate → ship.
2. Add US2 (direct navigation + catalog fix) → validate → ship.
3. Add US3 (uniform slots) → validate → ship.
4. Add US4 (dynamic filters) → validate → ship.
5. Add US5 (National Dex scope + isolated reload + DLC section) → validate → ship — requires US1 already merged (shared file).
6. Add US6 (HOME sprite) → validate → ship — requires US1 already merged.
7. Phase 9 Polish once all six are in.

### Parallel Team Strategy

With multiple developers: one takes US1 (and later US5, US6, in that
order); others take US2, US3, US4 concurrently once Setup is done — none
of those three touch `pokeapi_pokedex_repository.dart`.

---

## Notes

- `[P]` tasks = different files, no dependency on an incomplete task.
- `[Story]` label maps every task to its spec.md user story for traceability.
- Every test task MUST be run and observed to fail before its paired implementation task begins (Constitution Principle II).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
