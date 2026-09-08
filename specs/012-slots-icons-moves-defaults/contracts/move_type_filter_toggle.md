# Contract: Filtro por Tipo Ocultable en la Selección de Movimientos

**Covers**: FR-009, FR-010, FR-011 (User Story 4)

## Rule

`MoveSelectionSheet` renders a toggle control (`Switch`/`SwitchListTile`) above the type-filter tiles. The type-filter `Wrap` is only built/shown while the toggle is on; it starts **off**. Toggling it off also clears any active `_typeFilter` selection in the same state update, so the visible move list always matches what the toggle communicates (off = no filter applied). Toggling it on/off never re-fetches or reorders `widget.moves` — only visibility (and, when turning off, the filter selection) changes.

## Test Expectations

- A freshly-opened `MoveSelectionSheet` does not show any type-filter tile.
- Toggling the switch on reveals the type-filter tiles, which filter the list exactly as before this feature.
- Selecting a type, then toggling the switch off, hides the filter tiles AND shows the full unfiltered move list again (the selection was cleared).
- Toggling the switch on then off then on again never loses or reorders the underlying `widget.moves` list.
