# Contract: Type weakness table

**New**: `lib/domain/team_builder/value_objects/type_effectiveness_chart.dart` (domain), `_TypeWeaknessTable` widget in `lib/presentation/team_builder/widgets/pokemon_customization_card.dart` (presentation).

## Domain rule

```dart
Map<String, double> typeEffectivenessAgainst(List<PokemonType> defendingTypes)
```

- `defendingTypes` has 1 or 2 entries (a Pokémon's active types for its current form).
- Returns exactly 18 entries, one per known attacking type id, each value one of `0, 0.25, 0.5, 1, 2, 4`.
- For a 1-type Pokémon: the multiplier for attacking type `A` is the chart's `A → defendingTypes[0]` relationship (data-model.md's table), defaulting to `1.0` when absent.
- For a 2-type Pokémon: the multiplier for attacking type `A` is `(A → defendingTypes[0]) × (A → defendingTypes[1])`, each defaulting to `1.0` independently — this naturally produces `0` whenever either type is immune, `4`/`0.25` when both types share the same weakness/resistance, and every other combination the official chart produces.
- Does not consider a Tera Type (spec.md Assumptions, Edge Cases) — only `defendingTypes` as passed in, which the caller (the customization card) sources from `resolveSlotTypes`, itself already Tera-Type-independent.

## Presentation rule

`_TypeWeaknessTable`:
1. Calls `typeEffectivenessAgainst(resolveSlotTypes(entry, rosterEntry))` — the same types the type-badge row above it already shows.
2. Renders all 18 attacking types (a fixed, stable order — e.g. the PokeAPI numeric-id order already used for icon URLs), each as one row: `PokemonTypeIcon` + the multiplier as text (e.g. `"2×"`, `"0.5×"`, `"0×"` — `"1×"` for neutral, not omitted, since the table's whole purpose is answering "what about this type" for the full 18, not only the exceptions).
3. Visually distinguishes non-neutral cells (FR-011) — e.g. a weakness (`>1`) cell tinted toward a "danger" color, a resistance (`<1`) cell toward a "safe" color, an immunity (`0`) cell distinctly (e.g. a dash or a muted/greyed style instead of a bare `"0×"`), and a neutral (`=1`) cell in the card's plain/default text style.
4. Recomputes on every rebuild the card already gets when the selected form changes (008/009's reactivity) — no new state, no new listener.

## Verification

A domain test constructs `typeEffectivenessAgainst` for every one of the 18 single-type cases and asserts the full 18-entry result against data-model.md's table; a dual-type case (e.g. Water/Ground, historically immune to Electric) asserts the combined `0` for Electric and the correctly-multiplied values for a representative sample of the other 17. A widget test opens the customization card for a fixture with known types and asserts the weakness table shows the expected multiplier text for at least one weakness, one resistance, and one immunity case, and that changing the selected form (to one with different types) recomputes the table.
