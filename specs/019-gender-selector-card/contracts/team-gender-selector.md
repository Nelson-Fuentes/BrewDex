# Contract: Team Pokémon Detail Modal — Gender Selector

Scope: extends the existing `team/presentation/pokemon-detail-modal.component.ts` (from `018`) and adds one new method on the existing `TeamStore` (`InMemoryTeamService`), plus two new pure functions in `pokemon/domain/value-objects/gender.ts`. No new port, no new component, no new persisted field — `RosterEntry.gender` already exists.

## `pokemon/domain/value-objects/gender.ts` additions

```ts
export type Gender = 'male' | 'female' | 'genderless'; // unchanged

export type GenderCapability = 'dual' | 'male-only' | 'female-only' | 'genderless';

/** Derived from PokeAPI's `species.gender_rate` (`PokedexEntry.genderRate`):
 *  -1 → genderless, 0 → male-only, 8 → female-only, 1-7 → dual. */
export function genderCapability(genderRate: number): GenderCapability;

/** `storedGender` is `RosterEntry.gender`. Returns it unchanged when set;
 *  otherwise derives the default from `genderCapability` (dual/male-only
 *  → 'male', female-only → 'female', genderless → 'genderless') — spec.md
 *  FR-003/FR-004/FR-005/FR-006. */
export function resolveDisplayGender(genderRate: number, storedGender: Gender | null): Gender;
```

## `TeamStore` addition

```ts
interface TeamStore {
  // existing: toggleShiny(slotIndex, active), toggleMega(slotIndex, active), ...

  /** Sets `RosterEntry.gender` for the given slot. Persists on the slot
   *  (survives closing/reopening the detail modal) until called again or
   *  the Pokémon is removed from the slot (spec.md Clarifications,
   *  2026-09-07; FR-013/FR-014). No-op if the slot is empty. Only
   *  meaningful for dual-gender species — presentation only calls this
   *  from the gender toggle, which is only rendered when
   *  `genderCapability(pokedexEntry.genderRate) === 'dual'`. */
  toggleGender(slotIndex: number, gender: Gender): void;
}
```

Implementation mirrors `toggleShiny`: `this.updateSlot(slotIndex, (slot) => slot.copyWith({ gender }))`.

## `PokemonDetailModalComponent` inputs/outputs

```ts
class PokemonDetailModalComponent {
  readonly pokedexEntry = input.required<PokedexEntry>();   // name, types, sprites, genderRate
  readonly isShiny = input(false);                          // unchanged (018)
  readonly shinyChange = output<boolean>();                 // unchanged (018)
  readonly gender = input<Gender>('male');                  // resolveDisplayGender() result, computed by TeamBuilderPage
  readonly genderChange = output<Gender>();                 // NEW — emitted only from the dual-gender toggle
  readonly close = output<void>();                          // unchanged (018)
}
```

Renders, in place of nothing today (new UI element, next to the shiny toggle):
- When `genderCapability(pokedexEntry().genderRate) === 'dual'`: a `mat-button-toggle-group` (exclusive selection) bound to `gender()`, with two `mat-button-toggle` options — `♂` (value `'male'`) and `♀` (value `'female'`) — emitting `genderChange` on change (spec.md FR-002).
- Otherwise: a static, non-interactive indicator — `♂` if `'male-only'`, `♀` if `'female-only'`, `—` if `'genderless'` (spec.md FR-004/FR-005/FR-006).

The existing `<img>` binding (today `isShiny() ? pokedexEntry().homeSpriteShinyUrl : pokedexEntry().homeSpriteUrl` falling back to non-shiny) is replaced by `resolveSpriteUrl(pokedexEntry(), gender(), isShiny())` per research.md Decision 4:

```ts
function resolveSpriteUrl(entry: PokedexEntry, gender: Gender, shiny: boolean): string | null {
  const female = gender === 'female';
  if (shiny) {
    return (female ? entry.homeSpriteShinyFemaleUrl : null) ?? entry.homeSpriteShinyUrl ?? entry.homeSpriteUrl;
  }
  return (female ? entry.homeSpriteFemaleUrl : null) ?? entry.homeSpriteUrl;
}
```

## Wiring in `TeamBuilderPage`

- New computed: `activeGender = computed(() => resolveDisplayGender(this.activeEntry()?.genderRate ?? -1, this.activeRosterEntry()?.gender ?? null))`, passed as `[gender]="activeGender()"` to `app-pokemon-detail-modal`.
- `(genderChange)="onGenderChange($event)"`, where `onGenderChange(gender: Gender)` delegates: `const index = this.activeSlotIndex(); if (index !== null) { this.teamService.toggleGender(index, gender); }` — same shape as the existing `onShinyChange`.

## Wiring in `TeamSlotComponent`

- Its existing internal sprite computation (`(isShiny ? details.homeSpriteShinyUrl : null) ?? details.homeSpriteUrl ?? EGG_SPRITE_URL`) is generalized to also read `slotEntry.gender` and call the same `resolveSpriteUrl` fallback chain (falling back to `EGG_SPRITE_URL` only when the final result is still `null`), using `resolveDisplayGender(details.genderRate, slotEntry.gender)` for the gender to display — so the team grid tile and the detail modal always agree on which sprite to show for the same `RosterEntry` (research.md Decision 4).

## Acceptance mapping (spec.md)

| Acceptance Scenario | Contract behavior |
|---|---|
| US1.1 — dual-gender Pokémon just added to team opens with male selected | `activeRosterEntry()?.gender` is `null` → `resolveDisplayGender` returns `'male'` → toggle shows male selected |
| US1.2/US1.3 — toggling the icon switches the selection and persists it | `genderChange` → `TeamStore.toggleGender(index, gender)` → `RosterEntry.gender` updated → next `resolveDisplayGender` call returns the stored value unchanged |
| US1.4 — reopening the modal shows the previously saved gender | `RosterEntry.gender` lives on `InMemoryTeamService.slots`, not on the modal's local state — same source of truth pattern as `018`'s `isShiny` |
| US2.1-US2.3 — single-gender / genderless species show a fixed indicator, no toggle | `genderCapability(pokedexEntry().genderRate) !== 'dual'` → static indicator branch renders, `mat-button-toggle-group` is not rendered at all |
| US3.1/US3.2 — image follows the selected gender when the species has gender differences, stays the same otherwise | `resolveSpriteUrl` falls back to the base URL whenever the gender-specific field is `null` (species without gender differences never populate `homeSpriteFemaleUrl`/`homeSpriteShinyFemaleUrl`) |
| US4.1-US4.3 — image respects shiny × gender in every combination | `resolveSpriteUrl(entry, gender, shiny)` is a pure function of both inputs, called fresh on every change to either `gender()` or `isShiny()` |
