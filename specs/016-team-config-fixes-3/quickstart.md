# Quickstart: Validate 016-team-config-fixes-3

## Prerequisites

- Flutter SDK matching `pubspec.yaml` (`^3.8.1`), already on `PATH` (`flutter --version`).
- Repo dependencies installed: `flutter pub get`.

## Run the automated checks

```bash
# Focused unit/widget tests for the three fixes
flutter test test/presentation/team_builder/type_icon_resolution_test.dart
flutter test test/presentation/team_builder/pokedex_type_filter_test.dart
flutter test test/presentation/team_builder/pokemon_customization_card_test.dart
flutter test test/presentation/team_builder/widgets/team_slot_pokeball_and_types_test.dart
flutter test test/presentation/team_builder/coverage_analysis_page_test.dart
flutter test test/presentation/team_builder/widgets/coverage_table_test.dart
flutter test test/presentation/team_builder/pages/team_builder_page_remove_pokemon_test.dart

# Whole team_builder presentation suite + full unit suite
flutter test test/presentation/team_builder/
flutter test

# End-to-end flow(s), if present/added for this feature
flutter test integration_test/
```

All of the above MUST pass before considering the feature done, per
Constitution Principle II (tests written/updated before the fix, failing
before, passing after).

## Manual validation scenarios

### 1. Type badge legibility + two-per-slot fit (User Story 1)

1. `flutter run -d chrome` (or your usual web target).
2. Add a Pokémon with two types (e.g. Charizard: Fire/Flying) to a team slot.
3. Visually confirm: both type badges sit side by side in the slot, clearly
   larger and easier to read than before, not overlapping or wrapping to a
   second row.
4. Open that Pokémon's customization card; confirm its type badges look the
   same size as the team slot's.
5. Resize the browser window narrower (but still a realistic desktop width,
   not artificially cropped) and repeat step 3.

### 2. Coverage Analysis table visibility (User Story 2)

1. From the team builder, tap the Coverage Analysis icon (`Icons.query_stats`) in the app bar.
2. Confirm the page opens with its title and the type-coverage table visible
   immediately (no blank screen), at your current window/device size — not
   an artificially resized one.
3. Scroll down; confirm every type row is reachable.
4. **If this does not reproduce any problem**: note the Flutter/Chrome (or
   device) version and confirm you are running a freshly built app (not a
   cached/stale build) — record that confirmation per FR-008 rather than
   changing code with nothing failing to justify it.

### 3. Removing a Pokémon stays in the team builder (User Story 3)

1. Build a team of at least 3–4 Pokémon.
2. Open a Pokémon's customization card and tap "Quitar del equipo".
3. Confirm you land back on the team builder (not the game selection menu),
   with that slot now empty and the rest of the team intact.
4. Repeat for multiple slots/positions, including removing the last
   remaining Pokémon (team becomes empty) — confirm the team builder stays
   open every time.

## Related artifacts

- [research.md](./research.md) — root-cause analysis behind all three fixes.
- [contracts/type_badge_size_40.md](./contracts/type_badge_size_40.md)
- [contracts/coverage_table_realistic_visibility.md](./contracts/coverage_table_realistic_visibility.md)
- [contracts/remove_pokemon_single_pop.md](./contracts/remove_pokemon_single_pop.md)
