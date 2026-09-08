# Contract: Legends Z-A movepool fallback for data-sparse species

**Covers**: FR-004. User Story 3.

## Behavior

`PokeApiMovepoolRepository.fetchMovepool`/`fetchDefaultMoveset`
(`infrastructure/team_builder/pokeapi_movepool_repository.dart`):

1. Filter `pokemon.moves[].version_group_details` by `version_group.name ==
   game.id`, as today.
2. **Implemented**: if that filter yields zero moves for the requested
   species, and `game.id` is one for which this fallback is enabled
   (`_movepoolFallbackGameIds = {'legends-za'}` — the only game with a
   confirmed upstream data gap), fall back to the union of every move this
   species has *any* `version_group_details` entry for, across every game
   PokeAPI has data for (not a single "closest" game — simpler, and a
   species' overall learnset is fairly stable release-to-release) instead
   of returning an empty list. `fetchDefaultMoveset` applies the same
   fallback to its level-up computation: when the exact-match pass finds
   no level-up entries, it recomputes the highest level-up level per move
   across every game instead of only `game.id`.
3. Log via `developer.log` (same pattern already used in this file) when
   the fallback path is taken, naming the species and the fallback
   version-group used, so a future PokeAPI data fix is easy to notice.

## Not amended

- The per-game exact-match filter stays the primary path for every other
  game — this is a narrow, logged fallback, not a general "merge multiple
  games' movepools" behavior.
- `fetchDefaultMoveset`'s level-up-only selection logic is unchanged; the
  fallback only changes *which* game's `version_group_details` entries are
  read before that selection runs.

## Test Expectations

- `pokeapi_movepool_repository_test.dart`: a fixture species with zero
  `version_group_details` entries for `legends-za` but non-empty entries
  for a nearby fallback version-group returns a non-empty movepool for
  `legends-za`, and a `developer.log` fallback message is emitted.
- A fixture species with non-empty `legends-za` entries is unaffected
  (fallback path is not taken; asserted via a spy/no-log-emitted check or
  equivalent).
- A regression test specifically for Feraligatr's real reported symptom:
  `fetchMovepool(varietyId: 'feraligatr', game: legendsZaGame, ...)`
  returns a non-empty list against recorded fixture JSON matching the
  actual empty-for-`legends-za` shape observed from PokeAPI.
