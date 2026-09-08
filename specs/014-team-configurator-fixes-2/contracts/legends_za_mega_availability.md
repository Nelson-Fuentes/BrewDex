# Contract: Legends Z-A's Mega Evolution is always active, not opt-in DLC

**Covers**: FR-005. User Story 4.

## Behavior

`_dlcParentVersionGroup` (`infrastructure/game_selection/
pokeapi_game_catalog_repository.dart`) keeps its existing entry:

```dart
const _dlcParentVersionGroup = {
  ...
  'mega-dimension': 'legends-za',
};
```

**New**: when the active game's id is `legends-za`, its `mega-dimension`
Pokédex source is treated as always-active — either:

- `TeamBuilderCubit`/the view-model that seeds `TeamBuilderView.activeDlcIds`
  defaults `mega-dimension` into that set whenever `game.id == 'legends-za'`
  on `load()`, with no user-facing toggle required to turn it off (Mega
  Evolution isn't optional content in this game); or
- `PokeApiPokedexRepository`'s DLC-Pokédex-fetch step folds `mega-dimension`
  into the unconditional base fetch specifically for `legends-za`, bypassing
  the `activeDlcIds` intersection for that one version-group.

(Exact mechanism is an implementation choice for `/speckit-tasks`; either
satisfies the same observable contract below.) Every other entry in
`_dlcParentVersionGroup` (`the-isle-of-armor`, `the-crown-tundra`,
`the-teal-mask`, `the-indigo-disk`) keeps requiring an explicit
`activeDlcIds` opt-in, unchanged.

`kMegaEvolutionEnabledGameIds` (`domain/team_builder/value_objects/
form_availability.dart`) is unchanged — `legends-za` is already listed; this
fix is what makes that listing actually observable in the UI.

## Not amended

- The Sword/Shield Gigamax gate (`kGigamaxEnabledGameIds`) — unaffected,
  no DLC involved.
- The opt-in DLC toggle UI itself, for the four still-optional DLCs above.

## Test Expectations

- `pokeapi_game_catalog_repository_test.dart` (or the pokedex-repository
  test covering form resolution): fetching Legends Z-A's Pokédex for a
  species with a known Mega form returns a non-null `megaForm` **without**
  the test explicitly setting `activeDlcIds` to include `mega-dimension`.
- A Pokémon in the team, in Legends Z-A, with a known Mega form: the
  customization card's Mega toggle is present and functional (widget-level
  regression test alongside the existing Mega/Gigamax card tests).
- Existing opt-in-DLC tests (Isle of Armor/Crown Tundra/Teal Mask/Indigo
  Disk) continue to require their toggle — unaffected by this change.
