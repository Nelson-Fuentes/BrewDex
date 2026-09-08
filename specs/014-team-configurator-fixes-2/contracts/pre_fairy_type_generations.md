# Contract: Pre-Fairy types for Generation V-or-earlier games

**Covers**: FR-006, FR-007. User Story 5.

## Behavior

`PokeApiPokedexRepository` (the method resolving `typePrimary`/
`typeSecondary` around the existing `pokemon['types']` read):

1. Read `pokemon['past_types']` (a list of `{generation: {name, url},
   types: [...]}`, same shape as `pokemon['types']`'s entries) alongside
   the existing `pokemon['types']` read.
2. For each `past_types` entry, resolve its `generation` the same way
   species-introduction generation is already resolved elsewhere in this
   file (reuses the existing `generationCache`/`_fetchSpeciesGenerationOnly`-
   style helper or an equivalent for the `generation` ref inside
   `past_types`).
3. If the active game's generation ordinal (`generationOrdinal(game.
   generation)`, already used in this file) is **earlier than** a
   `past_types` entry's generation ordinal, use that entry's `types`
   instead of `pokemon['types']` for `typePrimary`/`typeSecondary`.
4. If multiple `past_types` entries could apply (a species that changed
   type more than once), use the entry whose generation is the smallest
   ordinal *still greater than* the active game's generation — i.e. the
   type set that was actually in effect during that generation.
5. If no `past_types` entry applies (active game's generation is at or
   after every entry, or the species has no `past_types` at all), fall
   back to `pokemon['types']` exactly as today.

## Not amended

- `introducedGeneration` (species-introduction gating, already present) —
  unrelated concern, unchanged.
- Every other field resolved from `pokemon`/`pokemon-species` — unchanged.

## Test Expectations

- `pokeapi_pokedex_repository_test.dart`: a fixture species (Clefairy-
  shaped: `types: [Fairy]`, `past_types: [{generation: generation-vi,
  types: [Normal]}]`) resolved for a Generation V game (e.g.
  `black-white`) yields `typePrimary == Normal`, `typeSecondary == null`.
- The same fixture resolved for a Generation VI+ game (e.g. `x-y`) yields
  `typePrimary == Fairy`, unchanged from today.
- A fixture species with no `past_types` is unaffected (falls through to
  `pokemon['types']`) for every generation.
- A roster Pokémon already selected with Fairy type: switching the active
  game to a Generation V-or-earlier one updates its displayed type(s)
  without requiring the user to re-select it (FR-007's "se actualizan").
