# Contract: Two-pane layout is an exact 50/50 split

**Amends**: `lib/presentation/team_builder/widgets/team_builder_two_pane_layout.dart`.

## Rule

In the `ScreenSize.expanded` two-pane layout, at every available width, the slots column and the Pokédex column MUST measure the same width — each exactly half of the width remaining after the `VerticalDivider` between them (a 1px, zero-flex divider does not count against either side's half).

## Before (007/008)

```dart
final slotsColumnWidth = constraints.maxWidth.isFinite
    ? (constraints.maxWidth * 0.3).clamp(280.0, 420.0)
    : 280.0;
Row(children: [
  SizedBox(width: slotsColumnWidth, child: ...),
  const VerticalDivider(width: 1),
  Expanded(child: ...), // gets whatever's left — more than half above ~933px
]);
```

## After (this contract)

```dart
Row(children: [
  Expanded(flex: 1, child: ...slots column...),
  const VerticalDivider(width: 1),
  Expanded(flex: 1, child: ...Pokédex column...),
]);
```

No `LayoutBuilder`, no clamp, no fraction constant — both sides are always exactly equal.

## Verification

A widget test renders `TeamBuilderTwoPaneLayout` at two different window widths (e.g. 900px and 2400px) and asserts, at each, the measured width of the slots column (`TeamSlotRow`'s ancestor) equals the measured width of the Pokédex column (within the 1px divider), and that the two widths are equal to each other at both window sizes.
