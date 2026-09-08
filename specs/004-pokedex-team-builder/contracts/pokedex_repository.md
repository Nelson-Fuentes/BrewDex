# Port Contract: `PokedexRepository`

**Layer**: Defined in `domain/team_builder/ports`. Implemented in
`infrastructure/team_builder` (`PokeApiPokedexRepository`), consumed
only by `application/team_builder` use cases (`GetPokedex`) and by the
`RosterValidityChecker` implementation this feature provides
(`contracts/roster_validity_checker_implementation.md`). No presentation
or infrastructure code may bypass this port to reach the network
directly (Constitution Principle VI).

## Purpose

Retrieves the list of `PokedexEntry` values that make up a `Game`'s
Pokédex under a given `PokedexView` (FR-003, FR-004, FR-016–FR-019),
without leaking PokeAPI's data shapes into the domain.

## Interface

```dart
abstract class PokedexRepository {
  /// Returns the Pokédex entries for [game] under [view], localized for
  /// [languageCode], sorted ascending by [PokedexEntry.pokedexNumber]
  /// (FR-006).
  ///
  /// Throws [PokedexUnavailable] if the data cannot be retrieved.
  /// Callers MUST NOT need to know why it failed beyond that — the
  /// retry affordance in FR-020 does not depend on the failure reason.
  Future<List<PokedexEntry>> fetchPokedex({
    required Game game,
    required PokedexView view,
    required String languageCode,
  });
}
```

## Contract rules

1. **No partial results**: the method either returns the complete list
   for the requested view or throws `PokedexUnavailable` — it MUST NOT
   silently return a truncated list (mirrors
   `GameCatalogRepository`'s "No partial catalogs" rule).
2. **Sorted output**: entries MUST already be sorted ascending by
   `pokedexNumber` when returned (FR-006) — callers/use cases MUST NOT
   need to re-sort.
3. **View determines numbering, not just filtering**: when
   `view.useNationalDex` is `true` (and `game`'s generation is
   National-Dex-eligible), every returned entry's `pokedexNumber` MUST
   be the *national* number, not the regional one (research.md item 7)
   — this is a different dataset, not the same entries relabeled.
4. **Ineligible National Dex requests are regional**: if
   `view.useNationalDex` is `true` but `game`'s generation is not
   eligible (outside 2nd–7th generation), the implementation MUST
   behave as if it were `false` (return the regional list) rather than
   error — the port does not surface an "invalid view" failure; the
   presentation layer is responsible for not offering the toggle in
   that case (FR-016).
5. **DLC entries are additive**: for each id in `view.activeDlcIds`,
   that DLC's own Pokédex entries MUST be merged into the result on top
   of the active base list (regional or national), each carrying
   `sourceTag: PokedexEntrySource.dlc(id)` (FR-018). An id in
   `activeDlcIds` that does not belong to `game.dlcs` is ignored
   (defensive; the application layer is expected not to send one).
6. **Determinism of identity**: `PokedexEntry.pokemonId` MUST be stable
   across calls for the same underlying Pokémon, since it is what
   `TeamRosterStore` persists and what `RosterValidityChecker` matches
   back against a freshly-fetched Pokédex.

## Implementing adapter (this feature)

`PokeApiPokedexRepository` implements this port using (research.md item
6):
- `GET /api/v2/version-group/{game.id}/` → resolve `pokedexes[]` (base)
  and, per active DLC id, `GET /api/v2/version-group/{dlcId}/` →
  its own `pokedexes[]`.
- `GET /api/v2/pokedex/national/` instead of the above when
  `view.useNationalDex` is eligible and `true`.
- `GET /api/v2/pokedex/{name}/` per resolved ref → `pokemon_entries[]`
  (species ref + `entry_number`).
- `GET /api/v2/pokemon-species/{id}/` → localized name, introduction
  generation.
- `GET /api/v2/pokemon/{id}/` → ordered `types[]`, `sprites`.

These HTTP/URL details are internal to the adapter and MUST NOT appear
in the domain or application layers.

## Test doubles

Domain and application tests (Principle II) use a fake implementing
this same interface (via `mocktail`) that returns fixed
`List<PokedexEntry>` values or throws `PokedexUnavailable`, so those
tests need neither Flutter nor network access.
