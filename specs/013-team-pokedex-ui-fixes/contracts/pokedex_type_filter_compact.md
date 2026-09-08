# Contract: Pokédex type filter — standard size, no black background, button hugs the icon

**Covers**: FR-007, FR-008, FR-009. User Story 1 (Pokédex portion).

## Before → After (`PokedexTypeFilter._TypeTile`)

| Aspect | Before | After |
|---|---|---|
| Background | `Material(color: Colors.black, ...)`, fixed regardless of theme | Themed surface color: `theme.colorScheme.surfaceContainerHigh` (unselected) — matching the neutral tile color already used by `PokedexEntryCard`/`_MoveTypeFilterTile`'s sibling patterns elsewhere in this app |
| Selected indicator | White border (`Colors.white`) against the black tile | `theme.colorScheme.primary` border, 2–3px, against the themed tile — consistent with the selected/hover treatment `PokedexEntryCard` already uses |
| Icon color | Forced `Colors.white` | `null` (renders `PokemonTypeIcon`'s own default resolution — the network per-type icon's natural colors, or the bundled Material icon in the theme's default icon color as fallback) |
| Icon size | `208` | `kStandardTypeIconSize` (24) — see `standard_type_icon_size.md` |
| Box | `IntrinsicWidth(child: Container(constraints: BoxConstraints(minHeight: 224), padding: EdgeInsets.all(4) implied by icon, ...))` | `Container` sized to the icon plus only enough padding to keep the selection border from touching the icon (e.g. `EdgeInsets.all(4)`) — no separate minimum-height/width constraint beyond that |

## Test Expectations (`pokedex_type_filter_test.dart`)

1. No rendered `_TypeTile`'s `Material`/`Container` decoration uses `Colors.black`.
2. Every rendered `PokemonTypeIcon` has `size == kStandardTypeIconSize`.
3. The tile's rendered box size is within a small, fixed padding allowance of the icon's own size (e.g. `renderBox.size.width <= kStandardTypeIconSize + 16`), not the previous `224`.
4. Selecting/deselecting a tile still updates `onSelected` exactly as before (unchanged interaction — this contract only touches visuals).

## Recorded trade-off

See research.md Decision 3: this tile's touch target now measures below the ≥44dp minimum touch target guidance from `002-material-design-ui` FR-003/SC-003. This is a deliberate, explicit instruction for this specific tile from this feature's spec (FR-009) and is not to be read as superseding that guidance for any other interactive element in the app.
