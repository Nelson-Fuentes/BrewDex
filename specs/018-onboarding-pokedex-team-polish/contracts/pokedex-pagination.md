# Contract: Pokedex Pagination & Filtering (extends `017`'s `contracts/pokedex.md`)

Scope: `pokedex/infrastructure/in-memory-pokedex.service.ts` (`InMemoryPokedexService`). Existing ports (`PokedexIndexRepository.fetchPokedexIndex`, `PokemonRepository.fetchPokedexDetails`) are **unchanged** — this contract only adds members to the application-facing store and specifies the calling pattern.

## New/changed public signals & methods

```ts
interface PokedexStore {
  // existing, unchanged:
  readonly status: Signal<'idle' | 'loading' | 'ready' | 'error'>;
  readonly filterCriteria: Signal<PokedexFilterCriteria>;
  readonly pokedexIndex: Signal<readonly PokedexIndexEntry[]>;
  readonly pokedexDetailsById: Signal<ReadonlyMap<string, PokedexEntry>>;
  updateFilterCriteria(criteria: PokedexFilterCriteria): void;
  toggleNationalDex(useNationalDex: boolean): void;
  detailsFor(pokemonId: string): PokedexEntry | null;

  // new:
  /** True while `pokedexIndex().length > pokedexDetailsById().size` and
   *  status is not 'error'. Presentation uses this to decide whether to
   *  render the infinite-scroll sentinel. */
  readonly hasMoreBatches: Signal<boolean>;

  /** True while a batch is in flight (either scroll-driven or
   *  filter-driven resolve-to-completion). Used to avoid firing
   *  overlapping requests from the scroll sentinel. */
  readonly isLoadingBatch: Signal<boolean>;

  /** Resolves the next 10-20 unresolved ids, in index order, via the
   *  existing `PokemonRepository.fetchPokedexDetails`. No-op (resolves
   *  immediately) if `isLoadingBatch()` is already true or
   *  `hasMoreBatches()` is false. Errors on a single batch surface via a
   *  `batchError` signal (see below) WITHOUT clearing already-resolved
   *  entries or `status`. */
  loadNextBatch(): Promise<void>;

  /** Non-null when the most recent `loadNextBatch()` call failed; cleared
   *  on the next successful batch or explicit `retryBatch()`. Presentation
   *  renders an inline retry affordance keyed on this (spec.md Edge Cases:
   *  "next batch fails to load"). */
  readonly batchError: Signal<boolean>;
  retryBatch(): Promise<void>;
}
```

## Behavioral rules

1. **Initial load** (`load()`, existing method): fetches the full index (unchanged, cheap), then resolves **only the first batch** (10-20 ids) instead of the whole index.
2. **Scroll-driven loading**: while `filterCriteria().isEmpty === true`, `loadNextBatch()` is the only way further ids get resolved — the presentation layer (an `IntersectionObserver` sentinel in `PokedexBrowserComponent`) calls it when the sentinel intersects the viewport.
3. **Filter-driven resolve-to-completion**: the instant `filterCriteria()` transitions from empty to non-empty, the service internally drives `loadNextBatch()` to completion (still one batch of 10-20 ids per underlying HTTP round, still updating `pokedexDetailsById` incrementally so the UI can render partial results as they arrive) without waiting for further scroll events. While this is in progress, `isLoadingBatch()` is `true` and the presentation MAY show a "resolving full results…" indicator distinct from the initial per-batch spinner.
4. **Filter cleared**: reverts to scroll-driven batching; already-resolved entries are kept (never re-fetched).
5. **One shared `InMemoryPokedexService` singleton, revised after `/speckit-analyze` finding C1** (research.md Decision 7): there is exactly **one** `pokedexIndex`/`pokedexDetailsById`/pagination state, covering the merged main+active-DLC list `PokedexIndexRepository.fetchPokedexIndex` already produces (unchanged `PokedexView` with its existing `activeDlcIds` set). DLC sections are **not** separate service instances or separate `PokedexView`s — they are a presentation-only grouping of this one resolved list by each entry's existing `PokedexIndexEntry.sourceTag` (`PokedexEntrySource`). This preserves `detailsFor(pokemonId)` as a single, unambiguous source of truth for `PokedexDetailsReader` consumers (`team-builder.page.ts`).
6. **Batch size**: 10-20 ids (implementation picks one constant in that range — spec.md Assumptions).

## Consumers

- `PokedexBrowserComponent` (a single instance, injecting the one root `InMemoryPokedexService`) renders `pokedexIndex().filter(e => pokedexDetailsById().has(e.pokemonId))` (or an equivalent "resolved so far" projection) instead of assuming every index entry has details, groups that filtered/resolved list into sections by `entry.sourceTag.kind` (`'regional'`/`'national'` first, then one `<section>` per distinct `dlcId` present, in `DlcToggleListComponent`'s toggle order — FR-009/FR-010/FR-011), and wires one scroll sentinel (at the end of the last section) to the single shared `loadNextBatch()`.
- `TeamBuilderPage` composes exactly **one** `PokedexBrowserComponent` (not one per DLC) — toggling a DLC on/off changes `activeDlcIds()`, which the existing `onSelectionChanged` reaction already uses to reload the merged index with/without that DLC's entries, and `PokedexBrowserComponent`'s section grouping picks that up automatically.
