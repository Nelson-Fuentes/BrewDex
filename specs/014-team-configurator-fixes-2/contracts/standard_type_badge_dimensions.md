# Contract: `PokemonTypeIcon` pins both width and height

**Covers**: FR-008, FR-009. User Story 6.

## Widget change

```dart
// presentation/team_builder/widgets/type_icon_resolution.dart
class PokemonTypeIcon extends StatelessWidget {
  const PokemonTypeIcon({super.key, required this.type, this.size = 18, this.color});

  @override
  Widget build(BuildContext context) {
    final url = typeIconUrl(type: type);
    if (url == null) {
      return Icon(iconForPokemonType(type.id), size: size, color: color);
    }
    return Image.network(
      url,
      width: size,   // NEW — previously unset, letting a non-square
      height: size,  // source icon render wider than `size`.
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) =>
          Icon(iconForPokemonType(type.id), size: size, color: color),
    );
  }
}
```

## Call sites amended

| File | Before | After |
|---|---|---|
| `team_slot.dart` | `PokemonTypeIcon(type: type, size: kStandardTypeIconSize)` inside an unconstrained `Wrap` child | Unchanged call — now renders at a *fixed* `kStandardTypeIconSize` width too, not just height |
| `pokemon_customization_card.dart` | `SizedBox(width: kStandardTypeIconSize, height: kStandardTypeIconSize, child: PokemonTypeIcon(type: type, size: kStandardTypeIconSize))` | `PokemonTypeIcon(type: type, size: kStandardTypeIconSize)` — outer `SizedBox` removed as redundant now that the widget pins its own width |

## Not amended (deliberately out of scope)

- `pokedex_type_filter.dart`'s `_TypeTile` — already uses
  `kStandardTypeIconSize` per `013`; this fix changes `PokemonTypeIcon`'s
  own behavior underneath it, no call-site change needed there.
- The Tera Type badge (`size: 96`, bordered/tinted) — still a distinct
  badge, out of scope per `013`'s own contract.

## Test Expectations

- `team_slot_row_test.dart`: at a representative web viewport, a two-type
  Pokémon's rendered type row fits within one team-slot cell's width with
  no overflow (regression test for the reported "no caben dos tipos en una
  fila" — must actually measure rendered width, not just assert the `size`
  parameter, since the previous bug had the correct parameter value with
  the wrong rendered result).
- `pokemon_customization_card_test.dart`: the card's type badges' rendered
  size equals the team slot's rendered size at the same viewport (FR-009 —
  "nunca un tamaño menor").
