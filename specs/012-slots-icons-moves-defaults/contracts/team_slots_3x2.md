# Contract: Cuadrícula de Slots 3×2 (Web)

**Covers**: FR-001, FR-002, FR-003 (User Story 1)

## Rule

`TeamSlotRow` with `shrinkWrap: false` (the two-pane/web layout's slots column) MUST render its 6 slots as a `GridView` with `crossAxisCount: 3` (3 columns × 2 rows), sized via a `childAspectRatio` computed from the actual available width and height of its container — not the implicit 1.0 (square) aspect `GridView.count` uses. `TeamBuilderTwoPaneLayout` MUST NOT wrap the slots-side `TeamSlotRow` in the previous `Padding(all: 16)` (or any padding large enough to read as wasted space) — the grid MUST fill the slots column's available box.

`TeamSlotRow` with `shrinkWrap: true` (compact/medium layout) is unchanged: `crossAxisCount: 3`, self-sizing, square cells.

## Math

Given the slots column's available `width` and `height` (post-padding-removal), with `spacing = 8` (unchanged `mainAxisSpacing`/`crossAxisSpacing`):

```
cellWidth  = (width  - 2 * spacing) / 3
cellHeight = (height - 1 * spacing) / 2
childAspectRatio = cellWidth / cellHeight
```

## Test Expectations

- A `TeamSlotRow` with `shrinkWrap: false` pumped inside a `SizedBox` of a known width/height renders a `GridView` whose delegate is `SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, ...)`.
- The rendered `childAspectRatio` matches the formula above for the given test `SizedBox` dimensions (within floating-point tolerance).
- `TeamBuilderTwoPaneLayout`'s slots-side subtree contains no `Padding` wider than a small, deliberate value (e.g. ≤4) between the column's outer bound and the `TeamSlotRow`.
- A `TeamSlotRow` with `shrinkWrap: true` (default) still renders `crossAxisCount: 3` with the default square aspect (unchanged from before this feature).
