# Quickstart: Validating 014-team-configurator-fixes-2

Prerequisites: `flutter pub get` run once; a Chrome (web) target and a
mobile-sized simulator/emulator (or a resized Chrome window) available for
the responsive scenarios.

## Automated checks

```bash
flutter analyze
flutter test
```

Every scenario below also has a corresponding automated test named in the
relevant `contracts/*.md` — running the full suite is the fastest way to
confirm all nine stories, but the manual steps below are what to demo.

## US1 — Moves survive Mega/Dinamax (P1)

1. Run the app (`flutter run -d chrome`), pick a game with Mega Evolution
   (e.g. Omega Ruby/Alpha Sapphire) and a Pokémon with a known Mega form.
2. Add it to the team, open its customization card, assign all 4 moves.
3. Toggle Mega on. **Expect**: all 4 moves still shown as selected.
4. Toggle Mega off. **Expect**: moves still intact.
5. Repeat with a Dinamax/Gigamax-capable Pokémon in Espada/Escudo.

## US2 — Coverage Analysis table is visible (P1)

1. Open the armador for any game, tap the coverage/stats icon in the app
   bar.
2. Resize the browser window shorter than the table's natural height (or
   use a phone-sized viewport). **Expect**: the table scrolls into view —
   never clipped off the bottom of the screen.

## US3 — Feraligatr has moves in Legends Z-A (P1)

1. Select Leyendas Pokémon Z-A as the active game.
2. Add Feraligatr to the team, open its move selector. **Expect**: a
   non-empty list of learnable moves.

## US4 — Mega Evolution available in Legends Z-A (P1)

1. With Leyendas Pokémon Z-A active, add a Pokémon with a known Mega form
   (e.g. one of the starters' final evolutions with a Mega) to the team.
2. Open its customization card. **Expect**: the Mega toggle is present and
   activating it applies the Mega form — with no separate DLC toggle
   needing to be found/enabled first.

## US5 — Correct pre-Fairy types in old-generation games (P1)

1. Select a Generation V-or-earlier game (e.g. Blanco/Negro).
2. Add Clefairy to the team. **Expect**: its shown type is Normal, not
   Hada/Fairy.
3. Switch the active game to Escarlata/Púrpura (or any Gen VI+ game) with
   the same Pokémon still in the team. **Expect**: its type updates to
   Fairy.

## US6 — Type badges fit two-per-row on web, match card ↔ slot (P2)

1. On a wide (web) viewport, add a two-type Pokémon (e.g. Charizard) to
   the team. **Expect**: both type badges render in a single row inside
   the slot.
2. Open its customization card. **Expect**: its type badges are the same
   rendered size as the slot's — not smaller.

## US7 — Larger card sprite (P2)

1. Open any Pokémon's customization card. **Expect**: the sprite is
   noticeably larger than before, with the rest of the card's content
   (name, types, moves, actions) still fully legible and unclipped.

## US8 — Coverage table defense-efficacy column (P2)

1. Open a Pokémon's customization card, navigate to Coverage Analysis from
   that context.
2. **Expect**: a "Eficacia de defensa" column showing, per attacking type
   row, that Pokémon's real damage multiplier (0/0.5/1/2/4) — cross-check
   a couple of rows by hand against the Pokémon's known type matchups.
3. Go back, open a different Pokémon's card, reopen Coverage Analysis.
   **Expect**: the column's values update for the new Pokémon.

## US9 — Mega/Dinamax/Shiny buttons stay visible while scrolling (P3)

1. Open a customization card with enough content to require scrolling
   (e.g. a Pokémon with 4 moves assigned, on a short viewport).
2. Scroll the card's body. **Expect**: the Mega/Dinamax/Shiny row and
   "Quitar del equipo" both stay visible/fixed, never scrolling out of
   view or overlapping each other/other content.
