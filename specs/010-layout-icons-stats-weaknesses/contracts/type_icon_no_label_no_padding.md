# Contract: Type icons — no label, fill the container, no padding

**Amends**: `lib/presentation/team_builder/widgets/team_slot.dart`, `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` (type badge row), `lib/presentation/team_builder/widgets/pokedex_type_filter.dart` (`_TypeTile`).

## Rule

At each of the three sites:

1. No `Text`/label naming the type is rendered visibly next to the icon.
2. The `PokemonTypeIcon`'s `size` MUST equal (or fill) the box that holds it — no `Padding`/`Chip`-internal spacing between the icon and that box's edge.
3. A non-visual way to identify the type MUST remain (FR-005) — `_TypeTile`'s existing `Semantics(label: type.label, ...)` wrapper is kept unchanged; `TeamSlot`'s existing `Semantics(label: entry.displayName, ...)` (naming the Pokémon, not each type individually) is unchanged, consistent with how it already didn't separately announce each type badge before this feature either.
4. `_TypeTile`'s existing minimum touch-target size (`BoxConstraints(minHeight: 48, minWidth: 64)`, from `002-material-design-ui`) is preserved — only its *internal* padding is removed; the icon grows to occupy that minimum box instead.

## Before / After summary

| Site | Before | After |
|---|---|---|
| `TeamSlot` | `PokemonTypeIcon(size: 12)` / `10` (Tera) | `PokemonTypeIcon(size: 20)` / proportionally larger Tera badge, same `Wrap` |
| `PokemonCustomizationCard` type row | `Chip(avatar: PokemonTypeIcon(size: 18), label: Text(type.label))` | `SizedBox(36×36, child: PokemonTypeIcon(size: 36))`, no `Chip`/label |
| `PokedexTypeFilter._TypeTile` | `Container(padding: 16h/12v, child: Row([PokemonTypeIcon(size: 18), SizedBox(6), Text(type.label)]))` | `Container(padding: 0, constraints: same 48×64 minimum, child: PokemonTypeIcon(size: fills box))` |

## Verification

A widget test at each site asserts `find.text(type.label)` (or the type's localized name) returns no widgets, while `find.byType(PokemonTypeIcon)` still returns one per type shown, and (for `_TypeTile`) that the `Semantics` node for the tile still carries the type's label.
