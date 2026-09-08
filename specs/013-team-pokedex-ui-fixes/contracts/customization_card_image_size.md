# Contract: Customization card sprite grows ≥75%

**Covers**: FR-010, SC-004. User Story 3.

## Change

`PokemonCustomizationCard.build`'s sprite box:

```dart
// Before
Center(
  child: SizedBox(
    width: 96,
    height: 96,
    child: PokeballBackground(...),
  ),
),

// After
Center(
  child: SizedBox(
    width: 168, // 96 * 1.75
    height: 168,
    child: PokeballBackground(...),
  ),
),
```

`96 * 1.75 = 168` — exactly the ≥75% floor from FR-010/SC-004, not a rounder-but-arbitrary number (research.md Decision 4).

## Test Expectations (`pokemon_customization_card_test.dart`)

1. The sprite's containing `SizedBox` measures `168×168` (or the `PokeballBackground`'s rendered size, whichever the existing test suite already asserts against, updated to the new value).
2. No other section of the card (header, name, type row, moves, footer) overlaps or is clipped after the resize — a golden/widget test renders the full card at a representative width and asserts no `RenderFlex overflowed` exception is thrown.
