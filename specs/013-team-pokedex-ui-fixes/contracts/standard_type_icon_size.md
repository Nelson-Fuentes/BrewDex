# Contract: `kStandardTypeIconSize` — one shared type-badge size

**Covers**: FR-001, FR-002, FR-003, FR-007, FR-011. User Stories 1.

## Constant

```dart
// presentation/team_builder/widgets/type_icon_resolution.dart
const double kStandardTypeIconSize = 24.0;
```

## Call sites amended to use it

| File | Call site | Before | After |
|---|---|---|---|
| `team_slot.dart` | Pokémon's own type row (`Wrap`) | `PokemonTypeIcon(type: type, size: 128)` | `PokemonTypeIcon(type: type, size: kStandardTypeIconSize)` |
| `pokedex_type_filter.dart` | `_TypeTile` | `PokemonTypeIcon(type: type, size: 208, color: Colors.white)` | `PokemonTypeIcon(type: type, size: kStandardTypeIconSize)` (color no longer forced white — see `pokedex_type_filter_compact.md`) |
| `pokemon_customization_card.dart` | Type row (`Wrap`, under "Tipo" label) | `PokemonTypeIcon(type: type, size: 192)` inside a `SizedBox(width: 192, height: 192)` | `PokemonTypeIcon(type: type, size: kStandardTypeIconSize)`, `SizedBox` sized to match (or removed if no longer needed for alignment) |

## Not amended (deliberately out of scope)

- The Tera Type badge in `team_slot.dart` (currently `size: 96`) and its counterpart wherever else Tera Type is shown — it is a distinct badge (bordered, tinted with `theme.colorScheme.primary`), not one of "the Pokémon's own types" this contract's FRs target. May be revisited in a future feature.
- `MoveListTile`'s per-move type icon (`size: 24`/`28` today) — already reasonable for its purpose (labeling a move's type inside a list row) and out of this feature's scope (spec.md only discusses team slots, Pokédex, and Pokémon-card type badges).

## Test Expectations

- `team_slot_row_test.dart`: a two-type Pokémon's type row renders both `PokemonTypeIcon`s with `size == kStandardTypeIconSize`, and (widget-test level) their combined rendered width fits within a single team-slot cell's width at a representative web viewport — asserting no wrap/overflow.
- `pokedex_type_filter_test.dart`: every rendered `PokemonTypeIcon` has `size == kStandardTypeIconSize`.
- `pokemon_customization_card_test.dart`: the type row's `PokemonTypeIcon`s have `size == kStandardTypeIconSize`.

## Mobile spacing (FR-002)

`team_slot.dart`'s type-row `Wrap` already sets `spacing: 2` (main-axis gap) and relies on `Wrap`'s default `runSpacing: 0.0` (cross-axis gap, i.e. the gap between wrapped rows) — left unchanged, since it already satisfies "sin padding ni margen ... o al menos uno reducido." No test currently pins `runSpacing`; add one asserting `Wrap.runSpacing <= 2` so a future change can't silently reintroduce a large gap.
