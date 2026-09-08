# Contract: Movimientos por Defecto al Agregar un Pokémon

**Covers**: FR-005, FR-006, FR-007, FR-008 (User Story 3)

## Rule

`MovepoolRepository.fetchDefaultMoveset({varietyId, game, languageCode})` returns, ordered ascending by learn level, the up-to-4 moves `varietyId` learns by level-up (`move_learn_method.name == 'level-up'` in some `version_group_details` entry whose `version_group.name == game.id`) at the **highest** levels among all its level-up moves for that exact game — never a move whose only qualifying learn method for that game is TM/egg/tutor/other.

`TeamBuilderCubit.addPokemon(pokemonId)`, after the new roster entry is appended, calls `GetDefaultMoveset` for that entry's `pokemonId` + `state.game` and sets the new entry's `RosterEntry.moveIds` from the result (padded with `null` up to 4) before persisting. A `PokedexUnavailable` from this step does not fail the add — the Pokémon still joins the team, with empty move slots.

This assignment happens exactly once, at add time. No other Cubit method (`updateRosterEntry`, `fetchMovepoolForActiveSlot`, `selectMove`, `clearMoveSlot`) ever re-runs it — a later manual change to `moveIds` (by the user, or by `011`'s own invalidation-on-form-change rule clearing a now-invalid slot) is never overwritten back to the automatic selection.

## Test Expectations (Repository)

- A fixture `pokemon` body with `moves[]` entries at levels 1, 15, 36, 50, 58 (all level-up, target game) returns exactly the 4 highest-level ones (15, 36, 50, 58) in ascending order — dropping level 1.
- A move whose only `version_group_details` entry for the target game has `move_learn_method.name == 'machine'` (TM) is excluded even if it also appears at another game's level-up entry.
- A `varietyId` with no level-up moves at all for the target game returns `[]`.

## Test Expectations (Cubit)

- `addPokemon('bulbasaur')` against a fixture `GetDefaultMoveset` mock returning `[tackle, growl, vineWhip, razorLeaf]` results in the new roster entry's `moveIds == ['tackle', 'growl', 'vineWhip', 'razorLeaf']` (or the appropriate subset/padding if fewer than 4 are returned).
- A subsequent manual `selectMove`/`clearMoveSlot` call on that same slot is unaffected by — and never re-triggers — this automatic assignment.
