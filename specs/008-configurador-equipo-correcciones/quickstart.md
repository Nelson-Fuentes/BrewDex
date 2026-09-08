# Quickstart: Validating the Configurador de Equipo Fixes

Prerequisites: Flutter SDK matching `pubspec.yaml` (`sdk: ^3.8.1`), dependencies installed (`flutter pub get`), a network connection (this feature reads live PokeAPI/`github.com/PokeAPI/sprites` data, no mocked fixtures at runtime).

## Setup

```bash
flutter pub get
flutter test                 # full existing + new regression suite
flutter run -d chrome        # or your platform of choice, for manual verification
```

Navigate: game selection → pick a game with both a National Dex and at least one species with a Mega Evolution and a shiny sprite (e.g. Escarlata/Púrpura works for every story including Tera Type; X/Y or Sol/Luna also work for everything except Tera Type) → the armador (team builder) opens.

## Scenario 1 — Pokédex loads completely (User Story 1)

1. Open a game's National Dex (toggle "Pokédex Nacional" on if eligible).
2. Scroll to the very end of the grid without pausing partway through.
3. **Expected**: the last species of that Pokédex (highest dex number) is visible and tappable — no placeholder tile at the end.
4. Search by name for a species known to be near the end of the list (e.g. a late-generation species while National Dex is on).
5. **Expected**: it appears in the filtered grid even though it was never scrolled into view.

## Scenario 2 — Team column fills free space (User Story 2)

1. Open the armador on a desktop-width window (≥ the app's `expanded` breakpoint).
2. **Expected**: the left slots column visibly grows/shrinks with the window width (within its bounded range) and its 6 tiles fill the column's available height — no large empty strip below the slot grid on a tall window.

## Scenario 3 — Official type icons (User Story 3)

1. Add two Pokémon of the same type (e.g. two Fire types) to the team, from two different games if convenient.
2. **Expected**: both show the identical type icon, regardless of which game's armador they were added from — compare against the current official Pokémon type-icon set (rounded badge, Generation IX style).

## Scenario 4 — Gender toggle works, and composes with other changes (User Stories 4, 6, 7)

1. Add a species with male/female sprite differences and a Mega Evolution (e.g. Pidgey has gender differences but no Mega — pick something like Gardevoir, Charizard, or Absol for the Mega+shiny half; Pidgey alone is enough for the gender-only half).
2. Open its customization card. Tap the Género segmented control to switch to Hembra.
3. **Expected**: the segment visibly highlights Hembra immediately, and the sprite updates to the female variant in the same card (not only after closing).
4. With a Mega-capable, shiny-capable species: tap Shiny, then tap Mega (without closing the sheet).
5. **Expected**: the card now shows the Mega form's shiny sprite — both toggles are visibly active, and closing the sheet shows the same result in the team slot.
6. Tap a different Forma thumbnail (if the species has template forms).
7. **Expected**: the card's own sprite, type chips, and base stats update immediately to the new form, not only the team slot behind it.

## Scenario 5 — Gender availability matches the species (User Story 5)

1. Add a genderless species (e.g. Magnemite, or a Legendary such as Articuno).
2. **Expected**: no gender section/toggle appears at all; the Pokémon is treated as "sin género".
3. Add a single-fixed-gender species (e.g. a member of the Nidoran-M or Nidoran-F line, `gender_rate` 0 or 8).
4. **Expected**: no gender picker is offered (nothing to choose), and the sprite/behavior consistently reflects that species' one real gender — not silently defaulted to male for an always-female species.
5. Add a both-genders species (e.g. Pidgey).
6. **Expected**: the gender picker is offered and functional (Scenario 4).

## Scenario 6 — Base stats shown (User Story 8)

1. Open any Pokémon's customization card.
2. **Expected**: a labeled section shows PS, Ataque, Defensa, Ataque Especial, Defensa Especial, and Velocidad with numeric values.
3. Switch to a Mega Evolution or alternate form (if available).
4. **Expected**: the six values update to that form's own base stats.

## Automated coverage

`flutter test` should include, at minimum, new/updated tests for:
- `test/infrastructure/team_builder/pokeapi_pokedex_repository_test.dart` — `baseStats` parsed correctly for a principal variety and a `SelectableForm`.
- `test/application/team_builder/add_pokemon_to_team_test.dart` — single-fixed-gender auto-apply (`genderRate` 0/8) and unchanged behavior for genderless/both-genders species.
- `test/presentation/team_builder/pokemon_customization_card_test.dart` (or equivalent) — the Shiny-then-Mega composition regression test from `contracts/pokemon_customization_card_reactivity.md`, plus a base-stats-render assertion.
- `test/presentation/team_builder/type_icon_resolution_test.dart` — `typeIconUrl` no longer varies by `Game`.
