# Contract: `moveIds` survive a Mega/Dinamax toggle

**Covers**: FR-001, FR-002. User Story 1 (P1 — data loss).

## Behavior

`TeamBuilderCubit.fetchMovepoolForActiveSlot`
(`presentation/team_builder/cubit/team_builder_cubit.dart`):

```dart
// Before:
final varietyId = resolveSlotVarietyId(entry, rosterEntry);

// After:
final varietyId = (rosterEntry.megaActive || rosterEntry.gigamaxActive)
    ? entry.pokemonId // base variety — Mega/Gigamax has no learnset of its own
    : resolveSlotVarietyId(entry, rosterEntry); // unchanged for a plain
        // alternate-form switch (research.md Decision 3).
```

The rest of the method (`learnableIds`, `cleanedMoveIds`, the
`_sameMoveIds` diff/persist) is unchanged — it still clears a `moveIds`
entry that is genuinely no longer learnable (e.g. after switching to a
different *selectable form*, which does change the base variety id via
`entry.formVarietyId` and rightly still re-resolves against the new base).

## Not amended

- `resolveSlotVarietyId` (`slot_sprite_resolution.dart`) — unchanged;
  still correct for sprite/types/stats, and for the "switched to a
  different selectable form" movepool case (a real base-variety change).
- The "drop an entry no longer in the movepool" behavior itself — kept,
  since it's still correct for the alternate-form case that motivated it.

## Test Expectations

- `team_builder_cubit_test.dart`: given a roster entry with 4 `moveIds`
  already set, calling the Mega-toggle flow (`updateRosterEntry` with
  `megaActive: true` on the active slot) leaves `moveIds` unchanged after
  `fetchMovepoolForActiveSlot` resolves — regression test that fails
  against the pre-fix code (asserts the mocked `GetMovepool` is invoked
  with the **base** `varietyId`, not the Mega variety id).
- Same test repeated for `gigamaxActive: true` (Dinamax/Gigamax).
- Same test repeated for deactivating Mega/Gigamax (`false` again) —
  `moveIds` still intact.
- A control test: switching to a genuinely different *selectable form*
  (`formVarietyId` change, not Mega/Gigamax) still clears a `moveIds` entry
  that isn't learnable on the new form — proves the fix didn't regress the
  `011` behavior it's built alongside.
