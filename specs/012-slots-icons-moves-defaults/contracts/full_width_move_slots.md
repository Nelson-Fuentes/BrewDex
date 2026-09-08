# Contract: Movimientos a Todo el Ancho de la Tarjeta

**Covers**: FR-012, FR-013 (User Story 5)

## Rule

In `PokemonCustomizationCard`'s Moves section, the 4 `_MoveSlotTile`s are laid out in a `Column` (not a `Wrap`), each stretched to the full available width of the card (no fixed `width: 160`), stacked vertically with consistent spacing between them. `_MoveSlotTile`'s internal content (icon, name, PP/power, clear affordance) is unchanged — only its outer sizing/layout container changes.

## Test Expectations

- A `PokemonCustomizationCard` pumped at a known test width renders 4 move-slot tiles whose measured width equals the card's content width (card width minus the card's own horizontal padding), not a fixed 160.
- The 4 tiles' vertical positions are strictly increasing (top-to-bottom stacking, not a multi-column wrap).
