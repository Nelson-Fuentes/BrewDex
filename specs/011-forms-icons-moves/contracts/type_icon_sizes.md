# Contract: Tamaños de Ícono de Tipo

**Covers**: FR-006, FR-007 (User Story 4)

## Rule

`typeIconUrl`/`PokemonTypeIcon`'s image source is unchanged — still `generation-ix/scarlet-violet` (008's Decision 3, reaffirmed by research.md Decision 4 of this feature). Only the fixed `size` passed at each call site increases:

| Call site | Old size | New size |
|---|---|---|
| `TeamSlot` type badges | 20 | 32 |
| `TeamSlot` Tera Type badge | 16 | 24 |
| `PokemonCustomizationCard` type row | 36 | 48 |
| `PokemonCustomizationCard` `_WeaknessCell` icon | 24 | 32 |
| `PokedexTypeFilter._TypeTile` | 40 | 52 |

`PokedexTypeFilter._TypeTile`'s `BoxConstraints(minHeight: 48, minWidth: 64)` grows in the same proportion the icon did, so the icon keeps filling the tile with no padding (010's no-label/no-padding contract stays intact) — exact new constraint values are an implementation detail, not fixed here beyond "large enough that the 52px icon is never clipped".

## Test Expectations

- Each of the five widgets above renders a `PokemonTypeIcon` (or the equivalent `Icon` fallback) with the new size value from the table, verified the same way the 010 tests already verify the previous sizes (`tester.widget<PokemonTypeIcon>(...).size`).
- `typeIconUrl` itself is unchanged and still resolves `.../generation-ix/scarlet-violet/{numericId}.png` — no new/changed test needed beyond the existing coverage from `008`.
