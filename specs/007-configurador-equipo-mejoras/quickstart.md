# Quickstart: Validating the Configurador Improvements

Prerequisites: Flutter SDK installed and matching this repo's `pubspec.yaml`; run `flutter pub get` once before any of the below.

## Automated checks

```bash
flutter analyze
flutter test
```

Everything in `test/domain/team_builder`, `test/application/team_builder`, `test/infrastructure/team_builder`, `test/presentation/team_builder`, and the `game_selection` equivalents must pass — see each `contracts/*.md`'s "Test impact" section for what's new/changed per user story.

## Manual end-to-end validation (per user story)

Run the app (`flutter run -d chrome` for the web-layout scenarios, any target for the rest) and, for each scenario, confirm against its spec.md Acceptance Scenario:

1. **US1 — Game switch reset**: pick a game, add a Pokémon to a slot, go back, pick a *different* game → armador opens immediately (no dialog), team empty. Repeat picking the *same* game again → still no dialog, team still resets to empty.
2. **US2 — Two-pane web layout**: open the armador in a browser window ≥ 840px wide → team slots left, Pokédex right, each independently scrollable (scroll the Pokédex pane; the slots pane does not move). Resize below 840px → falls back to the existing single-column layout.
3. **US3 — Fast Pokédex load**: open a National Dex-eligible game's armador with National Dex on → the first ~20 entries render in well under a second; scroll to the bottom of what's loaded → more entries appear without a visible pause; type a Pokémon name known to be far past #20 in the dex → it appears in results even though it was never in the initial batch.
4. **US4 — Correct shiny/gender sprite**: add a Pokémon with both alternate forms and a gender difference (e.g. one with a regional/Mega form); pick a non-default form, toggle Shiny → sprite is that form's shiny, not the default form's; switch gender → sprite is that form's gender variant.
5. **US5 — Pokéball backgrounds + types**: add a Pokémon → its Pokédex tile's pokéball background changes color; open its slot (making it "active") → that slot's pokéball background changes color, others don't; confirm the slot and the customization card both show its type(s), updating if you change form. In a Escarlata/Púrpura team, confirm a Tera Type badge appears (defaulted to the primary type) and is changeable from the card; confirm no Tera Type UI appears in a non-Scarlet/Violet game.
6. **US6 — Redesigned customization card**: open a slot's card → matches the reference layout (header, image on pokéball, name, types, Forma, Género, Estados Especiales, Quitar del equipo); change a few fields → highlights and sprite update immediately and consistently with the slot/Pokédex.

## Where to look when something fails

- Slow/blank Pokédex → check `TeamBuilderCubit`'s index/details wiring (`contracts/pokedex_repository_pagination.md`) before assuming a network issue — the index fetch should be near-instant even when detail batches are still resolving.
- Wrong shiny/gender sprite → check `slot_sprite_resolution.dart` is reading the *matched form's* fields, not falling through to `entry.*` (`research.md` Decision 4).
- Dialog still appears on game switch → a stale reference to the removed `requestGameSwitch`/`confirmGameSwitch` flow somewhere not yet migrated (`contracts/game_switch_reset.md`).
