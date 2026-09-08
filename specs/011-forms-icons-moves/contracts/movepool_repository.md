# Contract: `MovepoolRepository`

**Covers**: FR-009 (User Story 5)

## Interface

```dart
abstract class MovepoolRepository {
  Future<List<Move>> fetchMovepool({
    required String varietyId,
    required Game game,
    required String languageCode,
  });
}
```

## Rules

1. `varietyId` is either a `PokedexEntry.pokemonId` (base/principal form) or a `SelectableForm.varietyId` (template/Mega/Gigamax form) — same identity space `pokemon/{name}` already accepts elsewhere in this codebase.
2. The returned list MUST include only moves whose PokeAPI `version_group_details[].version_group.name` contains an entry equal to `game.id` — never a sibling version-group of the same generation, never every version-group the move has ever appeared in (research.md Decision 5).
3. Each returned `Move.description` MUST be resolved for `languageCode`, falling back to `en` when unavailable, following the exact same `_resolveLocalizedName`/`_findName` pattern already used by `PokeApiPokedexRepository`/`PokeApiGameCatalogRepository`.
4. `Move.power` is `null` when PokeAPI's `move.power` field is `null` (status moves) — never coerced to `0`.
5. Throws `PokedexUnavailable` (the existing failure type — no new failure type introduced, per Principle I) when the underlying request(s) cannot be completed. Returns an empty list (not a failure) when [varietyId] legitimately learns no moves in [game]'s version-group.
6. No HTTP call happens until this method is actually invoked — never as a side effect of `fetchPokedexIndex`/`fetchPokedexDetails` (research.md Decision 6).

## Test Expectations

- Given a fixture `pokemon` body with two `moves[]` entries, one whose `version_group_details` includes the target game's version-group and one that doesn't, `fetchMovepool` returns only the first.
- Given a fixture `move` body with `power: null`, the resulting `Move.power` is `null`, not `0`.
- Given a `varietyId` with an empty `moves[]` list, `fetchMovepool` returns `[]` without throwing.
- A simulated network failure on either the `pokemon/{varietyId}` or a `move/{name}` request causes `PokedexUnavailable` to be thrown, matching `PokeApiPokedexRepository`'s existing `_getJson` failure behavior.
