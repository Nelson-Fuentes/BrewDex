# Contract: Base Stats bar chart

**Amends**: `pokemon_customization_card.dart`'s `_StatsTable` → `_StatsBarChart`.

## Rule

For a given `PokemonStats stats` and the fixed reference maximum `_maxBaseStat = 255` (research.md Decision 2):

1. Each of the six stats renders as one row: a label (`AppLocalizations.customizationCardStat*`, unchanged keys from `008-configurador-equipo-correcciones`), a horizontal bar whose filled width is `(stats.<field>.clamp(0, 255) / 255)` of the row's available bar-track width, and the exact numeric value as text.
2. The same `_maxBaseStat` denominator is used for all six rows and is never recomputed from the current Pokémon's own values — two bars are comparable by looking at their relative fill within the same track width, both within one Pokémon and across different Pokémon/forms.
3. A value of `0` still renders a visible sliver (a minimum visual width), never an invisible/zero-width bar — the row must always be identifiable as present.
4. A value at or above `255` renders a fully-filled bar (clamped), never overflowing the track.
5. Changing the selected form re-renders every row's bar width and value from that form's own `resolveSlotStats` result (unchanged from 008) — the bar chart, not a reversion to a text list, is what updates.

## Before (008-configurador-equipo-correcciones)

```dart
Row(children: [Expanded(child: Text(label)), Text('$value')])
```

## After (this contract)

```dart
Row(
  children: [
    SizedBox(width: _labelWidth, child: Text(label)),
    Expanded(
      child: Stack(children: [
        // track
        DecoratedBox(decoration: BoxDecoration(color: trackColor, borderRadius: ...)),
        // fill, proportional to value / 255, clamped, minimum-visible-width guaranteed
        FractionallySizedBox(widthFactor: fillFactor, child: DecoratedBox(...)),
      ]),
    ),
    SizedBox(width: _valueWidth, child: Text('$value')),
  ],
)
```

## Verification

A widget test renders the card for a fixture with two stats of clearly different values (e.g. 50 and 150) and asserts the rendered width of the higher-value bar's fill exceeds the lower-value bar's, and that both are strictly less than the shared track's full width when below 255. A second test asserts a `0`-value stat still renders a nonzero-width fill, and a `255`+-value stat's fill matches the full track width (clamped, not overflowing). A third test (already covered by 008's form-change test, extended here) asserts the bars — not a text list — re-render on a form change.
