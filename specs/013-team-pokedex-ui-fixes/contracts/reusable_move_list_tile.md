# Contract: `MoveListTile` shared between the move selector and the customization card

**Covers**: FR-013. User Story 5.

## API

```dart
// move_selection_sheet.dart — promoted from private `_MoveListTile`
class MoveListTile extends StatelessWidget {
  const MoveListTile({
    super.key,
    required this.move,
    required this.l10n,
    required this.onTap,
    this.trailing,
  });

  final Move move;
  final AppLocalizations l10n;
  final VoidCallback onTap;

  /// Rendered at the end of the row, after the PP/power/description
  /// column — `null` (default) renders exactly as the move-selection
  /// sheet's own rows always have. The customization card passes its
  /// existing "clear this move" icon button here.
  final Widget? trailing;

  @override
  Widget build(BuildContext context) { /* unchanged body, + trailing at the end of the Row */ }
}
```

## Call sites

- `MoveSelectionSheet`'s `ListView.separated` `itemBuilder`: unchanged call (`MoveListTile(move: move, l10n: l10n, onTap: ...)`), `trailing` omitted.
- `PokemonCustomizationCard`'s `_MoveSlotTile` — its **filled**-slot branch (`move != null`) is replaced by `MoveListTile(move: move, l10n: l10n, onTap: onTap, trailing: onClear == null ? null : IconButton(...))`, reusing the exact same `IconButton` (icon, `visualDensity`, `padding`, `constraints`, tooltip) it already builds today. The **empty**-slot branch (the dashed "add a move" affordance, `move == null`) is unchanged — it stays its own small widget/branch, since it has no equivalent in the selector.

## Test Expectations

- `move_selection_sheet_test.dart`: unchanged expectations still pass (name/type/PP/power/description render, tapping a row calls `onSelected`) — proves the promotion didn't change the selector's own behavior.
- `pokemon_customization_card_test.dart`: a filled move slot renders the move's name/type/PP/power/description (now via `MoveListTile`) *and* its clear button (via `trailing`); tapping the row still opens the move-selection sheet for that slot; tapping the clear button still calls `onClearMoveSlot` for that slot and does not also trigger `onTap`.
