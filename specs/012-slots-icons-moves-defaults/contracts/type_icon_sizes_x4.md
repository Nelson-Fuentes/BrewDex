# Contract: Íconos de Tipo ×4

**Covers**: FR-004 (User Story 2)

## Rule

Every `PokemonTypeIcon` call site's fixed `size` (and any wrapping `SizedBox`/`BoxConstraints`) is multiplied by exactly 4 from its `011-forms-icons-moves` value. The image source (`typeIconUrl`, Escarlata/Púrpura Gen IX) is unchanged.

| Call site | `011` size | `012` size (×4) |
|---|---|---|
| `TeamSlot` type badges | 32 | 128 |
| `TeamSlot` Tera Type badge | 24 | 96 |
| `PokemonCustomizationCard` type row | 48 | 192 |
| `PokemonCustomizationCard` `_WeaknessCell` icon | 32 | 128 |
| `PokedexTypeFilter._TypeTile` | 52 | 208 |

`PokedexTypeFilter._TypeTile`'s `BoxConstraints(minHeight: 60, minWidth: 76)` grows proportionally so the 208px icon is never clipped — exact new constraint values are an implementation detail, not fixed here beyond "large enough that the icon is never clipped."

## Test Expectations

- Each of the five widgets above renders a `PokemonTypeIcon` (or its `Icon` fallback) with the new size from the table, verified the same way `011`'s tests already verify the previous sizes.
