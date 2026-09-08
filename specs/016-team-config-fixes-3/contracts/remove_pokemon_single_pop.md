# Contract: Removing a Pokémon closes exactly one route

**Covers**: FR-006, FR-007. User Story 3.

## Requirement

`TeamBuilderPage._openCustomizationCard`'s `onRemove` callback (the
customization card's "Quitar del equipo" action) MUST cause **exactly one**
`Navigator` pop as a result of a single tap — closing only the
customization bottom sheet, never an additional route (in particular,
never `TeamBuilderPage`'s own route, which would land the user on the game
selection menu).

## Change

```dart
// Before (lib/presentation/team_builder/pages/team_builder_page.dart)
onRemove: () {
  cubit.removePokemon(slotIndex);
  Navigator.of(context).pop(); // `context` = the BlocBuilder's own
                                 // parameter (shadowing), races with
                                 // the reactive close below
},

// After
onRemove: () => cubit.removePokemon(slotIndex),
```

The sheet's own reactive close — already present for the "occupant went
away out from under the open sheet" case (`liveEntry == null` /
`liveRosterEntry == null` inside the `BlocBuilder`, deferred via
`addPostFrameCallback`, guarded by `Navigator.of(sheetContext).canPop()`) —
becomes the single, sole path that closes the sheet after a removal. It
already fires on every `TeamBuilderCubit` emission that leaves the slot
empty, which `removePokemon` always does, so no behavior is lost — only the
redundant, race-prone second pop is removed.

## Test Expectations (new)

- A widget/integration test that opens a customization card for an occupied
  slot, taps "Quitar del equipo", and asserts: (a) the customization sheet
  closes, (b) `TeamBuilderPage` (identified by its own `AppBar` title /
  `TeamSlotRow`) is still the topmost visible route — i.e. no second pop
  occurred — and (c) the slot is now empty.
- Repeat across multiple slots/positions in one test run (per spec.md's
  Independent Test for User Story 3) to catch the race regardless of which
  frame ordering a given test run happens to hit — since the bug is
  intermittent by nature, the regression test should not rely on a single
  attempt to prove the fix; asserting the *code path* no longer contains a
  duplicate pop (rather than only sampling runtime behavior once) is the
  primary guard, backed by this behavioral test as a secondary check.
- `pokemon_customization_card_test.dart`'s existing `onRemove` wiring tests
  (if any assert the old two-call shape) are updated to assert the new,
  single-call shape.
