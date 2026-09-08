# Contract Amendment: `TeamRosterStore` (originally `004-pokedex-team-builder`)

**Status**: Breaking storage-shape change, non-breaking method names.
`readRosterPokemonIds()`/`writeRosterPokemonIds(...)` are renamed in
place to `readRoster()`/`writeRoster(List<RosterEntry> roster)` (the
method-name "PokemonIds" no longer describes the payload once it carries
more than an id — Constitution Principle III: a contract's name should
describe what it actually returns).

```diff
 abstract class TeamRosterStore {
-  Future<List<String>> readRosterPokemonIds();
-  Future<void> writeRosterPokemonIds(List<String> rosterPokemonIds);
+  Future<List<RosterEntry>> readRoster();
+  Future<void> writeRoster(List<RosterEntry> roster);
 }
```

## Storage shape

`LocalTeamRosterStore` (the only implementation) persists the same
single `shared_preferences` string key
(`team_builder.roster_pokemon_ids`), now JSON-encoding a list of small
objects (`RosterEntry.toJson`/`fromJson`, `data-model.md`) instead of a
list of bare strings:

```json
[
  {"pokemonId": "pikachu", "gender": "female", "isShiny": true},
  {"pokemonId": "rotom", "formVarietyId": "rotom-heat"}
]
```

Only non-default fields need to be written (a plain `{"pokemonId": "..."}`
is a fully valid entry) — keeps the persisted payload small for the
overwhelmingly common case of an unmodified slot.

## Migration

A pre-upgrade roster is a JSON array of bare strings, which fails to
`cast<Map<String, dynamic>>()` under the new decode path.
`LocalTeamRosterStore.readRoster()` already has a `catch`-and-treat-as-
empty fallback for any decode failure (existing behavior, unchanged
code path) — a stale pre-`006` roster is simply not carried forward,
same as any other corrupt-data case this store already tolerates. No
explicit migration code is written (Principle I: the existing fallback
already gives an acceptable, if not preserving, outcome — a user
reopens to an empty team once, not a crash).

## Consumers

- `AddPokemonToTeam`/`RemovePokemonFromTeam` (`application/team_builder`):
  signatures widen from `List<String>` to `List<RosterEntry>`
  parameter/return types; `AddPokemonToTeam` additionally accepts the
  new slot's initial `RosterEntry` fields (defaults applied per
  `data-model.md` items 11/12) instead of a bare `pokemonId` string.
- `TeamBuilderCubit`: `state.rosterPokemonIds` (the roster list) becomes
  `state.roster` (`List<RosterEntry>`); `state.rosterPokemonIds` stays
  available as a **derived getter** (`roster.map((e) =>
  e.pokemonId).toList()`) so `TeamSlotView`/`isTeamFull`/anything keying
  purely on species id doesn't need to change.
- `GameSelectionCubit`/`SwitchGame`/`RosterValidityChecker`
  (`game_selection`): **unchanged** — they only ever read/write species
  ids (`TeamBuildingSession.rosterPokemonIds` stays `List<String>`, see
  data-model.md); `GameSelectionCubit.refreshRoster()`'s reader callback
  projects `TeamRosterStore.readRoster()`'s result down to ids at that
  one seam.

## Test impact

- `local_team_roster_store_test.dart`: round-trips a `RosterEntry` with
  every field set; confirms a legacy bare-string-array payload decodes
  as empty rather than throwing.
- `add_pokemon_to_team_test.dart`/`remove_pokemon_from_team_test.dart`:
  updated fixtures use `RosterEntry`.
- `team_builder_cubit_test.dart`: `state.rosterPokemonIds` derived getter
  covered alongside the new `state.roster`.
