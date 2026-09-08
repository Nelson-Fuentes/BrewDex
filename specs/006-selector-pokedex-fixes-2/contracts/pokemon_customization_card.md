# UI Contract: Pokémon Customization Card (`Tarjeta de Personalización de Pokémon`)

New presentation-layer surface (Historia 9–12), opened from an occupied
`TeamSlot`. Not a repository/port contract (no new domain interface) —
documented here because it replaces an existing gesture
(`data-model.md`'s "Amended interaction" note) and because its input/
output shape is worth pinning down before task breakdown.

## Trigger

`TeamSlot.onTap` (occupied slot only) opens this card instead of
today's immediate `onRemove` call
(004-pokedex-team-builder FR-010, amended by this feature).

## Input

- The slot's `TeamSlotView` (`entry: PokedexEntry`, `rosterEntry:
  RosterEntry` — `data-model.md`).
- `Game` (for the form-selection sub-modal's game-specific sprites,
  FR-021).

## Sections shown (each conditional, per FR-023)

| Section | Shown when | Control | On change |
|---|---|---|---|
| Forma | `entry.selectableForms.isNotEmpty` | Reopens the same form picker used at add-time (FR-020/FR-021 sprites) | `formVarietyId` updated; if the new form doesn't carry the current `cosmeticVariantId`/`gender`, that field resets to default (Edge Cases) |
| Mega Evolución | `entry.megaForm != null` | Toggle button | Sets `megaActive = true`, `gigamaxActive = false` (FR-024c) |
| Gigamax/Dinamax | `entry.gigamaxForm != null` | Toggle button | Sets `gigamaxActive = true`, `megaActive = false` |
| Género | `entry.genderRate` is mixed (not `-1`, not `8` acting as forced) — i.e. more than one legal value | Segmented control: Macho / Hembra | Sets `gender` |
| Variante cosmética | `entry.cosmeticVariants.isNotEmpty` | Grid/list picker of `CosmeticVariant.spriteUrl` thumbnails | Sets `cosmeticVariantId` |
| Variocolor | `entry.homeSpriteShinyUrl != null` (or the gender-appropriate shiny field once gender is chosen) | Toggle | Sets `isShiny`; **absent entirely**, not disabled, when no shiny sprite resolves for the current form/gender combination (FR-026a) |
| Quitar del equipo | always | Button | Calls `removePokemon(slotIndex)` (unchanged use case), closes the card |

A species with none of Forma/Mega/Gigamax/Género/Variante applicable
still shows the card with just Variocolor + Quitar — the card is always
reachable, never conditionally skipped (every slot needs at least the
shiny toggle and the remove action reachable one tap away).

## Output

Every field change calls straight through to
`TeamBuilderCubit.updateRosterEntry(slotIndex, RosterEntry)` (new Cubit
method, replaces no existing one), which persists via the amended
`TeamRosterStore.writeRoster` and updates `entryCache`'s resolved sprite
for that slot (`homeSpriteUrl` vs `homeSpriteShinyUrl` vs the
form/variant-specific ones, resolved by a small pure presentation
helper — no new domain concept, just which of `PokedexEntry`'s
already-resolved sprite fields to pick for the current `RosterEntry`).

## Test impact

- `team_slot_test.dart`: tapping an occupied slot opens the card instead
  of calling `onRemove` directly.
- `pokemon_customization_card_test.dart` (**new**): each section's
  conditional visibility; toggling Mega deactivates Gigamax and vice
  versa; changing form resets an incompatible variant/gender; shiny
  toggle absent when no shiny sprite resolves.
- `team_builder_cubit_test.dart`: `updateRosterEntry` persists and
  updates the resolved slot sprite.
