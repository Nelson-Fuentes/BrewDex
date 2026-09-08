# Contract Amendment: `PokedexRepository` (originally `004-pokedex-team-builder`, previously amended by `005-selector-pokedex-fixes`)

**Chain**: [`004` original](../../004-pokedex-team-builder/contracts/pokedex_repository.md) → [`005` amendment](../../005-selector-pokedex-fixes/contracts/pokedex_repository_amendment.md) → this document.

**Status**: Non-breaking. `fetchPokedex`'s signature is unchanged:
`Future<List<PokedexEntry>> fetchPokedex({required Game game, required
PokedexView view, required String languageCode})`. This amendment (a)
corrects two more behavior rules, (b) widens `PokedexEntry` with the
fields Historia 9–12 need, and (c) documents the `PokemonType` field
addition Historia 9 needs.

## What changes

### 1. `PokedexEntry.pokedexNumber`'s invariant is relaxed (Historia 1, FR — implicit correctness requirement underlying every FR that reads a Pokédex number)

```diff
- assert(pokedexNumber > 0, ...)
+ assert(pokedexNumber >= 0, ...)
```

`0` is now a valid regional number (Victini, Unova Dex `#000` —
research.md item 1). Every existing caller that displays/sorts by
`pokedexNumber` already handles it as a plain `int`; no downstream
change needed beyond this constructor relaxation.

### 2. X/Y (and any future multi-pokedex game) numbering rule (Historia 3, FR-003/FR-004)

New rule:

> **8. Multi-pokedex renumbering**: when `_resolveDexRefs` resolves more
> than one **regional** (non-national, non-DLC) pokedex ref for a game
> (X/Y today — `kalos-central`/`kalos-coastal`/`kalos-mountain`), the
> returned `pokedexNumber` for species from the *second and further*
> refs MUST be offset past the running maximum number already assigned
> from the refs before it, in ref order, so the final list has no
> duplicate number and stays ascending end-to-end. A game with exactly
> one regional ref (every other game today) is unaffected — its species
> keep PokeAPI's own `entry_number` exactly as before.

### 3. National Dex eligibility gains one game-id exception (Historia 6, FR-013)

`PokedexView.isNationalDexEligible` (previously `bool
Function(Generation)`) becomes `bool Function(Game)`:

```diff
- bool isNationalDexEligible(Generation generation) =>
-     _nationalDexEligibleGenerationIds.contains(generation.id);
+ bool isNationalDexEligible(Game game) =>
+     _nationalDexEligibleGenerationIds.contains(game.generation.id) ||
+     game.id == 'brilliant-diamond-shining-pearl';
```

Every call site (`_resolveDexRefs`, `TeamBuilderCubit.toggleNationalDex`,
`TeamBuilderPage`'s conditional `NationalDexToggle`) already has a `Game`
in scope — none needs a new value threaded in, only the call argument
changes from `game.generation` to `game`.

### 4. Sprite resolution gains a version-key lookup table (Historia 4, FR-005–FR-009)

> **9. Sprite version-key resolution**: `_resolveSpriteUrl` MUST resolve
> the sprite bucket key to look up in `sprites.versions[generation.id]`
> via a new adapter-local table (`_spriteVersionKeyByGameId`,
> `data-model.md`) that defaults to `game.id` (today's behavior,
> unchanged for every game not in the table) and overrides it for
> `gold-silver` → `gold`, `red-green-japan` → `red-blue`, `blue-japan` →
> `red-blue` (research.md item 3). The existing "fall through to
> `front_default`" behavior for a still-missing bucket is unchanged —
> this table only fixes the three reported mismatches, it does not
> guarantee a versioned sprite for every game.

### 5. `PokedexEntry` gains form/gender/cosmetic/shiny fields (Historia 9–12)

```diff
 PokedexEntry(
   pokemonId: ...,
   displayName: ...,
   pokedexNumber: ...,
   spriteUrl: ...,
   homeSpriteUrl: ...,
+  homeSpriteShinyUrl: ...,
+  homeSpriteFemaleUrl: ...,
+  homeSpriteShinyFemaleUrl: ...,
+  genderRate: ...,
+  hasGenderDifferences: ...,
+  selectableForms: ...,
+  megaForm: ...,
+  gigamaxForm: ...,
+  cosmeticVariants: ...,
   typePrimary: ...,
   typeSecondary: ...,
   introducedGeneration: ...,
   sourceTag: ...,
 )
```

Field-by-field resolution and PokeAPI source paths: `data-model.md`,
research.md items 9–13. All are resolved from response bodies
`_buildEntry` **already fetches** (the species body and the principal
variety's `pokemon` body) plus one additional `pokemon-form` fetch per
non-principal variety (only when the species actually has one — most
species make zero extra requests).

### 6. New rule: DLC-unlocked forms don't duplicate the dex entry (Historia 5, FR-028/FR-029)

> **10. DLC-unlocked form aggregation**: when a species already produced
> a `PokedexEntry` from an earlier-processed ref (base or another DLC),
> and a later-processed active-DLC ref's raw `pokemon_species` listing
> for that same species resolves to a **different** variety than the one
> already backing that entry, the existing entry MUST gain that variety
> as an additional `SelectableForm` (`requiresDlcId` set to that DLC's
> id) rather than producing a second `PokedexEntry`. This composes with
> rule 8/regional-form-priority unchanged — the *principal* variety
> selection for `spriteUrl`/`typePrimary`/etc. is untouched by this rule.

## Why this is still safe to amend (not a new port)

- `pokemonId` identity (original rule 6) is unchanged — every new field
  is additive per-entry data, not a new identity.
- Rules 1, 2, 4, 5 (no partial results, sorted output, ineligible
  national-dex falls back to regional, DLC entries are additive) are
  unchanged.
- `GetPokedex` and `PokedexRosterValidityChecker` — the port's only two
  consumers — still treat the list opaquely (fetch, filter, or check
  `pokemonId` membership); neither needs a code change to keep working.
  `PokedexRosterValidityChecker` specifically benefits from rule 1's fix
  for free (it was silently subject to the same Victini-assertion
  failure for any switch *into* Black/White or Black 2/White 2 —
  research.md item 14).

## Implementing adapter changes (this feature)

`PokeApiPokedexRepository`:
- `PokedexEntry` construction: relax the assertion (item 1).
- `_resolveDexRefs`/merge: track a running max-number offset per
  processed ref when more than one regional ref is present (item 2); no
  change to DLC/national ref resolution itself.
- `isNationalDexEligible` call sites pass `game` instead of
  `game.generation` (item 3); the function itself moves the generation
  check plus the new game-id check into one boolean.
- `_resolveSpriteUrl`: consult `_spriteVersionKeyByGameId` before
  indexing into `versions[...]` (item 4).
- `_buildEntry`: resolve the new `PokedexEntry` fields from
  already-fetched bodies plus, when the principal variety's species has
  other varieties, one `pokemon-form` fetch per variety to classify
  `template`/`mega`/`gigamax` and read `pokemon.forms` for cosmetic
  variants (items 5, research.md items 10–13).
- Species-merge loop (`rawById`): when a later ref names an
  already-seen species under a different variety, attach that variety as
  an additional `SelectableForm` on the existing raw entry instead of
  creating a new one (item 6/research.md item 6).

All of the above stay internal to the adapter — nothing here leaks a
PokeAPI shape into `domain`/`application` (Constitution Principle VI).

## `PokemonType` amendment

```diff
 class PokemonType {
   final String id;
   final String label;
+  final int numericId;
 }
```

Resolved from the `type` resource's own `id` field, already fetched by
`_fetchType` — no new HTTP call (research.md item 9).

## Test doubles

Unchanged mechanism: a fake `PokedexRepository` (via `mocktail`)
returning fixed `List<PokedexEntry>` (fixtures now populate the new
fields) or throwing `PokedexUnavailable`.

## Test impact

- `pokeapi_pokedex_repository_test.dart`: `pokedexNumber == 0` no longer
  throws; X/Y-shaped fixture (3 regional refs) renumbers without
  collision; `brilliant-diamond-shining-pearl` reports eligible while
  `sword-shield`/`legends-arceus` (generation-viii, not in the id
  exception) still don't; `gold-silver`/`red-green-japan`/`blue-japan`
  fixtures resolve the *correct* mapped sprite bucket; a Charizard-shaped
  fixture resolves `selectableForms` (template forms only) plus separate
  `megaForm`/`gigamaxForm`; a Pikachu-shaped fixture resolves
  `genderRate`/`hasGenderDifferences`/female sprite fields; a
  Vivillon-shaped fixture resolves 20 `cosmeticVariants`, a
  Spinda-shaped one resolves zero; a two-DLC-unlocking-the-same-species
  fixture attaches both as `SelectableForm`s on one entry, not two
  entries.
- `pokeapi_pokedex_repository_full_dex_test.dart` (existing, from `005`):
  extend the swept fixture set to include Black/White's and Black 2/
  White 2's real Victini-at-zero shape, so this regression net now
  covers Historia 1 too.
