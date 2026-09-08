# Contract: Form/Mega/Gigamax selection revalidated on every `load()`

**Covers**: FR-004, FR-005, FR-006. User Story 2.

## Background

`PokeApiPokedexRepository` already computes `PokedexEntry.selectableForms`/`megaForm`/`gigamaxForm` scoped to the active `Game` on every `load()` (see `_classifyOtherVarieties`, `_regionalFormSuffixByGameId`, `kMegaEvolutionEnabledGameIds`, `kGigamaxEnabledGameIds`). Nothing today checks whether an *already-persisted* `RosterEntry.formVarietyId`/`megaActive`/`gigamaxActive` (chosen while a different game was active) is still valid once a different game becomes active.

## Behavior

Inside `TeamBuilderCubit.load()`, after `resolved`/`resolvedEntries` are computed (immediately after the existing species-obtainability reconciliation, before the `emit`), reconcile every entry of `reconciledRoster`:

```text
for each entry in reconciledRoster:
  pokedexEntry = resolvedEntries[entry.pokemonId]   // always present — entry survived obtainability reconciliation
  validFormIds = { f.varietyId for f in pokedexEntry.selectableForms }

  if entry.formVarietyId != null and entry.formVarietyId not in validFormIds:
    entry = entry.copyWith(formVarietyId: null, clearFormVarietyId: true)

  if entry.megaActive and pokedexEntry.megaForm == null:
    entry = entry.copyWith(megaActive: false)

  if entry.gigamaxActive and pokedexEntry.gigamaxForm == null:
    entry = entry.copyWith(gigamaxActive: false)
```

If any entry actually changed, the reconciled list is written back via `_teamRosterStore.writeRoster(...)` — the same "persist the correction, don't just mask it in the emitted state" posture the existing obtainability reconciliation already uses — before `emit`.

## Non-goals

- This does **not** re-validate `cosmeticVariantId`, `gender`, `teraType`, or `moveIds` — those already have their own invalidation rules elsewhere (or none is reported as broken) and are out of this feature's scope.
- This does **not** add a new port method — it only reads fields `PokedexEntry` already exposes.
- Applying a new form/Mega/Gigamax choice by the user (`_applyFormChange`, `_StateIconButton` handlers in `PokemonCustomizationCard`) is unchanged — this contract only covers what happens on `load()` (i.e., opening/reopening the armador for a given game), not the live selection flow.

## Test Expectations (`team_builder_cubit_form_reconciliation_test.dart`)

1. **Given** a persisted roster entry with `formVarietyId: 'rattata-alola'` for a species whose Rojo Fuego/Verde Hoja `PokedexEntry.selectableForms` does not include that id, **when** `TeamBuilderCubit(game: <Rojo Fuego>).load()` runs, **then** the emitted state's matching roster entry has `formVarietyId == null`, and the persisted roster (as read back from `_teamRosterStore`) reflects the same correction.
2. **Given** a persisted roster entry with `megaActive: true` for a species/game combination where `PokedexEntry.megaForm` is now `null`, **when** `load()` runs, **then** the emitted entry has `megaActive == false`.
3. **Given** a persisted roster entry whose `formVarietyId` **is** among the active game's `selectableForms`, **when** `load()` runs, **then** it is left unchanged (no spurious reset of a still-valid selection).
4. **Given** a roster entry with no `formVarietyId` (principal form) and no Mega/Gigamax active, **when** `load()` runs, **then** it is left unchanged (no-op path stays cheap/no-op).
