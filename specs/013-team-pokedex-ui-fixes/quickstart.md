# Quickstart: Validating 013-team-pokedex-ui-fixes

## Prerequisites

```bash
cd /home/nelson/Developments/BrewDex/BrewDex
flutter pub get
```

Requires network access to PokeAPI (`pokeapi.co`) and `raw.githubusercontent.com/PokeAPI/sprites` for live manual verification; automated tests use the existing fixture/fake HTTP client already used across `test/infrastructure/team_builder/`.

## Automated checks

```bash
flutter analyze
flutter test
```

Key suites this feature touches (see plan.md's Project Structure for the full list):

```bash
flutter test test/presentation/team_builder/widgets/team_slot_row_test.dart
flutter test test/presentation/team_builder/widgets/pokedex_type_filter_test.dart
flutter test test/presentation/team_builder/widgets/pokemon_customization_card_test.dart
flutter test test/presentation/team_builder/widgets/move_selection_sheet_test.dart
flutter test test/presentation/team_builder/widgets/coverage_table_test.dart
flutter test test/presentation/team_builder/coverage_analysis_page_test.dart
flutter test test/presentation/team_builder/cubit/team_builder_cubit_form_reconciliation_test.dart
```

## Manual validation scenarios (one per user story)

1. **Type badges fit / minimal mobile gap (US1)**: open the armador for any game on a wide (web/desktop) window with a two-type Pokémon in a team slot — both type badges sit in one row. Resize to a narrow (mobile) width — the badges may stack, but with no visible gap between them. Repeat in the Pokédex list and inside a Pokémon's customization card — all three use the same small badge size.
2. **Alola forms gone from Rojo Fuego/Verde Hoja (US2)**: with any game where an Alola-eligible species (e.g. Rattata) can have its Alola form selected/made principal (e.g. Sun/Moon), add it to the team and confirm a Sun/Moon-scoped form. Switch the active game to Rojo Fuego or Verde Hoja (reopening the armador for that game against the same persisted roster) — the roster entry's form reverts to the base/principal form, and the form selector for that Pokémon never lists an Alola option.
3. **Pokédex type filter (US1/Pokédex)**: open the Pokédex's type filter — tiles are small, themed (no black background), and each button's tappable area is just large enough for its icon, not a large separate box.
4. **Bigger card image (US3)**: open any Pokémon's customization card — its sprite is noticeably larger (168px vs. the previous 96px) without clipping the rest of the card's content.
5. **No weaknesses section (US4)**: in the same card, confirm there is no "Debilidades de tipo" section anywhere.
6. **Reused move row (US5)**: compare a move already assigned in the card against the same move shown while picking it from the move-selection sheet — same row layout (name/type/PP/power/description); the assigned row additionally shows its clear ("×") button.
7. **Sticky remove button (US6)**: open a card with enough content to scroll (several optional sections + 4 moves), scroll to the bottom of the content, and confirm "Quitar del equipo" was visible the whole time, fixed at the bottom of the card.
8. **Coverage Analysis (US7)**: from the armador's app bar, open the new "Análisis de Cobertura" action — a table appears whose first column lists every Pokémon type by name (Normal, Fuego, Agua, …), with no icons in that column.
