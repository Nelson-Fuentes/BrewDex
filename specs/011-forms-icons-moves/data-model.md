# Data Model: Formas por Juego, Reparación de Megaevolución, Slots más Grandes, Íconos y Movimientos

## Entities/Value Objects — New

### `Move` (new domain value object, `lib/domain/team_builder/value_objects/move.dart`)

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | PokeAPI move name — stable identity, equality key. |
| `displayName` | `String` | Localized name, English fallback (same pattern as `PokemonType.label`). |
| `type` | `PokemonType` | The move's own type — independent of the Pokémon's type(s). |
| `pp` | `int` | Base PP. |
| `power` | `int?` | `null` when the move has no applicable power (status moves) — FR-014. |
| `description` | `String` | Localized flavor/effect text, English fallback. |

Pure domain value object: no Flutter/HTTP imports. Equality by `id` only, mirroring `SelectableForm`.

### `RosterEntry.moveIds` (amended existing value object, `lib/domain/team_builder/value_objects/roster_entry.dart`)

New field: `final List<String?> moveIds` — fixed length 4, defaults to `[null, null, null, null]`. Each non-null entry is a `Move.id`. Persisted in `toJson`/`fromJson` only when at least one slot is non-null (same "only non-default fields are written" convention already documented on this type), as a JSON array with `null` entries preserved positionally.

Validation invariant (enforced by the application/presentation layer, not the type itself — consistent with this type being "a plain data holder", per its own existing doc comment on `megaActive`/`gigamaxActive`): no two non-null entries in `moveIds` are equal, and every non-null entry belongs to the movepool most recently resolved for this entry's current form + the active game.

## Entities/Value Objects — Amended

### `PokedexEntry` / `SelectableForm` — no field changes

No new fields needed on either — a Pokémon's movepool is resolved separately and on demand (Decision 6/research.md), keyed by the variety id (`SelectableForm.varietyId` or `PokedexEntry.pokemonId` for the principal variety) plus the active `Game`, not attached to the already-eagerly-loaded Pokédex entry.

### `PokedexEntry.selectableForms` / `.megaForm` / `.gigamaxForm` — filtering moves inward

No field changes on `PokedexEntry` itself. The filtering from Decision 1 (research.md) happens in `PokeApiPokedexRepository._classifyOtherVarieties`: a variety classified as `mega`/`gigamax` is only kept as `megaForm`/`gigamaxForm` when `game.id` is present in the relevant allow-list; otherwise it is dropped entirely for that game's resolution of the entry (never surfaced as a `template` form either — an unavailable Mega/Gigamax variety is simply absent, not reclassified).

## New Domain Constants

### `kMegaEvolutionEnabledGameIds` / `kGigamaxEnabledGameIds` (new, `lib/domain/team_builder/value_objects/form_availability.dart`)

Two `const Set<String>` of `Game.id` values (research.md Decision 1) — hand-maintained allow-lists, same shape as `_regionalFormSuffixByGameId`/`_dlcParentVersionGroup` but expressed as domain-level constants (pure Dart, no HTTP) since both `PokeApiPokedexRepository` (to filter `megaForm`/`gigamaxForm`) and any future consumer needing this rule can import them without depending on the infrastructure layer.

```dart
const kMegaEvolutionEnabledGameIds = {
  'x-y',
  'omega-ruby-alpha-sapphire',
  'sun-moon',
  'ultra-sun-ultra-moon',
  'legends-za',
};

const kGigamaxEnabledGameIds = {
  'sword-shield',
};
```

(Exact PokeAPI version-group ids to be verified live against `GET /api/v2/version-group?limit=100` during implementation — the ids above are the expected spellings based on the existing catalog's established naming, e.g. `sword-shield`, `scarlet-violet` already seen in `_regionalFormSuffixByGameId`.)

## New Port

### `MovepoolRepository` (new, `lib/domain/team_builder/ports/movepool_repository.dart`)

```dart
abstract class MovepoolRepository {
  /// Resolves the moves [varietyId] (a `PokedexEntry.pokemonId` or a
  /// `SelectableForm.varietyId`) can actually learn in [game] — already
  /// filtered to that exact version-group, never a sibling game of the
  /// same generation (research.md Decision 5). Throws
  /// [PokedexUnavailable] if the data cannot be retrieved.
  Future<List<Move>> fetchMovepool({
    required String varietyId,
    required Game game,
    required String languageCode,
  });
}
```

Implemented by `PokeApiMovepoolRepository` (new, `lib/infrastructure/team_builder/pokeapi_movepool_repository.dart`) against `pokemon/{varietyId}` (`moves[].version_group_details[]`) and `move/{name}` (name/type/pp/power/flavor text), following the same caching-by-id and `_getJson`/localized-name-fallback conventions already established in `PokeApiPokedexRepository`.

## State/Cubit Amendments (presentation wiring — no new bounded context)

`TeamBuilderState` gains fields to hold the currently-open card's resolved movepool and its loading status (mirroring how the rest of `TeamBuilderState` already holds the resolved Pokédex data) — exact field shape is an implementation detail of `/speckit-tasks`, not fixed here beyond: it MUST be scoped to "the active slot's current form in the active game", re-resolved whenever either changes, per Decision 6/Decision 8.

`TeamBuilderCubit` gains: a method to fetch/refresh the active slot's movepool, a method to select a move into a given slot index (replacing any other slot that already held that same move — FR-013), and a method to clear a slot. All three call straight through to `MovepoolRepository`/mutate `RosterEntry.moveIds` the same way `updateRosterEntry` already mutates other `RosterEntry` fields.

## State Transitions

1. **Opening the customization card** → movepool fetch is NOT triggered automatically merely by opening the card (the existing sections — forms/gender/stats — render immediately from already-loaded `PokedexEntry` data); it triggers only when the Movimientos section is actually shown/expanded, or immediately if the section always renders (implementation detail for `/speckit-tasks`/`/speckit-plan`'s UI contract below).
2. **Selecting a move for an empty slot** → `moveIds[slotIndex] = move.id`; if `move.id` already occupied another slot, that other slot becomes `null` first (FR-013).
3. **Changing the active form (existing `_applyFormChange`) or the active game** → re-fetch movepool for the new form/game; any `moveIds` entry no longer present in the new movepool is set to `null` (Decision 8, mirrors the existing `clearCosmeticVariantId: true` behavior on form change).
4. **Activating/deactivating Mega or Gigamax (User Story 2 fix)** → same as any other form-changing action for movepool purposes: re-fetch against the mega/gigamax variety's own `varietyId` when active, or the base variety's id when reverted.
