# Quickstart: Validating Onboarding, Pokedex & Team Builder Polish

## Prerequisites

```bash
cd web
npm install   # if not already done
```

No environment variables or backend needed — the app talks to the public PokeAPI directly from the browser (existing setup, unchanged).

## Run the app

```bash
npm start   # ng serve, http://localhost:4200
```

## Manual validation per user story

### US1 — Onboarding flow (language → game → team, with back)

1. Open the app at `/idioma`. Confirm the language list options are compact/uniformly sized with visible gaps between them (FR-001), and there is **no** "Continuar" button.
2. Click a language. Confirm immediate navigation to `/juego` (FR-002).
3. Confirm each game card shows a `catching_pokemon` pokeball icon and a color distinct from its neighbors (FR-003), and there is a visible back control.
4. Click the back control → confirm return to `/idioma` with the previously selected language still marked selected (FR-005, SC-007).
5. Go forward again, click a game card. Confirm immediate navigation to `/equipo` (FR-004), with **no** "Seleccionar" button click required.

### US2 — Pokedex sprites, DLC toggles, pagination, filters

1. Select Pokémon Red/Blue (or another Generation I game). On `/equipo`'s Pokedex panel, confirm sprites are Generation I pixel-art style, not modern/official artwork (FR-006, SC-004).
2. Select Pokémon Legends Z-A. Confirm a "Mega Dimension" toggle appears next to the main Pokedex (FR-009), starts off, and switching it on adds a second Pokedex section below the first without removing it (FR-010); switching off removes it again (FR-011).
3. In game selection, confirm "Mega Dimension" never appears as its own selectable game card, and Sun, Moon, Ultra Sun, and Ultra Moon each appear as their own separate game cards (FR-007, FR-008, SC-002).
4. On any game's Pokedex, confirm only ~10-20 entries render initially (Network tab: only that many `pokemon/{id}` calls fire), and scrolling near the bottom triggers the next batch automatically, with no "load more" button (FR-012, FR-013, SC-003).
5. While the Pokedex is still mid-pagination (not all batches loaded), type a search term or pick a type filter whose matches include species beyond what's currently loaded. Confirm those matches still appear (Network tab shows additional detail calls firing to complete the filter) rather than being silently excluded (FR-013a, SC-008).

### US3 — Team builder layout, uniform slots, remove icon, shiny modal

1. On `/equipo`, confirm the selected game's name is visible on the page (FR-014).
2. Confirm the filter row (search/type/national-dex/DLC toggles) has visible padding from the screen edges (FR-015).
3. Confirm the 6 team slots render as a 3-column × 2-row grid (FR-016).
4. Add a Pokémon to an empty slot from the Pokedex panel; confirm the slot's box dimensions do not change (compare before/after with browser dev tools box model) (FR-017, SC-005).
5. Confirm the occupied slot shows a distinct remove/close icon (not a text button); click it and confirm the slot returns to empty (FR-018).
6. Click an occupied slot's Pokémon. Confirm a modal opens with its name, type badge(s), and image (FR-019, FR-020).
7. Toggle "shiny" on: confirm both the modal image and the team slot's image switch to the shiny sprite (FR-021). Toggle off: confirm both revert (FR-022).
8. With shiny still on, close the modal (without toggling off) and reopen it: confirm the slot image stayed shiny the whole time and the modal reopens with the toggle already on (FR-022a, SC-006).

### US4 — Outlined visual style

1. Visually scan `/idioma`, `/juego`, `/equipo`, and the Pokémon detail modal: buttons, toggles, cards, and search/filter inputs should consistently use Material's outlined appearance (FR-023).

## Automated checks

```bash
npm test        # Jasmine/Karma unit + component tests
npm run test:e2e  # Playwright end-to-end (User Story flows)
npm run lint
```

Regression tests to add/extend per Constitution Principle II (test-first): `game.dlc.spec.ts`/`pokeapi-game-catalog-repository.service.spec.ts` (Mega Dimension/USUM classification), `pokeapi-pokemon-repository.service.spec.ts` (versioned sprite resolution), `in-memory-pokedex.service.spec.ts` (batching + filter-driven resolve-to-completion), `in-memory-team.service.spec.ts` (`toggleShiny`), plus new component specs for `PokemonDetailModalComponent` and the updated `TeamSlotComponent`/`GameCardComponent`/`TeamBuilderPage` templates.
