# Contract: Tamaño de los Slots del Equipo (Web)

**Covers**: FR-004, FR-005 (User Story 3)

## Rule

`TeamSlotRow`'s `GridView.count` MUST use `crossAxisCount: 2` when `shrinkWrap == false` (the two-pane/web layout's slots column), and MUST keep `crossAxisCount: 3` when `shrinkWrap == true` (the compact/medium single-column layout, unchanged). `TeamSlot`'s own `AspectRatio(aspectRatio: 1)` is unchanged — the tile stays square, just larger, since it now shares its row with one fewer sibling.

No change to `TeamBuilderTwoPaneLayout`'s 50/50 `Expanded(flex: 1)` split (010-layout-icons-stats-weaknesses) — this contract only touches the grid inside the already-half-width slots column.

## Test Expectations

- With `shrinkWrap: false`, a `GridView.count` widget under test exposes `crossAxisCount == 2`.
- With `shrinkWrap: true` (default), it still exposes `crossAxisCount == 3`.
- Measuring a rendered `TeamSlot`'s size in the two-pane layout at a fixed test viewport width shows it at least double the width it measured at before this change (same viewport, same available column width, only `crossAxisCount` changed 3→2).
