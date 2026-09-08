# Phase 1 Data Model: Correcciones y Mejoras del Selector de Juego y de la Pokédex del Armador de Equipo

This feature amends entities/state already defined by `001-select-game`
and `004-pokedex-team-builder`. No new domain entity is introduced. Fields
and helpers below are additions or behavior corrections to existing types;
anything not listed here is unchanged from its owning feature's
`data-model.md`.

## Amended: `PokedexEntry` (domain/team_builder/entities)

Adds one field; every other field, the constructor's asserts, `props`, and
`hasType` are unchanged from `004-pokedex-team-builder`.

| Field | Type | Notes |
|---|---|---|
| `homeSpriteUrl` | `String?` | **NEW** (US6, FR-019/FR-020). The Pokémon HOME-style artwork URL for this entry's resolved variety/form (item 10, research.md), resolved by `PokeApiPokedexRepository` from `pokemon.sprites.other.home.front_default`. `null` when the source data has none — presentation MUST show the existing FR-020 placeholder in that case, never fall back to `spriteUrl`. |

`spriteUrl` is unchanged in meaning and continues to back the Pokédex grid
tile (`PokedexEntryCard`, FR-004); `homeSpriteUrl` is additive and backs
only a filled `TeamSlot` (FR-019).

Regional-form priority (item 9, research.md) does not add a field — it
changes *which variety's* `pokemon` (not `pokemon-species`) data
`spriteUrl`, `homeSpriteUrl`, `typePrimary`, and `typeSecondary` are
derived from, for a species with a game-appropriate regional form.
`displayName` keeps coming from the species-level `pokemon-species`
resource regardless of variety — PokeAPI does not vary a species'
display name by regional form (Kanto and Alola Rattata are both just
"Rattata"). `pokemonId` stays the species id either way (unchanged
identity contract — see `contracts/pokedex_repository_amendment.md` rule
6, inherited from `004`), so `TeamRosterStore`/`RosterValidityChecker`
matching is unaffected.

## Amended: `PokedexView` (domain/team_builder/value_objects)

`useNationalDex`/`activeDlcIds`/`copyWith`/`props` are unchanged. The
free function `isNationalDexEligible` (already in this file) is unchanged.
One new free function is added alongside it:

```dart
/// Total order over generation ids (`generation-i` < `generation-ii` <
/// … < `generation-ix`), used to scope the National Dex to species that
/// existed by [game]'s own generation (FR-010, research.md item 6).
/// Returns `-1` for an unrecognized id so an unknown/future generation
/// sorts before everything else rather than being silently included.
int generationOrdinal(Generation generation);
```

Pure domain code (a lookup over a fixed, hardcoded list of known
generation ids); no Flutter/HTTP/storage import, consistent with this
file's existing constraints (Constitution Principle VI).

## Amended: `PokedexEntrySource` (domain/team_builder/value_objects)

Unchanged. Already distinguishes `regional`/`national`/`dlc(id)`
(`004-pokedex-team-builder`); this feature is the first to actually
consume it in presentation (item 8, research.md) instead of only tagging
it.

## Amended: `TeamBuilderState` (presentation/team_builder/cubit)

| Field | Type | Notes |
|---|---|---|
| `isRefreshingPokedex` | `bool` (default `false`) | **NEW** (US5, FR-011). `true` only while a National-Dex/DLC toggle's refetch is in flight; `status` stays `TeamBuilderStatus.loaded` throughout so the rest of the screen (team slots, filters) stays mounted (research.md item 7). |

Two new derived getters (no new stored field — computed from the existing
`visibleEntries`):

| Getter | Type | Notes |
|---|---|---|
| `baseVisibleEntries` | `List<PokedexEntry>` | `visibleEntries` where `sourceTag` is `PokedexEntrySourceRegional` or `PokedexEntrySourceNational` (US5, FR-012). |
| `dlcVisibleEntriesByDlcId` | `Map<String, List<PokedexEntry>>` | `visibleEntries` where `sourceTag` is `PokedexEntrySourceDlc`, grouped by `dlcId`, in `game.dlcs` order (US5, FR-012/FR-013). An id with no active entries is simply absent from the map — the presentation layer renders a DLC section only for a key present here. |

`copyWith` gains the `isRefreshingPokedex` parameter (defaulting to
resetting to `false` on every emit that doesn't explicitly pass it, same
convention already used for `teamFullNotice` in this file). `props` gains
`isRefreshingPokedex`. `slots`, `isTeamFull`, `hasNoMatches`, and every
other existing member are unchanged.

## Amended: `GameSelectionState` / `GameSelectionCubit` (presentation/game_selection)

No new field. `canProceedToTeamBuilding` and its consumer (the removed
"Continuar" button) are deleted — navigation now happens directly from
`GameCard.onTap` once `selectGame`/`confirmGameSwitch` resolves (US2,
FR-006, research.md item 4). `activeGame`, `pendingGameSwitch`,
`rosterRemovalNotice`, and the rest of the state shape are unchanged from
`001-select-game`.

## New (infrastructure-internal, not domain): regional-form and DLC lookup tables

Both live entirely inside their owning adapter — not exposed through any
port, not visible to `domain`/`application` (Constitution Principle VI):

- `PokeApiGameCatalogRepository._dlcParentVersionGroup` (already exists,
  `004`) gains one entry: `'mega-dimension': 'legends-za'` (US2, FR-007,
  research.md item 5).
- `PokeApiPokedexRepository._regionalFormSuffixByGameId` (**NEW**,
  `Map<String, String>`): `Game.id` → regional-form suffix (`'alola'`,
  `'galar'`, `'hisui'`, `'paldea'`, …), consulted by `_buildEntry` before
  falling back to species-level `is_default` (US1, FR-014/FR-015,
  research.md item 9).

## New (presentation-internal, not domain): bundled type-icon lookup

`presentation/team_builder/widgets/pokedex_type_filter.dart` (or a small
sibling constants file) gains a `Map<String, String>` from `PokemonType.id`
to a bundled asset path under `assets/pokemon_types/` (US4, FR-017/FR-018,
research.md item 3). Presentation-only; `PokemonType` itself gains no new
field, since the icon is a display concern keyed by the type's existing
stable `id`, not a property of the type as PokeAPI models it.
