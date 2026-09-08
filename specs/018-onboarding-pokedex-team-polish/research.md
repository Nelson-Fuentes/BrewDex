# Research: Onboarding, Pokedex & Team Builder Polish

## Decision 1 — Outlined Material style is a token/appearance sweep, not a rebuild

**Decision**: Standardize on Angular Material's `appearance="outline"` (form fields) and outlined button/toggle variants (`mat-stroked-button`/`matButton="outlined"`, `MatButtonToggle` outlined defaults, `mat-card-outlined` class) across all standalone components already listed under `web/src/**/presentation/`. No new design-system package.

**Rationale**: The app already runs on Angular Material 18 (per `specs/017-migracion-angular/plan.md`) with a shared theme in `shared/design-system/theme/`. "Material UI outlined" is Material's own outlined appearance, already the dominant look for form-like controls; this is a targeted appearance/CSS pass over existing components (buttons, `mat-slide-toggle`, cards), consistent with Constitution Principle I (no new dependency, no new abstraction).

**Alternatives considered**: A parallel "outlined" theme overlay/config — rejected, adds an abstraction layer YAGNI doesn't justify for a purely visual, sweep-style change.

## Decision 2 — Onboarding flow: single-click advance + back, no new store

**Decision**: Remove the trailing "Continue"/"Select" buttons in `LanguageSelectorPage` and `GameSelectionPage`; trigger navigation directly from the existing `select`/`(click)` handlers already wired to `InMemoryActiveLanguageService.selectLanguage` / `InMemoryGameService.selectGame`. Add a `mat-icon-button` with a back arrow (`arrow_back`) at the top of `GameSelectionPage` (→ `/idioma`) and `TeamBuilderPage` (→ `/juego`); `LanguageSelectorPage` gets no back control (first step).

**Rationale**: `Router.navigateByUrl` calls already exist (`continueToGameSelection`, `continueToTeamBuilder`); only the trigger point moves from a dedicated button's `(click)` to the existing selection handler. No routing/state change needed — `InMemoryGameService`/`InMemoryTeamService` already reset appropriately on game change (FR-016 in `017`), so navigating back and re-selecting reuses that existing guard (the "team will be lost" `confirm()` in `GameSelectionPage.onSelectGame`).

**Alternatives considered**: A dedicated wizard/stepper service tracking step history — rejected; the three routes (`/idioma`, `/juego`, `/equipo`) are already a linear enough sequence that a plain "navigate to the fixed previous URL" satisfies FR-005/SC-007 without new state (Principle I).

## Decision 3 — Distinct per-game color: deterministic hash over the existing type-color pattern

**Decision**: Add `colorForGame(gameId: string): string` in `shared/design-system/`, following the exact shape of the existing `colorForType` — a small curated palette (8-10 hand-picked, accessible-contrast hues) selected by `hashString(gameId) % palette.length`, so the same game always gets the same color and adjacent games in a list are unlikely to collide for the catalog's actual size (~20-30 base games).

**Rationale**: Mirrors an established, already-reviewed pattern (`pokemon-type-colors.ts`) exactly — same file location convention, same "pure function over an id" shape — instead of introducing a new theming concept. `GameCardComponent` swaps its single fixed `--brewdex-brand-gradient` for `colorForGame(game().id)` as the card background.

**Alternatives considered**: Per-game colors hardcoded in a lookup table keyed by game id — rejected: every newly discovered `version-group` from PokeAPI (Decision 5) would need a manual entry, which breaks the "derived, not hand-maintained" property `pokeapi-game-catalog-repository.service.ts` already documents as a design goal.

## Decision 4 — Pokeball icon via Material Symbols ligature, no new asset

**Decision**: Render `<mat-icon>catching_pokemon</mat-icon>` (a stock Material Symbols glyph depicting a Poké Ball) inside `GameCardComponent`, styled to sit near the card title. `MatIconModule` is already imported project-wide via the ligature font already loaded for `close`/`egg_alt`/`check`/`arrow_back`.

**Rationale**: Avoids adding an SVG asset/registry (no `MatIconRegistry.addSvgIcon` exists anywhere in the codebase today — Decision keeps it that way, Principle I).

**Alternatives considered**: A custom inline SVG pokeball — rejected as an unnecessary new asset/build concern when an equivalent stock glyph already ships with the icon font the app already loads.

## Decision 5 — Game/DLC (mis)classification is a heuristic-exception list, following existing precedent

**Decision**: `PokeApiGameCatalogRepositoryService`'s `detectDlcParent` name-suffix heuristic (generic, derived from PokeAPI `version-group`/`version` naming) has two known false cases once PokeAPI's live data includes Legends Z-A:
1. **False negative** — Legends Z-A's "Mega Dimension" DLC content is not modeled by PokeAPI as a `version-group` whose version names cleanly follow the `${prefix}-${parentVersion}` suffix convention every other DLC (Isle of Armor, Crown Tundra, Teal Mask, Indigo Disk, etc.) follows, so it is missed by the heuristic and would render as its own base game.
2. **False positive** — `ultra-sun-ultra-moon`'s version names (`ultra-sun`, `ultra-moon`) each end with `-sun`/`-moon`, which satisfies the same suffix heuristic against `sun-moon`'s versions (`sun`, `moon`), so the heuristic currently (mis)detects USUM as a DLC of Sun/Moon.

Fix: add a small, explicit override table in the same file, following the existing `NATIONAL_DEX_ELIGIBLE_GAME_IDS`-style hand-maintained-exception precedent already documented in `pokedex/infrastructure/pokeapi-pokedex-index-repository.service.ts` (`research.md` Decisión 4 of `017`):
- `DLC_VERSION_GROUP_OVERRIDES`: explicit `{ dlcVersionGroupName, parentVersionGroupName }` pairs for cases the naming heuristic cannot derive (Mega Dimension → Legends Z-A, keyed by whatever exact `version-group` name PokeAPI assigns — resolved by inspecting the live `version-group` list during implementation).
- `NEVER_DLC_VERSION_GROUP_NAMES`: a set of version-group names that must never be treated as a DLC of a sibling regardless of what the suffix heuristic finds (`ultra-sun-ultra-moon`).

`detectDlcParent` consults the override/exclusion tables before falling back to the generic heuristic.

**Rationale**: PokeAPI does not model "is this a DLC" as a field (documented limitation, already accepted in `017`); a small hand-maintained exception table is the same class of fix already precedented in this codebase for exactly this kind of API gap, and keeps the common case (every other known DLC) fully derived/automatic per Principle I.

**Alternatives considered**: Hardcoding the entire game/DLC catalog — rejected, discards the existing derivation entirely and reintroduces the staleness problem the heuristic was built to avoid. Loosening the suffix heuristic (e.g., dropping the "exact prefix" requirement) — rejected, too likely to introduce new false positives among the ~30 existing correctly-classified games.

## Decision 6 — Sprites must use the game's own `version-group` sprite set, not the species-wide default

**Decision**: `PokeApiPokemonRepositoryService.buildEntry` (the private builder called from the public `fetchPokedexDetails`, the `PokemonRepository` port method) currently reads `principalPokemon.sprites.front_default` (species-wide "latest" sprite, generation-agnostic) for the Pokedex grid tile and always uses the `home` sprite set (`sprites.other.home`) for slot/team artwork. Change the grid-tile sprite (`PokedexEntry.spriteUrl`) to resolve from `pokemon.sprites.versions['generation-<n>']['<version-group-name>'].front_default` (PokeAPI's per-game/version-group sprite bucket — e.g. `versions['generation-i']['red-blue'].front_default` for Pokémon Red/Blue), falling back to `front_default` only when that specific version-group bucket is null/absent for that species (edge case in spec: "missing sprite set → placeholder, never a mismatched-generation fallback" is satisfied by falling back to the *placeholder*, not to the generic modern sprite, when the versioned bucket is absent — see Edge Cases in spec.md).

**Rationale**: This is the exact, already-documented shape of PokeAPI's sprite payload (`sprites.versions.<generation>.<version-group>.front_default`) and is the only field that actually varies per game; `front_default` is deliberately "whatever the latest generation looks like" per PokeAPI's own docs, which is the reported bug (Red/Blue showing modern-style art).

**Alternatives considered**: A separate hardcoded sprite-CDN URL pattern per generation (e.g. PokeAPI's raw GitHub sprite paths) — rejected, duplicates data PokeAPI already returns in the same response, adding a second sprite source to keep in sync (Principle I).

## Decision 7 — DLC Pokedex sections: group the existing merged index by `sourceTag`, one `InMemoryPokedexService` singleton, no new instances

**Decision (revised after `/speckit-analyze` finding C1 — see below)**: `InMemoryPokedexService` stays a single `providedIn: 'root'` instance, exactly as today. `PokeApiPokedexIndexRepositoryService.fetchRegionalIndex` **already** merges the main/regional pokedex with every currently-active DLC's pokedex into one `PokedexIndexEntry[]`, tagging each entry's origin via the existing `PokedexEntrySource` (`{kind:'regional'}` / `{kind:'national'}` / `{kind:'dlc', dlcId}`) — this merge is not new, it is the current, already-implemented behavior. What's missing today is purely presentational: `PokedexBrowserComponent` renders that merged list as one undivided grid instead of splitting it into visible sections.

Fix: `PokedexBrowserComponent` groups its already-resolved, already-paginated entries (Decision 8 still applies to the one shared index/detail signal pair) by `entry.sourceTag.kind` (and `dlcId` when `'dlc'`) into one `<section>` per group — a "main" section (`'regional'`/`'national'` entries) always rendered first, followed by one section per `dlcId` currently present in `gameSelectionReader.currentActiveDlcIds()`, in the order `DlcToggleListComponent` lists them. Toggling a DLC on/off changes `InMemoryGameService.activeDlcIds()`, which (via the existing `gameSelectionReader.onSelectionChanged()` subscription in `InMemoryPokedexService`) already triggers `load()` to refetch the merged index including/excluding that DLC's entries — so a toggle-off naturally drops that `dlcId`'s section (FR-011) without any extra bookkeeping, and a toggle-on naturally adds it back (FR-010), sourced from data the service already fetches.

**Why the original approach (one service-shaped instance per section) was rejected**: `/speckit-analyze` (2026-09-06) flagged that forking `InMemoryPokedexService` into multiple instances (e.g. via a component-level `providers: [InMemoryPokedexService]` on `PokedexBrowserComponent`) would fork its state, breaking `PokedexDetailsReader`/`POKEDEX_DETAILS_READER` — the single cross-cutting port `team-builder.page.ts`'s `detailsFor()` already relies on to resolve *any* roster Pokémon's details regardless of which dex section it came from. With N independent instances, no single one holds the union of details, and the port contract (Constitution Principle VI: "cross-context communication MUST go through an explicit, documented contract") would be silently violated. It also re-fetches `version-group`/`pokedex` PokeAPI resources redundantly, which the existing merge already avoids (Principle I).

**Rationale**: Reuses the existing, already-tested merge + `sourceTag` discriminator exactly as built — this is a presentation-only grouping change over data the service already produces, the smallest fix that satisfies FR-009/FR-010/FR-011 ("a new Pokedex section appears below the existing ones, without removing them") without touching the service's public signal shape, its singleton lifecycle, or the `PokedexDetailsReader` port at all.

**Alternatives considered**: Multiple `InMemoryPokedexService`-shaped instances, one per section (original Decision 7, before the `/speckit-analyze` finding) — rejected per above. A new "grouped view" value object duplicating what `sourceTag` already encodes — rejected as redundant (Principle I); `PokedexEntrySource` already carries exactly the discriminator needed.

## Decision 8 — Pagination: batch detail-resolution + infinite scroll, index stays eager

**Decision**: Keep `fetchPokedexIndex` (cheap, single/few calls, no per-species HTTP) eager and unpaginated — it already returns quickly. Change `InMemoryPokedexService.resolveDetails` from "resolve every id in the index at once" to "resolve details in sequential batches of 10-20 ids", exposing a `loadNextBatch()` method and a `hasMoreBatches` signal; `PokedexBrowserComponent` renders only entries with resolved details so far, and triggers `loadNextBatch()` from an `IntersectionObserver` sentinel element placed after the last rendered tile (Angular CDK's `IntersectionObserver`-based utilities, or a small local directive — no new dependency either way since `@angular/cdk` is already a dependency).

Per clarification: when `filterCriteria` is non-empty (search text or type selected), `resolveDetails` MUST NOT stop at the batches already scrolled into view — it drives batches-to-completion in the background (still 10-20 ids per HTTP round, still rendered incrementally) so `filterPokedexEntries` always evaluates against the *complete* detail set for the current dex, not just what has scrolled into view. When the filter is cleared, batch loading reverts to scroll-driven.

Per Decision 7 (revised): there is exactly **one** shared index/detail signal pair (the existing singleton `InMemoryPokedexService`), covering the merged main+active-DLC entries together — not one pagination cursor per section. `PokedexBrowserComponent` renders each `sourceTag`-grouped section using the subset of `pokedexDetailsById()` already resolved for that group; the single `loadNextBatch()`/scroll sentinel keeps resolving ids in index order (which interleaves regional and DLC ids as `mergePokedexesInto` produced them) regardless of which visual section they end up in. A DLC turned on mid-session triggers `load()` (via the existing `onSelectionChanged` reaction to `activeDlcIds` changing), which re-fetches the merged index and resets pagination — the newly-added DLC's ids join the same shared batching sequence rather than getting an independent one.

**Rationale**: The measured root cause of the "Pokedex takes forever" report is `resolveDetails` awaiting `Promise.all`-style resolution (via `PokemonRepository.fetchPokedexDetails`) for the *entire* index (up to ~1000+ national-dex ids) before rendering anything. `fetchPokedexDetails` already accepts an arbitrary `pokemonIds` subset, so batching is a caller-side change only — no port/contract change needed for detail-fetching itself, keeping the existing `pokedex.md`/`pokemon.md` contracts backward-compatible (only additive members).

**Alternatives considered**: A "Load more" button — rejected per clarification (user explicitly chose infinite scroll). Server-side search/filter via PokeAPI's per-type endpoints (`type/{name}`) — rejected: it returns a different, ungrounded id set that would need reconciling against the already-resolved index/DLC/national-dex view per game, adding real complexity for a filter PokeAPI cannot satisfy for the free-text case anyway; the simpler, uniform fix (resolve-to-completion under an active filter) covers both filter kinds with one mechanism.

## Decision 9 — Team slots: fixed CSS grid, uniform slot box regardless of content

**Decision**: Replace `TeamBuilderPage`'s `.app-team-slots { display:flex; flex-wrap:wrap }` with `display:grid; grid-template-columns:repeat(3, 1fr); grid-template-rows:repeat(2, 1fr)`, and give `TeamSlotComponent`'s host/root a fixed `min-height`/`min-width` (or aspect-ratio box) sized to the already-occupied-state layout (avatar + name + type badges), applied identically whether `entry()` is null or not — the empty state's placeholder block reserves the same vertical space the name/type-badge rows take when filled, instead of only rendering the avatar + name.

**Rationale**: The current empty-state branch renders fewer elements (`avatar-button--empty` + name only, no type badges row) than the filled branch (avatar + remove icon + name + type badges), which is the direct cause of the reported per-slot resize; reserving the type-badges row's height (even empty) in both branches, inside a fixed-size grid cell, satisfies FR-016/FR-017/SC-005 without a new component.

**Alternatives considered**: `aspect-ratio` only, no `min-height` reservation for the type row — rejected, doesn't fix the actual reported symptom (content, not just outer box, resizing).

## Decision 10 — Remove icon already exists; verify/carry forward

**Decision**: `TeamSlotComponent` already renders `mat-icon-button` + `<mat-icon>close</mat-icon>` for `remove` (not a generic text button) — FR-018 is effectively already satisfied at the component level. Scope for this feature is limited to (a) confirming its visual weight reads clearly against the new fixed-size slot box from Decision 9, and (b) applying the outlined-icon-button variant (Decision 1) for visual consistency, not adding a new remove affordance.

**Rationale**: Avoids re-implementing already-correct behavior; documents the actual gap (visual consistency/positioning within the new fixed grid) instead of duplicating a control that exists.

**Alternatives considered**: N/A — this is a verification decision, not a design choice.

## Decision 11 — Pokémon detail modal: new component, reusing `RosterEntry.isShiny` already in the domain

**Decision**: Add `PokemonDetailModalComponent` (new, `team/presentation/`) — a Material dialog/overlay (reuse whatever the existing `FormSelectionModalComponent`/`MoveSelectionSheetComponent` overlay mechanism is, for consistency) showing `displayName`, `typePrimary`/`typeSecondary` (via the existing `TypeBadgeComponent`), and an image bound to `entry.isShiny ? pokedexEntry.homeSpriteShinyUrl : pokedexEntry.homeSpriteUrl`, plus a `mat-slide-toggle` (outlined per Decision 1) wired to a new `InMemoryTeamService.toggleShiny(slotIndex, active)` method — a direct sibling of the already-existing `toggleMega`/`toggleGigamax` methods, since `RosterEntry.isShiny` and `RosterEntry.copyWith({ isShiny })` already exist in the domain layer (added in a prior iteration for a different UI entry point that was never wired up). `TeamSlotComponent`'s avatar image binding is updated to the same `entry.isShiny ? ... : ...` ternary so the slot reflects the same persisted flag.

**Rationale**: `isShiny` already exists end-to-end in the domain (`RosterEntry`) and infrastructure (`homeSpriteShinyUrl` resolved from PokeAPI's `sprites.other.home.front_shiny`) — this feature is almost entirely a presentation-layer wire-up (new modal + one new application method + one slot-component binding change), not new domain modeling. Persistence-until-toggled-off (clarification answer) falls out naturally from `isShiny` already living on the `RosterEntry` held in `InMemoryTeamService.slots`, independent of whether any modal is open.

**Alternatives considered**: A transient (component-local) shiny preview flag scoped to the modal only — rejected per clarification (the user explicitly chose persistent, and the domain already models it that way).

## Decision 12 — Team builder page shows the active game name; filter spacing is a padding fix

**Decision**: `TeamBuilderPage`'s `<h1 class="app-brand-title">{{ 'team.title' | transloco }}</h1>` becomes `{{ 'team.title' | transloco }} — {{ gameService.activeGame()?.displayName }}` (or an equivalent subtitle line), reading `activeGame` off the already-injected `GameSelectionReader`/`InMemoryGameService` pattern `GameSelectionPage` already uses. Filter margin fix is a CSS-only change: `PokedexBrowserComponent`'s filter row (`app-pokedex-search-bar` + `app-pokedex-type-filter` + `app-national-dex-toggle`/new per-DLC toggles) gets consistent horizontal padding matching the grid's existing `padding: 0.75rem 0` pattern (currently the grid has horizontal breathing room the filter row above it lacks).

**Rationale**: Both are small, localized template/CSS changes against components that already exist and already have the data needed (`InMemoryGameService.activeGame()` is already a public signal).

**Alternatives considered**: N/A — straightforward fixes, no real alternative design needed.
