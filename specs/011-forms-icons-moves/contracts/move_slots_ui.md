# Contract: Sección de Movimientos en la Tarjeta de Personalización

**Covers**: FR-008, FR-010–FR-015 (User Story 5)

## Layout

`PokemonCustomizationCard` gains a new section, positioned after the existing "Estados Especiales" section (Mega/Gigamax/Shiny) and before the "Quitar del equipo" button — mirroring where the reference layout already places supplementary sections. The section title uses the same `theme.textTheme.labelLarge` style as every other section label in this card (`customizationCardMovesLabel`, new l10n key, added to all 10 locale ARB files per the `arb_completeness_test.dart` requirement).

It renders exactly 4 move-slot tiles in a `Wrap`/`Row` (mirroring `_FormTile`'s sizing conventions), each either:
- **Empty**: a dashed/outlined placeholder tile with a `+`/add affordance, tappable to open the move-selection view for that slot index.
- **Filled**: shows the selected `Move`'s `displayName`, `type` (via `PokemonTypeIcon`), `pp`, `power` (or a clear "—"/status indicator per FR-014 when `null`), and `description` (truncated/expandable as needed for a compact tile — full text always available, e.g. via a tap-to-expand or tooltip, never omitted). Tappable to reopen the move-selection view pre-scoped to that slot (to change or clear the selection).

## Move-Selection View

Opened via `showModalBottomSheet` (same mechanism `AddPokemonToTeam`'s Pokédex picker and `TeraTypePicker` already use), scoped to one slot index at a time. Shows:
- A type filter control (reusing `PokedexTypeFilter`'s tile styling/interaction pattern, scoped to the types present in the current candidate move list) — selecting a type narrows the list to moves of that type only; selecting again clears the filter (FR-012), same "select again to clear" interaction `PokedexTypeFilter` already has.
- A list of candidate moves, each showing `displayName`, `type`, `pp`, `power`, `description` (FR-011) — same fields as a filled slot tile, listed instead of summarized.
- Tapping a candidate move selects it into the open slot and closes the sheet (mirrors `_FormTile`'s tap-to-select, `AddPokemonToTeam`'s tap-to-add).
- The list source is `TeamBuilderState`'s resolved movepool for the active slot's current form + active game (`MovepoolRepository.fetchMovepool`, contracts/movepool_repository.md) — never a hardcoded or unfiltered move list.

## Rules

- FR-013: selecting a move already occupying another slot of the same Pokémon moves it into the newly-tapped slot and empties the old one — never two slots holding the same `Move.id` simultaneously.
- FR-015: whenever the active form or the active game changes (including the Mega/Gigamax toggle from User Story 2), any `moveIds` entry absent from the freshly-resolved movepool is cleared to `null` — a slot never displays a move invalid for the current form/game.

## Test Expectations

- A `PokemonCustomizationCard` pumped with a `RosterEntry.moveIds` of `[moveA.id, null, null, null]` renders one filled tile (showing `moveA`'s name/type/pp/power/description) and three empty tiles.
- Tapping an empty tile opens a sheet whose move list matches the fixture-injected movepool exactly, filtered correctly when a type filter tile is tapped.
- Tapping a candidate move in the sheet closes it and updates the corresponding `RosterEntry.moveIds` entry via `onChanged`.
- Selecting a move already present in slot 0 while filling slot 2 results in `moveIds == [null, null, thatMove.id, null]`.
- Changing the active form to one whose movepool no longer contains a previously-selected move clears that slot to `null`.
