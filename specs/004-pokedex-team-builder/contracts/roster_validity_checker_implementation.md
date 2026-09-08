# Contract Amendment: `RosterValidityChecker` (real implementation)

**Port defined by**: `001-select-game`
(`domain/game_selection/ports/roster_validity_checker.dart`) —
unchanged by this feature. This document records this feature's
*implementation* of that pre-existing port, not a change to its
interface.

## Background

`001-select-game` declared `RosterValidityChecker` and shipped it with
a placeholder adapter, `AlwaysValidRosterChecker`, whose doc comment
says explicitly: *"Replace this adapter with the real implementation
when the team-building bounded context lands — the port and the
`SwitchGame` use case that depends on it do not need to change."* This
feature is that bounded context.

## Interface (unchanged, reproduced for reference)

```dart
abstract class RosterValidityChecker {
  Future<List<String>> validFor({
    required Game game,
    required List<String> rosterPokemonIds,
  });
}
```

## Implementing adapter (this feature)

`infrastructure/team_builder/pokedex_roster_validity_checker.dart`
implements `RosterValidityChecker` as:

1. Fetch, via `PokedexRepository`, the set of Pokémon ids obtainable in
   `game` — its regional Pokédex plus **all** of its DLC Pokédexes
   (`PodkedexView(useNationalDex: false, activeDlcIds: game.dlcs.map((d)
   => d.id).toSet())`), regardless of whatever National Dex/DLC
   *display* toggles the user currently has set in the UI
   (research.md item 5 — availability is a fact about the game, not a
   UI preference).
2. Return the subset of `rosterPokemonIds` present in that set.

## Contract rules (specific to this implementation)

1. **National Dex is never used for validity**: since every
   nationally-numbered species obtainable in `game` is already covered
   by its regional + DLC dexes, checking against the national dex would
   only ever be redundant or (incorrectly) more permissive — it MUST
   NOT be used here.
2. **Failure behavior**: if the underlying `PokedexRepository` throws
   `PokedexUnavailable`, this method propagates the failure rather than
   defaulting to "everything valid" or "everything invalid" — `SwitchGame`
   (the sole caller) is expected to surface this the same way it already
   surfaces other failures reachable from its use-case boundary.

## Test doubles

Existing and new tests exercising `SwitchGame` continue to use a fake
`RosterValidityChecker` directly (as `switch_game_test.dart` already
does) — they are unaffected by this implementation change, per the
`AlwaysValidRosterChecker` doc comment's own guarantee. A new,
dedicated test suite covers `PokedexRosterValidityChecker` itself
against a fake `PokedexRepository`.
