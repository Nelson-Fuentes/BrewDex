# Quickstart: Validating the Bar-Chart Stats and Full Pokédex Load

Prerequisites: Flutter SDK matching `pubspec.yaml` (`sdk: ^3.8.1`), dependencies installed (`flutter pub get`), a network connection (this feature reads live PokeAPI data, no mocked fixtures at runtime).

## Setup

```bash
flutter pub get
flutter test                 # full existing + new regression suite
flutter run -d chrome        # or your platform of choice, for manual verification
```

Navigate: game selection → pick a game with a National Dex eligible and a species with a Mega Evolution (e.g. Escarlata/Púrpura, or X/Y) → the armador opens.

## Scenario 1 — Base stats render as a bar chart (User Story 1)

1. Open any Pokémon's customization card.
2. **Expected**: the "Base Stats" section shows six horizontal bars (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad), each with its label, a proportional filled bar, and its exact numeric value.
3. Compare two stats with clearly different values on the same Pokémon (e.g. a glass-cannon species's Ataque vs. Defensa).
4. **Expected**: the higher-value stat's bar is visibly longer, without needing to read the numbers.
5. Select a Mega Evolution (or another alternate form) for a species that has one.
6. **Expected**: all six bars resize immediately to that form's own base stats — the chart, not a text list, updates.

## Scenario 2 — The Pokédex loads completely, with no partial state (User Story 2)

1. Open a game's Pokédex (toggle "Pokédex Nacional" on if eligible, for the largest available list).
2. **Expected**: while loading, a clear loading indicator is shown (full-screen for the initial `load()`, a scoped indicator for a National Dex/DLC toggle) — never a partially-empty grid.
3. Once loading finishes, scroll to the very end of the grid without pausing.
4. **Expected**: every tile, including the very last one, is already a real, tappable Pokémon — no placeholder tile anywhere, at any point.
5. Search by name for a species known to be near the end of the list.
6. **Expected**: it appears instantly — no loading delay tied to where it sorts in the list.
7. Toggle the National Dex switch (or a DLC) rapidly a few times in a row.
8. **Expected**: no crash, no stale/mismatched data — the last toggle's Pokédex is what ends up displayed, fully resolved.

## Automated coverage

`flutter test` should include, at minimum, new/updated tests for:
- `test/presentation/team_builder/pokemon_customization_card_test.dart` — bar-chart rendering, proportionality, clamping, and form-change updates (contracts/stats_bar_chart.md).
- `test/presentation/team_builder/team_builder_cubit_pagination_test.dart` (or its replacement) — `load()`/`_fetchAndApplyView` resolve the full index in one pass; no `loadMoreIfNeeded`-shaped method remains (contracts/team_builder_cubit_full_load.md).
- Deletion of `test/presentation/team_builder/widgets/pokedex_grid_sliver_lookahead_test.dart` (008-configurador-equipo-correcciones) alongside the `onLoadMore` trigger it tested.
