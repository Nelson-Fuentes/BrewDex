# UI/Domain Contract: Tera Type (Escarlata/Púrpura only)

Not a new port — a new `RosterEntry` field (`data-model.md`) plus a new presentation control. Documented separately because it introduces a game-specific concept the domain layer did not have before.

## Where it applies

`game.id == 'scarlet-violet'` only (the id `_regionalFormSuffixByGameId`/`isNationalDexEligible`-style tables in this codebase already use for that game). Every other game: `RosterEntry.teraType` is simply never set and never rendered — no branch inside `RosterEntry` itself; the gate lives in the application use case (`AddPokemonToTeam`) and in the presentation widgets that would render it.

## Set

- **At add-time** (`AddPokemonToTeam`, FR-016a): when the target game is Escarlata/Púrpura, the new `RosterEntry.teraType` is set to the added `PokedexEntry.typePrimary` (the principal variety's, since form selection is a follow-up step — see `TeamBuilderPage._addPokemon`).
- **By the user** (`TeraTypePicker` on `PokemonCustomizationCard`, FR-016b): a grid/list of all 18 `PokemonType`s (same source the existing `PokedexTypeFilter` already draws from); selecting one calls `TeamBuilderCubit.updateRosterEntry(slotIndex, rosterEntry.copyWith(teraType: picked))`, unconditionally — any of the 18 types is legal regardless of the Pokémon's own types.
- **Never recomputed** by a form change (FR-016c) — `_applyFormChange` in `PokemonCustomizationCard` must NOT touch `teraType` when it resets `cosmeticVariantId`/`gender` for an incompatible new form.

## Show

- `TeamSlot` (FR-016): when `game.id == 'scarlet-violet'` and `rosterEntry.teraType != null`, render it alongside the slot's normal type badges (`resolveSlotTypes`), visually distinguished from them (e.g. a small "Tera" label or distinct badge shape) so it's never confused with a third normal type.
- `PokemonCustomizationCard` (FR-017): same gate, showing the current `teraType` plus the `TeraTypePicker` to change it.
- Every other game: no Tera Type row/section anywhere (Edge case / Acceptance Scenario 5).

## Test impact

- `add_pokemon_to_team_test.dart`: adding to a Scarlet/Violet roster sets `teraType` to the entry's `typePrimary`; adding to any other game leaves `teraType` null.
- `pokemon_customization_card_test.dart`: Tera section only renders for Scarlet/Violet; picking a type updates `rosterEntry.teraType`; changing form afterward leaves `teraType` unchanged.
- `team_slot_test.dart`: Tera badge only renders for Scarlet/Violet with a non-null `teraType`.
