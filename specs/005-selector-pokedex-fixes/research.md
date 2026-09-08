# Phase 0 Research: Correcciones y Mejoras del Selector de Juego y de la Pokédex del Armador de Equipo

Every item below was investigated against the actual code in this
repository and, where the defect is data-shaped, against live PokeAPI
responses fetched during planning (2026-08-23) — not assumed. File:line
references point at the pre-fix code.

## 1. Uniform slot font size (US3, FR-001/FR-002)

- **Decision**: Stop wrapping the whole `GameCard` content column in one
  `FittedBox(fit: BoxFit.scaleDown)`. Give the name its own fixed-size
  `Text` with `maxLines: 2` and `overflow: TextOverflow.ellipsis` (already
  used for the stroke/fill duo in `_LogoText`), and let only the *icon +
  spacing*, not the font size, absorb any remaining slack via a
  `LayoutBuilder`/`Flexible` sizing pass if a card is unusually small.
- **Rationale**: `game_card.dart:118-138` currently scales icon, name,
  *and* the generation label together as one unit — a long name shrinks a
  short game's generation label along with it, which is the reported
  "no se ven uniformes" symptom. Isolating the name's own overflow
  handling from the rest of the card's layout keeps every card's base
  font size identical regardless of name length (FR-001), matching
  SC-001.
- **Alternatives considered**: Auto-shrinking `Text` (`FittedBox` around
  the name text alone) was rejected — it still varies the rendered font
  size per card, only less drastically; the spec explicitly asks for a
  *uniform* size with truncation/layout adjustment instead (FR-002).

## 2. Dynamic generation/type filters — fixed, colorful, collapsible (US4, FR-003–FR-005, FR-016–FR-018)

- **Decision**: Replace the horizontally-scrolling `ListView.separated` +
  plain `ChoiceChip` row in both `GenerationFilter`
  (`presentation/game_selection/widgets/generation_filter.dart`) and
  `PokedexTypeFilter` (`presentation/team_builder/widgets/pokedex_type_filter.dart`)
  with a `Wrap`-based fixed grid of larger pressable tiles (no internal
  scroll physics), each colored — generations reuse the existing
  deterministic `_kGenerationPalette`/`_colorForGeneration` scheme already
  proven in `GameCard` (research item 1's sibling code); types use the
  new black-background/white-text/icon tile from item 3. Wrap both in a
  shared, small `CollapsibleFilterSection` presentation widget (a
  `StatefulWidget` holding one local `_expanded` bool, no Cubit/state
  change) that shows a header with a toggle icon button and animates the
  section's height.
- **Rationale**: `ListView` with `scrollDirection: Axis.horizontal` is
  exactly the "con scroll" behavior the user asked to remove; `ChoiceChip`
  carries no per-option color. A `Wrap` lays out every option
  simultaneously (no clipped/hidden options, satisfying SC-002) and wraps
  to more rows on narrow viewports instead of scrolling. A local
  `_expanded` bool is sufficient — the spec's edge case only requires the
  active selection to survive collapse/expand, and a widget's own state
  survives collapse (it isn't destroyed, only hidden), so no Cubit/state
  plumbing is needed (Constitution Principle I).
- **Alternatives considered**: Persisting the collapsed/expanded state in
  `GameSelectionState`/`TeamBuilderState` was rejected — the spec's
  Assumptions explicitly leave the default collapsed/expanded state to
  implementation, and there is no requirement that it survive a full page
  reload, so a local widget bool is the simplest sufficient design
  (YAGNI).

## 3. Type filter visual contract — black background, white text, icon (US4, FR-017/FR-018)

- **Decision**: Bundle one local, static, 18-icon Pokémon-type asset set
  under `assets/pokemon_types/{type-id}.svg` (or `.png`), keyed by
  `PokemonType.id` (already the stable PokeAPI type name, e.g. `"rock"`
  — verified in `pokemon_type.dart:13`). Render each type option as a
  black-background/white-text tile (from item 2's shared tile) with the
  matching icon placed beside the label via a simple `id → asset path`
  map in the presentation layer.
- **Rationale**: PokeAPI's `type` resource carries no icon/image field at
  all (confirmed against the live schema during planning) — there is
  nothing to "vary by game/generation" from the data source itself. FR-018
  is written with exactly this escape hatch ("cuando la fuente de datos
  distinga íconos por juego/generación"): since it doesn't, one bundled
  set for all games satisfies the requirement vacuously and keeps the
  asset surface small (18 files) instead of engineering a per-game/gen
  variant system nothing in the data model supports (Principle I).
- **Alternatives considered**: Fetching type "damage relation" sprites or
  similar from a third-party icon CDN was rejected — it would add a new
  external dependency/network call for a purely cosmetic, static, and
  small (18-value) dataset that is cheaper and more reliable bundled as an
  asset (no network flakiness, no attribution/licensing ambiguity beyond
  what the project already commits to for its bundled art).

## 4. Direct navigation on game selection — remove "Continuar" (US2, FR-006)

- **Decision**: Move the `_openTeamBuilder(context, game)` call
  (`game_selection_page.dart:266-287`) into `GameCard.onTap`'s handler for
  the "no game active yet" branch (`game_selection_page.dart:349-351`),
  right after `cubit.selectGame(game)` resolves. Remove the bottom
  `ElevatedButton`/`continueButton` and `state.canProceedToTeamBuilding`
  entirely. The existing "switch active game" path
  (`cubit.requestGameSwitch(game)` → confirm dialog → `confirmGameSwitch`)
  is unchanged in trigger, but its confirmation dialog now also navigates
  to the armador immediately after the user confirms, instead of leaving
  them back on the catalog to press "Continuar".
- **Rationale**: FR-006 requires zero extra confirmation step after
  picking a game; the existing confirm/cancel dialog for *switching* an
  already-active game is a distinct, still-required safety step (FR-010's
  roster-reconciliation warning, `001-select-game`) — it is not the
  "Continuar" button the user called unnecessary, so it stays.
- **Alternatives considered**: Keeping "Continuar" but auto-pressing it
  was rejected as pointless indirection — the button and its associated
  `canProceedToTeamBuilding` getter become fully dead code once selection
  navigates directly, so they are removed rather than left unreachable
  (Principle IV, no dead code).

## 5. "Legends Z-A: Mega Dimension" as DLC, not a separate game (US2, FR-007)

- **Decision**: Add `'mega-dimension': 'legends-za'` to
  `PokeApiGameCatalogRepository._dlcParentVersionGroup`
  (`pokeapi_game_catalog_repository.dart:19-24`).
- **Rationale**: Verified live against PokeAPI (2026-08-23):
  `GET /version-group?limit=100` already lists `legends-za` and
  `mega-dimension` as two independent version-groups (plus an unrelated
  `champions` entry, out of this feature's scope — the user did not
  report it and it is not confirmed to be Legends Z-A DLC), with no field
  on either linking them. This is exactly the gap the adapter's own code
  comment anticipates ("Update this map if PokeAPI adds further
  expansions") — the fix is a one-line data addition to an already-proven
  mechanism, not new code.
- **Alternatives considered**: Inferring DLC-ness heuristically (e.g. "a
  solo-version group released after its game, sharing a generation") was
  rejected — PokeAPI's data gives no reliable signal to distinguish a DLC
  version-group from a legitimate small solo release (e.g. `yellow` is
  also a solo version-group but is a base game, not DLC), so an explicit,
  reviewed table remains the correct, simple mechanism (Principle I).

## 6. National Dex scope limited to the selected game's generation (US5, FR-010)

- **Decision**: When `PokedexView.useNationalDex` is active, still fetch
  `GET /pokedex/national/` for authoritative national numbering, but keep
  only entries whose species `introducedGeneration` is at or before the
  target game's own generation, using a new pure `generationOrdinal`
  helper (domain, next to `isNationalDexEligible` in `pokedex_view.dart`)
  that orders `generation-i` … `generation-ix` and compares ordinals.
- **Rationale**: Confirmed by code inspection
  (`pokeapi_pokedex_repository.dart:97-103`) that the adapter currently
  adds exactly one unfiltered ref to the full national dex — every
  species PokeAPI's mirror has, including generations released years
  after the selected game. A generation-based cutoff matches how National
  Dex actually behaved in the original games (a Gen IV cartridge's
  National Dex could never contain a Gen V+ species, since those did not
  exist yet) and is fully derivable from data this adapter already fetches
  per entry (`introducedGeneration`, `pokedex_entry.dart:52-54`) — no new
  endpoint or per-cartridge encounter-table modeling required.
- **Alternatives considered**: Intersecting the national dex against the
  union of every version-group's regional Pokédex up to that generation
  (i.e. only species reachable by wild encounter/trade in some game of
  that generation, excluding e.g. cross-generation-only event species) was
  considered and rejected as disproportionate complexity for this feature
  (Principle I) — it would require fetching and unioning every regional
  Pokédex of every prior game in the generation, is not what the spec's
  Assumptions describe ("la Pokédex Nacional de ese juego" mirroring
  004's already-established generation-scoped behavior), and PokeAPI does
  not expose a "first game with a legitimate wild encounter" field to
  make the distinction cleanly in the first place.

## 7. Targeted reload for the National Dex/DLC toggle (US5, FR-011)

- **Decision**: Give `TeamBuilderState` a new `isRefreshingPokedex: bool`
  field. `TeamBuilderCubit._fetchAndApplyView`
  (`team_builder_cubit.dart:135-150`) emits
  `state.copyWith(isRefreshingPokedex: true, view: view)` instead of
  `status: TeamBuilderStatus.loading`, then on success emits
  `isRefreshingPokedex: false` alongside the refreshed `allEntries`/
  `visibleEntries`/`entryCache` (status stays `loaded` throughout).
  `TeamBuilderPage` keeps rendering `_TeamBuilderBody` the whole time and
  shows a small, local loading indicator only inside the
  Pokédex-list/grid region (e.g. an overlay or a top-of-grid progress bar)
  when `isRefreshingPokedex` is true.
- **Rationale**: Confirmed by code inspection that
  `TeamBuilderPage.build`'s top-level `switch (state.status)`
  (`team_builder_page.dart:55-67`) has no case that keeps `TeamSlotRow`/
  filters mounted during a `loading` status — it swaps the whole body for
  a bare `CircularProgressIndicator`. Team slots (`state.slots`, resolved
  from `entryCache`, unaffected by a view refetch) and the active filter
  values (`state.filter`, untouched by `toggleNationalDex`/`toggleDlc`)
  already do not need to reset on a view change; only the fetch itself
  needs a loading affordance, so it gets one scoped to where the data
  actually changes.
- **Alternatives considered**: Optimistic UI (show stale entries dimmed
  during refetch, no separate flag) was considered but rejected — a plain
  boolean flag is simpler to reason about and test (`bloc_test` asserting
  `status` never leaves `loaded` during a toggle), and the spec only
  requires that the rest of the screen not reset (FR-011), not a specific
  stale-data treatment.

## 8. DLC Pokédex as an additional, separate component (US5, FR-012/FR-013)

- **Decision**: Keep `PokeApiPokedexRepository.fetchPokedex` returning one
  merged, sorted `List<PokedexEntry>` (the `PokedexRepository` contract's
  "no partial results"/"sorted output" rules are unaffected — see
  `contracts/pokedex_repository_amendment.md`). Add a small, pure grouping
  getter on `TeamBuilderState` (e.g. `baseVisibleEntries` and
  `dlcVisibleEntriesByDlcId`, partitioning `visibleEntries` by
  `PokedexEntry.sourceTag`). `TeamBuilderPage` renders one `SliverGrid` +
  header for the base list, then one additional labeled `SliverGrid` +
  header per active DLC with at least one visible entry.
- **Rationale**: `PokedexEntry.sourceTag` (`PokedexEntrySource.regional`/
  `.national`/`.dlc(id)`) already exists precisely to support this
  distinction (`pokedex_entry_source.dart`) but nothing in presentation
  reads it — `team_builder_page.dart:170-191` renders one undivided
  `SliverGrid`. Grouping is a presentation-layer partition of already-
  fetched, already-tagged data; it requires no new port, no new fetch, and
  no change to the merge/sort contract other feature code (filtering,
  roster validity) depends on.
- **Alternatives considered**: Adding a second port method
  (`fetchDlcPokedex`) to fetch DLC entries as a genuinely separate HTTP
  round-trip was rejected — the existing single fetch already retrieves
  DLC entries tagged correctly in one pass; splitting the *fetch* would
  add a network round-trip and a port-contract change for a requirement
  that is really about *display grouping*, not data retrieval (Principle
  I; also lower risk to `RosterValidityChecker`, which depends on the
  merged list already being complete).

## 9. Regional form priority (US1, FR-014/FR-015)

- **Decision**: In `PokeApiPokedexRepository._buildEntry`, after loading
  `speciesBody['varieties']`, first check a small adapter-local
  `_regionalFormSuffixByGameId` table (keyed by `Game.id`, e.g.
  `'sun-moon'`/`'ultra-sun-ultra-moon'` → `'alola'`,
  `'sword-shield'` → `'galar'`, `'legends-arceus'` → `'hisui'`,
  `'scarlet-violet'` → `'paldea'`). If the target game has an entry, look
  for a variety whose `pokemon.name` ends with `-{suffix}`; use it as the
  "principal" variety for that entry. Otherwise (no table entry, or no
  matching variety for that species), fall back to today's species-level
  `is_default` variety unchanged.
- **Rationale**: Verified live against PokeAPI (2026-08-23):
  `pokemon-species/rattata`'s varieties are `rattata` (`is_default:
  true`) and `rattata-alola` (`is_default: false`) — species-level
  `is_default` is Kanto's form regardless of which game's Pokédex is being
  built, confirming the reported bug exactly (Sol/Luna showing Kanto
  Rattata instead of Alola Rattata). PokeAPI does not expose a
  "region this variety belongs to" field directly, but its naming
  convention for every known regional-form species (`-alola`, `-galar`,
  `-hisui`, `-paldea` suffixes) is consistent enough to key off, and this
  codebase already has precedent for a small, reviewed, hardcoded
  per-game table for exactly this kind of PokeAPI data gap
  (`_dlcParentVersionGroup`).
- **Alternatives considered**: Deriving regional-form eligibility from
  `Game.generation` instead of `Game.id` was rejected — Generation VIII
  contains both Galar (`sword-shield`) and Hisui (`legends-arceus`)
  games, so generation alone cannot pick the right suffix; a per-game-id
  table (like the DLC table) is the smallest correct key.

## 10. Pokémon HOME-style sprite in a filled team slot (US6, FR-019/FR-020)

- **Decision**: Add `PokedexEntry.homeSpriteUrl` (nullable `String`),
  resolved in `_buildEntry` from
  `pokemonBody['sprites']['other']['home']['front_default']` (verified
  live to exist at this path for the species checked during planning),
  falling back to `null` when absent — never to the game-specific
  `spriteUrl`, so presentation can show its own FR-020 placeholder rather
  than silently reusing the wrong art style. `TeamSlot` renders
  `entry.homeSpriteUrl` instead of `entry.spriteUrl`; `PokedexEntryCard`
  (the Pokédex grid tile) is unchanged and keeps showing `entry.spriteUrl`
  (FR-004 still wants the game-specific sprite in the browsing grid — only
  the *filled slot* changes, per FR-019).
- **Rationale**: `pokedex_entry.dart` has no HOME-sprite field today, and
  `team_slot.dart:74-76` reads `entry.spriteUrl` — the same field the
  Pokédex grid uses — which is exactly the reported "no debe reutilizar el
  sprite de la lista" gap. Fetching it from the same already-requested
  `pokemon` resource (`pokemonBody`, already fetched for `types`/
  `spriteUrl`) costs no extra HTTP round-trip.
- **Alternatives considered**: Fetching the HOME sprite lazily only when
  a Pokémon is actually added to a slot (a separate on-demand call) was
  rejected — it would need a new port method and a loading state for a
  single-field lookup that is already free to include in the existing
  per-entry fetch, adding complexity (Principle I) without any real
  performance benefit (the Pokédex list is already fetching one
  `pokemon` resource per entry).

## 8'. Investigation protocol for "algunas dex muestran números como palabras" (US1, FR-008)

- **Status**: Not reproduced by static review. `PokedexEntry.pokedexNumber`
  is declared `int` (`pokedex_entry.dart:39`, with an `assert(pokedexNumber
  > 0, …)` guard) and is always assigned from `entry['entry_number'] as
  int` (`pokeapi_pokedex_repository.dart:58`) — a cast that would throw,
  not silently produce text, if PokeAPI ever returned a non-numeric
  value. `pokedex_entry_card.dart:91` renders it via
  `'#${entry.pokedexNumber.toString().padLeft(3, '0')}'`, which cannot
  produce a spelled-out word for an `int`. Spot-checking several
  regional/national `pokedex` resources live against PokeAPI during
  planning returned only integer `entry_number` values.
- **Decision**: Carry this forward as a dedicated investigate-and-fix task
  in `tasks.md` rather than guessing at a fix now (Constitution Principle
  II: a regression test must exist and fail for the right reason before
  a fix is written). The task MUST: (a) reproduce the report by running
  the armador against every game currently in the catalog and diffing the
  rendered numbers against each game's raw `entry_number` values; (b) once
  reproduced, add a fixture-backed regression test at the layer where the
  defect actually lives (this plan reserves
  `test/infrastructure/team_builder/pokeapi_pokedex_repository_full_dex_test.dart`
  for a full-dex fixture sweep as the most likely home, since a
  single-fixture unit test would not have caught a defect specific to one
  Pokédex's shape); (c) fix at that layer and confirm SC-005 (100% of
  displayed numbers are numeric) across the full catalog, not just the
  previously-tested fixture Pokémon.
- **Rationale for deferring instead of guessing**: Every code path that
  touches this value was inspected and is already numeric end-to-end;
  fabricating a "fix" for a mechanism that cannot be shown to produce the
  reported symptom would risk masking the real defect (which may be
  version/locale/build-specific, e.g. a stale generated `intl` message
  bundle, a since-fixed PokeAPI response shape for one specific pokedex
  resource, or a display bug in a build the user tested that has since
  diverged from this checkout) rather than fixing it.
