# Contract: Alternar Megaevolución/Gigamax (fix)

**Covers**: FR-003 (User Story 2)

## Rule

In `PokemonCustomizationCard`, the Mega button's `onPressed` and the Gigamax button's `onPressed` MUST toggle their own state, not force it on:

```dart
// Mega
onPressed: () => onChanged(
  rosterEntry.copyWith(
    megaActive: !rosterEntry.megaActive,
    gigamaxActive: false,
  ),
),

// Gigamax
onPressed: () => onChanged(
  rosterEntry.copyWith(
    gigamaxActive: !rosterEntry.gigamaxActive,
    megaActive: false,
  ),
),
```

The mutual-exclusion with the other state (`gigamaxActive: false` when activating Mega, and vice versa) is unchanged from before this fix — only the toggled-vs-forced value for the button's own flag changes.

## Test Expectations

- Starting from `megaActive: false`, tapping Mega once yields `megaActive: true`.
- Tapping Mega a second time (now `megaActive: true`) yields `megaActive: false` — the slot's sprite/types/stats revert to the base form (already correctly recomputed by `resolveSlotSpriteUrl`/`resolveSlotTypes`/`resolveSlotStats` once `megaActive` is `false`; no change needed to those resolvers).
- This activate/deactivate cycle repeats correctly at least 5 times in a row (SC-002).
- Activating Gigamax while Mega is active still turns Mega off (existing mutual-exclusion behavior, unchanged).
