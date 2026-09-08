# Contract: Personalización de Pokémon card reactivity

**Amends**: the sheet-opening call site in `lib/presentation/team_builder/pages/team_builder_page.dart` (`_openCustomizationCard`). `PokemonCustomizationCard`'s own public constructor/widget shape is unchanged (`game`, `entry`, `rosterEntry`, `onChanged`, `onRemove`) — this contract governs *what feeds those parameters while the sheet is open*, not the widget's API.

## Rule

While the Personalización de Pokémon card is open for slot `i`:

1. Every value the card renders (sprite, name, type chips, base stats, Forma thumbnails' selected state, Género segmented selection, Variante thumbnails' selected state, Mega/Gigamax/Shiny active state) MUST reflect `TeamBuilderCubit.state.slots[i]` as of the most recent emission — never a value captured only at the moment the sheet was opened.
2. Every `onChanged(updated)` call MUST compute `updated` from the freshest `RosterEntry` for slot `i` at the time of the tap — i.e., a value the user has never seen (because it was set by a different control moments earlier, in the same open session) MUST NOT be silently discarded by a later `onChanged` call.
3. If the slot's occupant changes out from under the open sheet for a reason other than the sheet's own controls (e.g. `removePokemon` racing in from elsewhere — not a normal flow today, but not ruled out), the sheet MUST close itself (`entry`/`rosterEntry` becoming unavailable for slot `i`) rather than render stale or null data.

## Before (violated)

```text
entry/rosterEntry captured once from state.slots[slotIndex]
  -> showModalBottomSheet(builder: (_) => PokemonCustomizationCard(entry: entry, rosterEntry: rosterEntry, ...))
  -> every onChanged composes off that same frozen `rosterEntry`
```

Symptom: a second control tapped in the same session silently reverts every field the first control's tap had just set (research.md Decision 4).

## After (this contract)

```text
showModalBottomSheet(builder: (_) => BlocBuilder<TeamBuilderCubit, TeamBuilderState>(
  builder: (context, state) {
    final slot = state.slots[slotIndex];
    if (slot.entry == null || slot.rosterEntry == null) {
      // occupant gone out from under the sheet — close it (Rule 3)
    }
    return PokemonCustomizationCard(
      entry: slot.entry!,
      rosterEntry: slot.rosterEntry!,
      onChanged: (updated) => cubit.updateRosterEntry(slotIndex, updated),
      ...
    );
  },
))
```

`onChanged`'s `updated` argument is still built by `PokemonCustomizationCard`'s own control handlers via `rosterEntry.copyWith(...)` exactly as today — the fix is that the `rosterEntry` those handlers close over is now always the latest one the `BlocBuilder` handed the card, not a value fixed before the sheet ever opened.

## Verification

A widget test opens the sheet for an occupied slot whose species has both a Mega form and a shiny sprite, taps Shiny, then taps Mega (without closing the sheet between taps), and asserts the resulting persisted `RosterEntry` has **both** `isShiny: true` and `megaActive: true` — this is the regression test for Decision 4, and by construction also covers User Story 4 (gender) and User Story 7 (form change) once repeated with those controls.
