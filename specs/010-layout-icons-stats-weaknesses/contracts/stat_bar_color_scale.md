# Contract: Stat bar fill color scale

**Amends**: `lib/presentation/team_builder/widgets/pokemon_customization_card.dart`'s `_StatBarRow`.

## Rule

A new pure function:

```dart
Color statBarColor(int value)
```

1. Clamps `value` to `[0, 150]`.
2. Interpolates through three fixed color stops — red (low), amber (mid, at `value == 75`), green/teal (high, at `value == 150`) — via `Color.lerp`, red→amber for `value` in `[0, 75]` and amber→green for `value` in `[75, 150]`.
3. Is deterministic — the same `value` always returns the same `Color`, with no dependency on any other stat or Pokémon (research.md Decision 3, Edge Case: "same value → same color, always").

`_StatBarRow`'s fill (`FractionallySizedBox`'s child `Container`) uses `statBarColor(value)` instead of `theme.colorScheme.primary`; the track color is unchanged.

## Verification

A test asserts `statBarColor(0)` and `statBarColor(30)` are both closer to red than to green (e.g. compare each result's `HSVColor.hue` — low values close to `0°`/`360°`), `statBarColor(150)` and `statBarColor(130)` are both closer to green, `statBarColor(75)` is the amber midpoint, and `statBarColor(x) == statBarColor(x)` for a repeated call (determinism). A widget test asserts two `_StatBarRow`s with clearly different values render fills with different colors, and that switching the selected form (which changes the underlying stat values) changes at least one bar's fill color.
