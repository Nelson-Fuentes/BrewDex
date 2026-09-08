# Data Model: Layout Mitad y Mitad, Íconos de Tipo, Colores de Estadísticas y Tabla de Debilidades

## New: `type_effectiveness_chart.dart` (domain, framework-free)

`lib/domain/team_builder/value_objects/type_effectiveness_chart.dart`

The full Generation VI+ (18-type, Fairy-included) attacking-type → defending-type relationship table, authored as only the non-neutral (`≠ 1.0`) entries per attacking type. Every attacking-type id below is a `PokemonType.id` string already used elsewhere in this codebase (`fire`, `water`, ... — the same ids `PokeApiPokedexRepository` already resolves).

| Attacking type | ×2 vs. | ×0.5 vs. | ×0 vs. |
|---|---|---|---|
| normal | — | rock, steel | ghost |
| fire | grass, ice, bug, steel | fire, water, rock, dragon | — |
| water | fire, ground, rock | water, grass, dragon | — |
| electric | water, flying | electric, grass, dragon | ground |
| grass | water, ground, rock | fire, grass, poison, flying, bug, dragon, steel | — |
| ice | grass, ground, flying, dragon | fire, water, ice, steel | — |
| fighting | normal, ice, rock, dark, steel | poison, flying, psychic, bug, fairy | ghost |
| poison | grass, fairy | poison, ground, rock, ghost | steel |
| ground | fire, electric, poison, rock, steel | grass, bug | flying |
| flying | grass, fighting, bug | electric, rock, steel | — |
| psychic | fighting, poison | psychic, steel | dark |
| bug | grass, psychic, dark | fire, fighting, poison, flying, ghost, steel, fairy | — |
| rock | fire, ice, flying, bug | fighting, ground, steel | — |
| ghost | psychic, ghost | dark | normal |
| dragon | dragon | steel | fairy |
| dark | psychic, ghost | fighting, dark, fairy | — |
| steel | ice, rock, fairy | fire, water, electric, steel | — |
| fairy | fighting, dragon, dark | fire, poison, steel | — |

This is the same, single, well-known chart every mainline Pokémon game since Generation VI (X/Y onward) uses — it is not sourced from, or expected to ever diverge per, any specific game in this app's catalog (research.md Decision 4).

### `typeEffectivenessAgainst(List<PokemonType> defendingTypes) → Map<String, double>`

For each of the 18 attacking type ids, looks up that attacking type's relationship (from the table above) to each of `defendingTypes` (1 or 2 entries), defaulting to `1.0` when no entry exists (neutral), and multiplies them together. Returns a map from attacking type id to the combined multiplier — always one of `0`, `0.25`, `0.5`, `1`, `2`, or `4` for a 1–2-type Pokémon, matching FR-009. An immunity (`0`) from either defending type makes the combined result `0` regardless of the other type's relationship (multiplying by zero), matching the official in-game rule.

## Amended: `PokemonCustomizationCard` (presentation) — new section, no data-shape change

`lib/presentation/team_builder/widgets/pokemon_customization_card.dart`

- New private `_TypeWeaknessTable` widget — takes the same `List<PokemonType>` `resolveSlotTypes(entry, rosterEntry)` (`slot_sprite_resolution.dart`, unchanged) already computes for the type-badge row above it, and renders `typeEffectivenessAgainst(types)` as an 18-row table: one `PokemonTypeIcon` (attacking type) + its multiplier, cell-colored by whether the multiplier is a weakness (`>1`), a resistance (`<1, >0`), an immunity (`0`), or neutral (`1`) — FR-011.
- `_StatBarRow` (from `009-stats-chart-full-pokedex`) gains no new field — its existing `value`/`maxValue` inputs are unchanged; only its fill `Color` is now computed by the new `statBarColor(int value)` function instead of a fixed theme color (research.md Decision 3).
- The type-badge row above the stats section drops its `Chip`/`Text` label per research.md Decision 2 — same `resolveSlotTypes` input, different render only.

No `TeamBuilderState`/`TeamBuilderCubit`/domain-entity change — `resolveSlotTypes` already recomputes on every form change (008/009's reactivity), so both the (now-colored) stat bars and the (new) weakness table update automatically alongside the rest of the card, satisfying FR-007/FR-010 with no new wiring.

## Amended: `TeamBuilderTwoPaneLayout`, `TeamSlot`, `PokedexTypeFilter` (presentation) — layout/styling only

No data-shape change in any of the three — see research.md Decisions 1–2 for the exact widget-tree changes. None of them gain or lose a constructor parameter (the 50/50 split removes internal-only constants; the icon changes remove a `Text`/`Chip` from each build method's output, not from any public API).
