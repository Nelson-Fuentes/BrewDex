# Contract Amendment: `PokedexRepository` (originally defined in `004-pokedex-team-builder`)

**Original contract**: [`../../004-pokedex-team-builder/contracts/pokedex_repository.md`](../../004-pokedex-team-builder/contracts/pokedex_repository.md)

**Status**: Non-breaking. `fetchPokedex`'s signature
(`Future<List<PokedexEntry>> fetchPokedex({required Game game, required
PokedexView view, required String languageCode})`) is unchanged. This
amendment (a) corrects the behavior behind two of the original contract's
rules, and (b) adds one new field to the returned `PokedexEntry` values.

## What changes

### 1. `PokedexEntry` gains `homeSpriteUrl` (US6, FR-019/FR-020)

```diff
 PokedexEntry(
   pokemonId: ...,
   displayName: ...,
   pokedexNumber: ...,
   spriteUrl: ...,
+  homeSpriteUrl: ...,
   typePrimary: ...,
   typeSecondary: ...,
   introducedGeneration: ...,
   sourceTag: ...,
 )
```

Resolved from `pokemon.sprites.other.home.front_default` (verified live
against PokeAPI, 2026-08-23, present at that path for every species
spot-checked during planning). `null` when absent — same "no sprite
available" placeholder contract `spriteUrl` already has (original
contract, FR-005), just for the HOME-specific field.

### 2. Rule 3 ("View determines numbering, not just filtering") is narrowed, not overturned (US5, FR-010)

The original rule 3 says a national-dex view returns *the* national
dataset with national numbering. That numbering guarantee is unchanged.
What was under-specified is *which* species populate that dataset: the
original implementation fetched PokeAPI's entire `pokedex/national/`
resource unfiltered. This amendment adds:

> **3a. National Dex scope**: when `view.useNationalDex` is `true` and
> `game`'s generation is eligible, the returned entries MUST be limited to
> species whose `introducedGeneration` is at or before `game.generation`
> (using the new `generationOrdinal` domain helper — `data-model.md`).
> A species from a later generation than `game.generation` MUST NOT
> appear, even though PokeAPI's `pokedex/national/` resource lists it.

This is additive filtering on top of the existing national fetch — it
does not change the *numbering* rule 3 already guarantees, only which
subset of nationally-numbered species is returned for a given game.

### 3. New rule: regional-form priority (US1, FR-014/FR-015)

> **7. Regional form priority**: for a species with a region-specific
> variety applicable to `game` (per the adapter's game-id → suffix table,
> `data-model.md`), every field derived from the *Pokémon-level* resource
> (`spriteUrl`, `homeSpriteUrl`, `typePrimary`, `typeSecondary`) MUST be
> derived from that regional variety, not from the species-level default
> variety. `displayName` is unaffected — it is resolved from the
> *species-level* resource (`pokemon-species`), which PokeAPI (and the
> in-game Pokédex it models) does not vary by regional form: Kanto and
> Alola Rattata share the one species display name "Rattata". A species
> with no applicable regional variety for `game` is unaffected in every
> field — its existing species-level default variety is used exactly as
> before.

## Why this is safe to amend (not a new port)

- `PokedexEntry.pokemonId`'s identity contract (original rule 6) is
  unchanged either way — a regional-form entry still reports the
  species id, not a form-specific id, so `TeamRosterStore`/
  `RosterValidityChecker` matching (which key off `pokemonId`) needs no
  change.
- Rules 1 ("no partial results"), 2 ("sorted output"), 4 ("ineligible
  National Dex requests are regional"), and 5 ("DLC entries are
  additive") are all unchanged and continue to hold for the narrowed
  national-dex result and for the regional-form-adjusted entries.
- The only consumers of this port — `GetPokedex`
  (`application/team_builder`) and `PokedexRosterValidityChecker`
  (`infrastructure/team_builder`) — already treat the returned list
  opaquely (fetch, filter, or check membership by `pokemonId`); neither
  needs to change to benefit from the corrected scope/priority.

## Implementing adapter changes (this feature)

`PokeApiPokedexRepository`:
- Still resolves DLC/regional/national refs exactly as before
  (`_resolveDexRefs`, unchanged).
- After merging raw entries and before returning, drops any entry whose
  resolved `introducedGeneration` ordinal exceeds `game.generation`'s
  ordinal, when the active view is the national dex (item 6, research.md).
- In `_buildEntry`, consults `_regionalFormSuffixByGameId` (new,
  adapter-local) before falling back to the species' `is_default`
  variety (item 9, research.md).
- In `_buildEntry`, additionally reads
  `pokemonBody['sprites']['other']['home']['front_default']` from the
  same already-fetched `pokemon` resource used for `spriteUrl`/`types` —
  no extra HTTP request (item 10, research.md).

These remain internal to the adapter and MUST NOT appear in the domain or
application layers (Constitution Principle VI).

## Test doubles

Unchanged: domain and application tests use a fake `PokedexRepository`
(via `mocktail`) returning fixed `List<PokedexEntry>` values (now
including `homeSpriteUrl` in fixtures) or throwing `PokedexUnavailable`.

## Test impact

- `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart`
  gains cases for: national-dex scope excluding a later-generation
  species; regional-form variety selection for a mapped game/species pair
  (e.g. Sun/Moon + Rattata → Alola form fields); `homeSpriteUrl`
  resolution and its `null` fallback.
- `test/infrastructure/team_builder/pokeapi_pokedex_repository_full_dex_test.dart`
  (**NEW**) sweeps a full regional/national dex fixture asserting every
  entry's `pokedexNumber` is numeric and every entry resolves without
  error — the regression net for the still-unreproduced "numbers as
  words" report (research.md item 8').
