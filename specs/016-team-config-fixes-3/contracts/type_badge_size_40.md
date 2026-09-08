# Contract: Adaptive type badge sizing (`kStandardTypeIconSize` as a cap)

**Covers**: FR-001, FR-002, FR-003 (amended — see below). User Story 1.

**Supersedes**: the flat-`24.0` value set by `013-team-pokedex-ui-fixes`/
`014-team-configurator-fixes-2`'s `standard_type_icon_size.md` contract,
and this feature's own originally-planned flat `40.0` replacement (see
research.md Decision 1's "What actually happened during implementation" —
the user chose an adaptive, larger-capped approach instead once a flat
value's fundamental desktop-vs-mobile tension was demonstrated).

## Shape

```dart
// lib/presentation/team_builder/widgets/type_icon_resolution.dart

/// Shared upper bound — not a flat render size anymore.
const double kStandardTypeIconSize = 100.0; // value as of this writing;
// treat the constant, not this number, as the source of truth.

double resolveTypeIconSize(
  double availableWidth, {
  required int badgeCount,
  double spacing = 2,
});
```

`resolveTypeIconSize` returns, for `badgeCount` badges sharing one row of
`availableWidth` (with `spacing` between them): the full
`kStandardTypeIconSize` cap whenever that many badges at that size already
fit, otherwise the largest size that still lets all of them fit on one row
— with a small fixed safety margin so a zero-slack fit never tips into
wrapping an extra row due to layout rounding.

## Call sites

| File | Usage |
|---|---|
| `team_slot.dart` | `Wrap` wrapped in a `LayoutBuilder`; `resolveTypeIconSize(constraints.maxWidth, badgeCount: types.length)`, then **additionally clamped** to `constraints.maxWidth - 20` (a fixed name-label allowance) — this cell is square (`AspectRatio(aspectRatio: 1)`), so its content width also stands in for its content height budget; without this second clamp, a single, uncrowded badge could grow past what's left for the name text below it. |
| `pokemon_customization_card.dart` | Same `resolveTypeIconSize` call (own `LayoutBuilder`, `spacing: 8` to match its own `Wrap`), **no** extra height clamp — this row lives inside a free-scrolling sheet, not a fixed-size cell, so there is no vertical overflow to guard against. |
| `pokedex_type_filter.dart`'s `_TypeTile` | Uses `kStandardTypeIconSize` directly (unchanged) — one badge per tile, self-sized via `IntrinsicWidth`, so there is no "N badges share a row" concern to adapt to. |

## FR-003 amendment

"The size must be the same in the team slot and the customization card" now
means **the same formula and the same cap**, not necessarily an identical
rendered pixel value — the two contexts can have different real available
widths (a fixed grid cell vs. a free-scrolling sheet), so
`resolveTypeIconSize` can legitimately return different sizes for each
while still obeying one shared source of truth.

## Test Expectations

- A regression guard: `kStandardTypeIconSize > 24.0` (never silently
  reverts to the old, reported-illegible value).
- `team_slot_pokeball_and_types_test.dart`'s "two type badges fit within
  one slot cell width on a web viewport" test keeps passing — badges stay
  on one row, combined width `< 100` (the fixture's cell width).
- A single-type Pokémon in a team slot renders at a size consistent with
  `resolveTypeIconSize`'s bounds (`> 0`, `<= kStandardTypeIconSize`), and
  never triggers a `RenderFlex` overflow in that slot's `Column` — this is
  what caught the vertical-overflow gap described in research.md Decision
  1 (an end-to-end team-builder-page test, not just a bare `TeamSlot`
  fixture test, is what actually surfaced it, since the bare fixture used
  a comfortably tall `SizedBox`).
- `pokedex_type_filter_test.dart` / `pokemon_customization_card_test.dart`:
  existing `size == kStandardTypeIconSize` assertions were relaxed where
  the badge is now adaptive (customization card) — kept exact where the
  call site still renders at the flat cap (the type filter tile).
