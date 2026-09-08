# Quickstart: Validating Layout Split, Type Icons, Stat Colors, and the Weakness Table

Prerequisites: Flutter SDK matching `pubspec.yaml` (`sdk: ^3.8.1`), dependencies installed (`flutter pub get`), a network connection (this feature reads live PokeAPI/type-icon data at runtime; the type-effectiveness chart itself is offline/static).

## Setup

```bash
flutter pub get
flutter test                 # full existing + new regression suite
flutter run -d chrome        # or your platform of choice, for manual verification
```

Navigate: game selection → pick any game → the armador opens. Open it on a desktop-width window for Scenario 1.

## Scenario 1 — The team panel and the Pokédex panel split the screen exactly in half (User Story 1)

1. Open the armador on a desktop-width window (≥ the app's `expanded` breakpoint).
2. **Expected**: the team-slots panel (left) and the Pokédex panel (right) measure the same width — visually, the vertical divider between them sits exactly at the horizontal midpoint.
3. Resize the window.
4. **Expected**: both panels stay equal to each other at every width, and the team slots visibly look larger than before this feature.

## Scenario 2 — Type icons are label-free and fill their space (User Story 2)

1. Look at a team slot's type badges, the customization card's type row, and the Pokédex's type filter tiles.
2. **Expected**: none of the three show the type's name as visible text next to the icon; each icon looks noticeably larger than before, with no empty margin between the icon and its tile's edge.
3. If using a screen reader (or inspecting the widget tree's semantics), check a type filter tile.
4. **Expected**: the type's name is still announced/available even though no text is visible.

## Scenario 3 — Stat bars are colored by value (User Story 3)

1. Open the customization card for a Pokémon with a clearly lopsided stat spread (a very low stat and a very high one).
2. **Expected**: the low stat's bar is reddish, the high stat's bar is greenish/tealish, and any mid-range stat's bar falls somewhere between (amber/yellow-ish).
3. Switch to an alternate form with different stats (e.g. a Mega Evolution).
4. **Expected**: the bar colors update along with the bar lengths and numeric values.

## Scenario 4 — The type weakness table shows correct multipliers (User Story 4)

1. Open the customization card for a Pokémon with a well-known dual-type weakness (e.g. a Water/Ground-type, immune to Electric; or a Fire/Flying-type, weak ×4 to Rock).
2. **Expected**: the weakness table lists all 18 attacking types with their multiplier, and the known immunity/×4-weakness case matches — the immunity is visually distinct (e.g. shown as a dash or muted, not a bare "0×"), and the ×4 weakness stands out as clearly as a normal ×2 weakness, just more so.
3. Switch to an alternate form with different types.
4. **Expected**: the table recomputes for the new types.

## Automated coverage

`flutter test` should include, at minimum, new/updated tests for:
- `test/domain/team_builder/type_effectiveness_test.dart` — every single-type case against data-model.md's table, plus representative dual-type combinations (including an immunity-overrides-weakness case).
- `test/presentation/team_builder/widgets/team_builder_two_pane_layout_test.dart` — equal-width assertion at multiple window sizes (contracts/two_pane_half_split.md).
- `test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart`, `test/presentation/team_builder/pokemon_customization_card_test.dart`, `test/presentation/team_builder/pokedex_type_filter_test.dart` — no visible type-label text, `Semantics` label preserved where applicable (contracts/type_icon_no_label_no_padding.md).
- `test/presentation/team_builder/pokemon_customization_card_test.dart` — stat-bar color assertions (contracts/stat_bar_color_scale.md) and weakness-table rendering/recompute-on-form-change assertions (contracts/type_weakness_table.md).
