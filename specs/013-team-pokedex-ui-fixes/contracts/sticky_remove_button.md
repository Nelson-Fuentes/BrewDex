# Contract: "Quitar del equipo" as a fixed footer

**Covers**: FR-014. User Story 6.

## Structural change (`PokemonCustomizationCard.build`)

```dart
// Before
return SafeArea(
  child: SingleChildScrollView(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          /* header, image, name, types, stats, weaknesses(removed), tera,
             forms/variants/states, moves, ... */
          SizedBox(width: double.infinity, child: OutlinedButton.icon(/* Quitar del equipo */)),
        ],
      ),
    ),
  ),
);

// After
return SafeArea(
  child: Column(
    children: [
      Expanded(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                /* header, image, name, types, stats, tera,
                   forms/variants/states, moves, ... (unchanged content,
                   minus the removed weaknesses section and minus the
                   trailing remove button) */
              ],
            ),
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(/* Quitar del equipo — unchanged button */),
        ),
      ),
    ],
  ),
);
```

The button's own styling/behavior (`onRemove`, `OutlinedButton.styleFrom(foregroundColor: theme.colorScheme.error, ...)`, icon, label) is unchanged — only its position moves from "last item of the scrollable column" to "sibling of the scrollable area, outside it."

## Test Expectations (`pokemon_customization_card_test.dart`)

1. With enough content to require scrolling (e.g. a Pokémon with every optional section present — forms, variants, states, 4 moves), scrolling the content area to its end does not move the "Quitar del equipo" button — its global `Offset` (via `tester.getTopLeft`) is the same before and after a scroll gesture.
2. Tapping the button still calls `onRemove`, regardless of current scroll position.
3. On a short-content Pokémon (no scrolling needed), the button still renders at the bottom of the card, visually unchanged from before this feature.
