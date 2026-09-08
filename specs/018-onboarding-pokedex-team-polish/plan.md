# Implementation Plan: Onboarding, Pokedex & Team Builder Polish

**Branch**: `018-onboarding-pokedex-team-polish` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-onboarding-pokedex-team-polish/spec.md`

## Summary

A targeted polish/bug-fix pass over BrewDex's existing Angular SPA (built in `017-migracion-angular`), touching all three flow steps: (1) onboarding — remove the redundant "Continue"/"Select" buttons so a language/game click navigates immediately, add a back control per step, give game cards a pokeball icon and a per-game distinct color, and tighten the language list's spacing; (2) Pokedex — fix sprite resolution to use the active game's own `version-group` sprite bucket instead of the species-wide default, correct two known Game/DLC misclassifications in the existing PokeAPI-derived heuristic (Mega Dimension → DLC of Legends Z-A; Sun/Moon and Ultra Sun/Ultra Moon → independent games), turn each DLC into its own toggle that reveals an additional, independently paginated Pokedex section, and replace "resolve every species' details up front" with infinite-scroll batching (10-20 at a time) that still resolves to completion when a filter is active (per clarification); (3) team builder — show the active game's name, fix filter-row edge padding, arrange the 6 slots in a fixed 3×2 grid with uniform box size regardless of content, and add a new Pokémon detail modal (name/types/image + a shiny toggle) wired to `RosterEntry.isShiny`, which already exists in the domain but has no UI path today. A cross-cutting pass applies Material's outlined appearance consistently. No new dependency, no backend, no persistence — all in-memory, per the app's existing constraints.

## Technical Context

**Language/Version**: TypeScript 5.x on Angular 18 (standalone components, signals; no `NgModule`) — unchanged from `017`

**Primary Dependencies**: Angular (`@angular/core`, `@angular/common/http`, `@angular/router`), Angular Material 3 (outlined appearance is a built-in variant, no new package), `@jsverse/transloco`, Angular CDK (`@angular/cdk` — already a dependency; provides `IntersectionObserver`-based scroll-trigger primitives via `ObserversModule`/`cdk-virtual-scroll` utilities, reused here instead of hand-rolling a new scroll listener)

**Storage**: N/A — no persistence, unchanged (FR-015 of `017`); all pagination/toggle state is in-memory and resets on navigation/reload, consistent with spec.md Assumptions

**Testing**: Jasmine + Karma (`ng test`) for domain/application/infrastructure/presentation unit and component tests; Playwright (`npm run test:e2e`) for the onboarding and team-builder end-to-end flows

**Target Platform**: Same modern-browser target as `017` (desktop + mobile web, installable PWA); no new platform surface

**Project Type**: web — single Angular SPA in `web/`, no backend (PokeAPI is the only external dependency), unchanged

**Performance Goals**: First Pokedex batch (10-20 entries) visible within 2s under normal network conditions (spec.md SC-003) — down from the current "wait for the entire index's details" behavior, which is the reported root cause of slow loads

**Constraints**: No new runtime dependency; every fix must stay inside the existing module boundaries (`language`, `game`, `pokemon`, `pokedex`, `team`, `shared`) and their existing hexagonal layering; filter correctness (SC-008) must hold even while pagination is incomplete

**Scale/Scope**: Same catalog scale as `017` (~9 generations, ~30 base games with DLCs, national dex up to ~1000+ entries); this feature changes how that data is fetched/paginated/classified, not its size

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity & YAGNI**: PASS. Every fix reuses an existing pattern already reviewed in this codebase: `colorForGame` mirrors `colorForType`; the DLC classification fix mirrors the already-precedented `NATIONAL_DEX_ELIGIBLE_GAME_IDS` hand-maintained-exception approach; the shiny toggle reuses the already-modeled `RosterEntry.isShiny` and mirrors `toggleMega`/`toggleGigamax`; pagination reuses the existing `fetchPokedexDetails(pokemonIds: readonly string[])` signature with a smaller `pokemonIds` slice per call, no port change. No new library, service, or abstraction layer is introduced (research.md Decisions 1–12). **PASS**.
- **II. Test-First Development**: Every fix here is either a regression (existing behavior is wrong per spec.md) or new behavior (shiny modal, pagination, back navigation) — `/speckit-tasks` MUST sequence a failing test before each corresponding implementation change, per the project's established pattern (see `quickstart.md`'s "Automated checks" for the specific spec files to extend). **PASS** (process gate, enforced at tasks/implementation time).
- **III. Clear Contracts & Interfaces**: `PokedexIndexRepository`/`PokemonRepository` ports are unchanged (backward compatible); the only new public contracts are additive members on the existing `PokedexStore`/`TeamStore` application-facing signal APIs (`hasMoreBatches`, `loadNextBatch`, `batchError`, `retryBatch`, `toggleShiny`) — see `contracts/pokedex-pagination.md` and `contracts/team-shiny-toggle.md`. **PASS**.
- **IV. Code Quality & Review**: No change to this gate — ESLint/Prettier, PR review, no direct commits to the default branch, unchanged from `017`. **PASS**.
- **V. Observability & Versioning**: No new external integration point; the existing `LoggingService` continues to be the single place PokeAPI failures are logged (e.g., a failed pagination batch surfaces through the existing `logAndRethrow`/`batchError` pattern, not a new ad hoc `console.log`). **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)**: PASS. All twelve research.md decisions stay inside the module (`language`/`game`/`pokemon`/`pokedex`/`team`/`shared`) and layer (`domain`/`application`/`infrastructure`/`presentation`) boundaries `017` already established: the DLC-classification override table stays inside `game/infrastructure`; the sprite-resolution fix stays inside `pokemon/infrastructure`; pagination state stays inside `pokedex/infrastructure`'s existing `InMemoryPokedexService`; the shiny toggle is a new `team/application`-level method on the existing `InMemoryTeamService` plus a `team/presentation` component — no module reaches into another's `domain`/`infrastructure` directly, and `team` continues to compose `pokedex` only via a single `PokedexBrowserComponent` instance (presentation→presentation, unchanged cardinality) — DLC sections are grouped from the one shared, already-merged index by its existing `sourceTag` discriminator (research.md Decision 7, revised after `/speckit-analyze` finding C1), preserving `PokedexDetailsReader`/`POKEDEX_DETAILS_READER` as the single, unambiguous cross-cutting port `team` already relies on.

No violations to record in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/018-onboarding-pokedex-team-polish/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── pokedex-pagination.md
│   ├── game-dlc-classification.md
│   └── team-shiny-toggle.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Existing Angular SPA in `web/` (from `017-migracion-angular`), organized by module first, then by layer (`domain/`, `application/`, `infrastructure/`, `presentation/`) — unchanged structure, this feature only edits/adds files inside it:

```text
web/src/
├── language/
│   └── presentation/
│       └── language-selector.page.ts        # US1: remove "Continuar" button, tighten option spacing
├── game/
│   ├── infrastructure/
│   │   └── pokeapi-game-catalog-repository.service.ts   # US2: DLC_VERSION_GROUP_OVERRIDES / NEVER_DLC_VERSION_GROUP_NAMES
│   └── presentation/
│       ├── game-selection.page.ts           # US1: remove "Seleccionar" button, add back control
│       └── game-card.component.ts           # US1: pokeball icon + colorForGame()
├── pokemon/
│   └── infrastructure/
│       └── pokeapi-pokemon-repository.service.ts   # US2: versioned sprite resolution (spriteUrl)
├── pokedex/
│   ├── infrastructure/
│   │   └── in-memory-pokedex.service.ts     # US2: batching (loadNextBatch/hasMoreBatches/batchError), filter-driven resolve-to-completion
│   └── presentation/
│       ├── pokedex-browser.component.ts     # US2: infinite-scroll sentinel, "resolved so far" rendering grouped into sections by sourceTag, filter-row padding fix
│       └── dlc-toggle-list.component.ts     # US2: verify existing (toggleDlc) wiring against activeDlcIds (no structural change)
├── team/
│   ├── infrastructure/
│   │   └── in-memory-team.service.ts        # US3: new toggleShiny(slotIndex, active)
│   └── presentation/
│       ├── team-builder.page.ts             # US3: show active game name, fixed 3x2 grid, open detail modal (single PokedexBrowserComponent instance, unchanged from today)
│       ├── team-slot.component.ts           # US3: uniform empty/filled box size, shiny-aware image binding
│       └── pokemon-detail-modal.component.ts   # US3: NEW — name/types/image + shiny toggle
└── shared/
    └── design-system/
        └── pokemon-game-colors.ts           # US1: NEW — colorForGame(), mirrors pokemon-type-colors.ts
```

**Structure Decision**: No structural change to the existing `web/` module/layer layout from `017`. This feature adds exactly one new file (`pokemon-detail-modal.component.ts`, plus its sibling `shared/design-system/pokemon-game-colors.ts`) and edits existing files in place; every edit stays within the module already responsible for that concern, per the Constitution Check above.

## Complexity Tracking

*No violations — table omitted per Constitution Check.*
