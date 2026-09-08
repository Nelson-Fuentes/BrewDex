# Data Model: Onboarding, Pokedex & Team Builder Polish

This feature is almost entirely a presentation/infrastructure-layer fix set; the domain model additions are small and additive. Entities/fields not listed here are unchanged from `specs/017-migracion-angular/data-model.md`.

## Game (`game/domain/entities/game.ts`) — unchanged shape, corrected data

No new fields. `dlcs: readonly GameDlc[]` is populated correctly once `PokeApiGameCatalogRepositoryService` applies the override/exclusion tables from research.md Decision 5:
- "Mega Dimension" appears inside `legends-z-a`'s `dlcs`, never as its own top-level `Game`.
- `sun-moon` and `ultra-sun-ultra-moon` are both top-level `Game`s; neither's `dlcs` contains the other.

## GameDlc (`game/domain/value-objects/game-dlc.ts`) — unchanged

No field changes. Existing `{ id, displayName }` shape already supports "one toggle per DLC" (FR-009).

## PokedexView (`pokedex/domain/value-objects/pokedex-view.ts`) — unchanged

**No change** (revised after `/speckit-analyze` finding C1 — see research.md Decision 7). `PokedexView` keeps combining `useNationalDex` with the *full set* of currently-active DLC ids, exactly as today; `InMemoryPokedexService` remains a single `providedIn: 'root'` instance holding one merged index/detail signal pair for "regional/national + every active DLC." Splitting that merged, already-resolved list into visible sections (main vs. one per active DLC) is done entirely in `PokedexBrowserComponent` by grouping on the existing `PokedexIndexEntry.sourceTag` discriminator (`PokedexEntrySource`) — see the next entry.

## PokedexEntrySource (`pokedex/domain/value-objects/pokedex-entry-source.ts`) — unchanged, now consumed by presentation

**No shape change.** This existing discriminated union (`{kind:'regional'}` / `{kind:'national'}` / `{kind:'dlc', dlcId}`) already tags every `PokedexIndexEntry` produced by the merge in `fetchRegionalIndex`. `PokedexBrowserComponent` now reads `entry.sourceTag` to group the rendered grid into sections (research.md Decision 7) — this is the field that makes the multi-instance approach unnecessary.

## PokedexEntry (`pokemon/domain/entities/pokedex-entry.ts`) — `spriteUrl` semantics corrected

**Change**: `spriteUrl: string | null` (grid-tile sprite) now MUST be resolved from the active game's own `version-group` sprite bucket (research.md Decision 6), not the species-wide default. Field name/type/nullability unchanged — only the infrastructure resolution changes. `homeSpriteUrl`/`homeSpriteShinyUrl` (slot/detail-modal artwork) are unchanged; they already resolve from `sprites.other.home`, which is generation-agnostic "official artwork" by design and is not part of the reported bug.

## RosterEntry (`team/domain/value-objects/roster-entry.ts`) — no change

`isShiny: boolean` and `copyWith({ isShiny })` already exist (see research.md Decision 11). This feature wires a UI path to flip it; no new field.

## PokedexFilterCriteria (`pokedex/domain/value-objects/pokedex-filter-criteria.ts`) — no shape change

Unchanged fields (`searchText`, `type`, `generation`). Behavioral change only: when `!criteria.isEmpty`, the *consuming service* (`InMemoryPokedexService`) resolves details for the full index instead of stopping at the scrolled-into-view batch (research.md Decision 8) — `filterPokedexEntries` itself is unchanged, it always filters whatever details are currently resolved.

## InMemoryPokedexService — new pagination state (infrastructure-level signals, not domain)

New signals/methods on the existing single `InMemoryPokedexService` instance (one shared index/detail pair for the merged main+active-DLC list, per revised Decision 7 — **not** one instance per section):
- `hasMoreBatches: Signal<boolean>` — `true` while `pokedexIndex().length > pokedexDetailsById().size` and no error.
- `loadNextBatch(): Promise<void>` — resolves the next 10-20 unresolved ids (in index order) via the existing `PokemonRepository.fetchPokedexDetails`, merging into `pokedexDetailsById`.
- Internal: a "resolve to completion" mode entered automatically while `filterCriteria().isEmpty === false`, exited when the filter is cleared (reverts to batch-per-scroll).

No new persisted entity — this is transient, in-memory pagination progress, consistent with the app's no-persistence constraint (FR-015 of `017`).

## New value: per-game display color (presentation-only, not domain)

`colorForGame(gameId: string): string` (research.md Decision 3) lives in `shared/design-system/`, mirroring `colorForType`. Pure function, not a stored/domain field — `Game` gains no `color` property; the color is derived at render time from `game.id`.

## Key Entities cross-reference (spec.md)

| spec.md Key Entity | Implementation |
|---|---|
| Game | `game/domain/entities/game.ts` (existing, corrected data via Decision 5) |
| DLC | `game/domain/value-objects/game-dlc.ts` (existing, unchanged shape) |
| Pokedex Entry / Pokémon | `pokemon/domain/entities/pokedex-entry.ts` (existing; `spriteUrl` resolution corrected) |
| Team Slot | `team/domain/value-objects/roster-entry.ts` (`RosterEntry`, existing; `isShiny` already modeled) held in `InMemoryTeamService.slots()[index]` |
| Team | `InMemoryTeamService.slots` (existing, `MAX_TEAM_SIZE` = 6, unchanged) |
