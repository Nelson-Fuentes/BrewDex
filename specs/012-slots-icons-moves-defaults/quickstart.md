# Quickstart: Slots 3×2 sin Espacio Desperdiciado, Íconos ×4, Movimientos por Defecto y Filtro Ocultable

## Prerequisites

- Flutter SDK installed, `flutter pub get` run at the repo root.
- No environment/API keys needed — PokeAPI is public and unauthenticated.

## Validation Scenarios

### 1. Slots 3×2 (User Story 1, contracts/team_slots_3x2.md)

```bash
flutter run -d chrome
```
1. Open the armador at a wide (web/desktop) viewport.
2. Confirm the 6 team slots render in 3 columns × 2 rows.
3. Confirm there's no visible empty margin between the slots grid and the panel's edges.
4. Compare a slot's size against a screenshot from before this feature — it should read noticeably larger (~1.5× taller).

### 2. Type icons ×4 (User Story 2, contracts/type_icon_sizes_x4.md)

1. Observe type icons in a filled team slot, the customization card, and the Pokédex type filter.
2. Confirm each is dramatically larger than before — roughly 4× the prior size.

### 3. Default moves on add (User Story 3, contracts/default_moveset.md)

1. Add a Pokémon with known level-up moves to an empty team slot.
2. Open its customization card — its 4 move slots should already show its last (highest-level) level-up moves for the active game.
3. Manually change one move; confirm it stays changed (never reverts).

### 4. Hideable type filter (User Story 4, contracts/move_type_filter_toggle.md)

1. Open a move slot's selection sheet — confirm no type filter is visible.
2. Toggle "show type filter" on — confirm the filter tiles appear and work as before.
3. Toggle it off — confirm the filter hides and the full move list reappears.

### 5. Full-width move slots (User Story 5, contracts/full_width_move_slots.md)

1. Open a customization card with move slots filled.
2. Confirm each move slot spans the card's full width and they stack vertically.

## Automated Tests

```bash
flutter test
flutter analyze
```

Expect all tests to pass except the one pre-existing, unrelated `test/widget_test.dart` failure. `flutter analyze` should report no new findings beyond the existing pre-existing info-level lints.
