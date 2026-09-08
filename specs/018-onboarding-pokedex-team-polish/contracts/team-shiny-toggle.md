# Contract: Team Pokémon Detail Modal & Shiny Toggle

Scope: new `team/presentation/pokemon-detail-modal.component.ts`, plus one new method on the existing `TeamStore` (`InMemoryTeamService`). No new port — this is presentation + a sibling application method to the existing `toggleMega`/`toggleGigamax`.

## `TeamStore` addition

```ts
interface TeamStore {
  // existing: toggleMega(slotIndex, active), toggleGigamax(slotIndex, active), ...

  /** Sets `RosterEntry.isShiny` for the given slot. Persists on the slot
   *  (survives closing/reopening the detail modal) until called again or
   *  the Pokémon is removed from the slot (spec.md Clarifications,
   *  2026-09-06). No-op if the slot is empty. */
  toggleShiny(slotIndex: number, active: boolean): void;
}
```

Implementation mirrors `toggleMega`: `this.updateSlot(slotIndex, (slot) => slot.copyWith({ isShiny: active }))`.

## `PokemonDetailModalComponent` inputs/outputs

```ts
class PokemonDetailModalComponent {
  readonly pokedexEntry = input.required<PokedexEntry>();   // name, types, sprites
  readonly isShiny = input(false);                          // current RosterEntry.isShiny
  readonly shinyChange = output<boolean>();                 // toggle event
  readonly close = output<void>();
}
```

Renders: `pokedexEntry().displayName`, `typePrimary`/`typeSecondary` via `TypeBadgeComponent`, and an `<img>` bound to `isShiny() ? pokedexEntry().homeSpriteShinyUrl : pokedexEntry().homeSpriteUrl` (falls back to the non-shiny URL if the shiny one is `null` — spec.md Edge Cases). A `mat-slide-toggle` (outlined per Decision 1) emits `shinyChange` on change.

## Wiring in `TeamBuilderPage`

- Clicking an occupied `TeamSlotComponent` (existing `select` output) opens `PokemonDetailModalComponent` for that slot instead of (or in addition to — see below) `FormSelectionModalComponent`.
- `(shinyChange)="teamService.toggleShiny(activeSlotIndex()!, $event)"`.
- `TeamSlotComponent`'s avatar `<img>` binding changes from `details.homeSpriteUrl` to `slotEntry.isShiny ? details.homeSpriteShinyUrl ?? details.homeSpriteUrl : details.homeSpriteUrl`.

**Relationship to `FormSelectionModalComponent`**: that existing modal handles *form/variety* selection (template forms, distinct from Mega/Gigamax buttons) and is a separate concern from this feature's name/types/image/shiny detail card. Both can be reachable from the same slot click (e.g., the detail modal hosting a "change form" action that opens the existing form modal) — the exact composition (one modal replacing the other's trigger vs. two steps) is a tasks-level UI decision, not a contract change, since neither modal's existing public contract needs to change for this feature's FR-019–FR-022a to be satisfied.

## Acceptance mapping (spec.md)

| Acceptance Scenario | Contract behavior |
|---|---|
| US3.6 — click occupied slot opens modal with name/types/image | `PokemonDetailModalComponent` renders exactly those fields |
| US3.7/US3.8 — toggle updates modal AND slot image, reverts on second press | `isShiny` input drives both the modal's own image and (via `RosterEntry.isShiny` read by `TeamSlotComponent`) the slot's image from the same source of truth |
| US3.9 — shiny persists across modal close/reopen | `isShiny` lives on `RosterEntry` in `InMemoryTeamService.slots`, not on the modal component's local state |
