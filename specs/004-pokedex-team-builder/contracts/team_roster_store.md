# Port Contract: `TeamRosterStore`

**Layer**: Defined in `domain/team_builder/ports`. Implemented in
`infrastructure/team_builder` (`LocalTeamRosterStore`), consumed only by
`application/team_builder` use cases (`AddPokemonToTeam`,
`RemovePokemonFromTeam`) and read by the composition root (`main.dart`)
to seed `GameSelectionCubit.initialRosterPokemonIds` on each visit to
the game-selection screen (research.md item 4).

## Purpose

Persists the in-progress team's roster (`TeamBuildingSession.rosterPokemonIds`)
across sessions, the same way `SelectedGameStore` already persists the
selected game (`001-select-game`, FR-008; spec Assumptions).

## Interface

```dart
abstract class TeamRosterStore {
  /// Returns the persisted roster, or an empty list if nothing has
  /// been saved yet.
  Future<List<String>> readRosterPokemonIds();

  /// Persists [rosterPokemonIds] as the current roster, replacing
  /// whatever was previously stored.
  Future<void> writeRosterPokemonIds(List<String> rosterPokemonIds);
}
```

## Contract rules

1. **Whole-list replacement**: `writeRosterPokemonIds` replaces the
   entire stored roster — it is not an incremental append/remove
   operation. `AddPokemonToTeam`/`RemovePokemonFromTeam` compute the
   full new list in the domain/application layer and write it back
   whole, keeping this port trivially simple (Principle I).
2. **No ordering guarantee beyond what is written**: the store returns
   the list in the same order it was last written in (slot order is
   meaningful — FR-001/FR-002 pre-populate slots in order), but does not
   itself enforce the 6-item maximum; that invariant belongs to
   `AddPokemonToTeam` (FR-009), not this port.
3. **Never throws for "nothing saved yet"**: an empty/missing
   underlying value resolves to `[]`, not an error — an empty roster is
   a normal, valid state (a user who has not added any Pokémon yet).

## Implementing adapter (this feature)

`LocalTeamRosterStore` implements this port using `shared_preferences`,
storing the list as a single JSON-encoded array of strings under one
key — the same storage granularity `LocalSelectedGameStore` already
uses for the selected game id (research.md item 4).

## Test doubles

Domain and application tests use a fake/in-memory implementation (via
`mocktail` or a simple `Map`-backed fake) so `AddPokemonToTeam`/
`RemovePokemonFromTeam` tests need neither Flutter nor real storage.
