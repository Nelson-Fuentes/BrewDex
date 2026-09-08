# Quickstart: Formas por Juego, Reparación de Megaevolución, Slots más Grandes, Íconos y Movimientos

## Prerequisites

- Flutter SDK installed, `flutter pub get` run at the repo root.
- No environment/API keys needed — PokeAPI is public and unauthenticated.

## Validation Scenarios

### 1. Formas gated by game (User Story 1, contracts/form_availability_by_game.md)

```bash
flutter run -d chrome   # or any target
```
1. Select "Rojo Fuego/Verde Hoja" as the active game.
2. Open the customization card of a Pokémon with a known Mega Evolution (e.g. Charizard, Venusaur).
3. Confirm no Mega button appears in "Estados Especiales".
4. Switch the active game to "X/Y".
5. Reopen the same Pokémon's card — the Mega button now appears.

### 2. Mega revert bug fix (User Story 2, contracts/mega_gigamax_toggle.md)

1. With a game where Mega is available, open a Mega-capable Pokémon's card.
2. Tap "Mega" — sprite/types/stats switch to the Mega form.
3. Tap "Mega" again — sprite/types/stats revert to the base form.
4. Repeat 3 more times, confirming the cycle never gets stuck on the Mega form.

### 3. Team slot size (User Story 3, contracts/team_slot_sizing.md)

1. Open the app at a wide (web/desktop) viewport.
2. Compare a team slot's rendered size against a screenshot taken before this feature — it should measure at least double.

### 4. Type icon size (User Story 4, contracts/type_icon_sizes.md)

1. Open the team builder; observe type icons in a filled team slot, in an open customization card, and in the Pokédex type filter.
2. Confirm each is visibly larger and still resolves the official Escarlata/Púrpura artwork (no fallback Material icon, unless offline).

### 5. Move slots (User Story 5, contracts/movepool_repository.md, contracts/move_slots_ui.md)

1. Open any Pokémon's customization card in a specific game (e.g. "Escarlata/Púrpura").
2. Scroll to "Movimientos" — 4 empty slots.
3. Tap an empty slot — a sheet opens showing only moves that Pokémon can learn in that exact game, each with name/type/PP/power/description.
4. Filter by a type — the list narrows to that type only; tap the same type again to clear the filter.
5. Select a move — the slot now shows that move's name/type/PP/power/description.
6. Switch the active game to one where that Pokémon cannot learn the selected move — reopen the card and confirm the slot is now empty again.

## Automated Tests

```bash
flutter test
flutter analyze
```

Expect all tests to pass except the one pre-existing, unrelated `test/widget_test.dart` failure (present before this session's work began). `flutter analyze` should report no new findings beyond the 4 pre-existing `curly_braces_in_flow_control_structures` info-level lints.
