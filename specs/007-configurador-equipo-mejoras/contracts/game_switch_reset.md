# Behavior Contract: Game selection always resets the team

Not a new port — an amendment to `GameSelectionCubit`'s existing public surface (`application`/`presentation` layers of `game_selection`). Documented because it **removes** public methods/state other code may reference (see `data-model.md`'s "Removed entirely" section).

## Trigger

Any call to `GameSelectionCubit.selectGame(game)` — including when `game == state.activeGame` (Clarifications Q1).

## Behavior

1. Persist `game` as the active selection (unchanged from today's `SelectGame` use case).
2. Write an empty roster (`TeamRosterStore.writeRoster(const [])`) unconditionally — no comparison against the previous roster, no partial carry-over.
3. Emit `GameSelectionState.copyWith(activeGame: game, rosterPokemonIds: const [])`.
4. Navigate straight to the armador (`TeamBuilderPage`) for `game` — no dialog, no intermediate confirmation step, no "removed Pokémon" notice.

## Removed public surface

| Removed | Replacement |
|---|---|
| `GameSelectionCubit.requestGameSwitch(game)` | none — call `selectGame(game)` directly |
| `GameSelectionCubit.cancelGameSwitch()` | none — there is no pending state to cancel |
| `GameSelectionCubit.confirmGameSwitch()` | none — `selectGame` does the persist+reset itself |
| `GameSelectionCubit.acknowledgeRemovalNotice()` | none — there is never a removal notice |
| `GameSelectionState.pendingGameSwitch` | none |
| `GameSelectionState.rosterRemovalNotice` | none |
| `_showConfirmSwitchDialog`/`_showRemovalNoticeDialog` (`game_selection_page.dart`) | none — tapping a `GameCard` calls `selectGame` and navigates immediately |
| `SwitchGame` use case, its reconciliation logic | none — reset is unconditional, nothing to reconcile |

`TeamBuildingSession` (the `{activeGame, rosterPokemonIds}` entity `SwitchGame` used to consume) may be deleted along with `SwitchGame` if nothing else in the codebase constructs it — verify with a repo-wide reference search before deleting during implementation.

## Test impact

- `game_selection_cubit_test.dart`: replace "requestGameSwitch stages a pending switch"/"confirmGameSwitch reconciles the roster" style tests with "selectGame always resets rosterPokemonIds to empty", parametrized over `game == activeGame` and `game != activeGame` (both reset).
- `game_selection_page_test.dart` (widget): tapping a `GameCard` never pumps an `AlertDialog`; navigation to the armador happens on the same tap, for both a fresh selection and a re-selection of the already-active game.
- Delete `switch_game_test.dart` (or the file testing it) along with the use case.
