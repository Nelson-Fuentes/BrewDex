# Port Contract: `GameCatalogRepository`

**Layer**: Defined in `domain/game_selection/ports`. Implemented in
`infrastructure/game_selection` (`PokeApiGameCatalogRepository`), consumed
only by the `application/game_selection` use cases. No presentation or
infrastructure code may bypass this port to reach the network directly
(Constitution Principle VI).

## Purpose

Retrieves the full catalog of selectable `Game`s (FR-001) from whatever
external source backs it, without leaking that source's data shapes into
the domain.

## Interface

```dart
abstract class GameCatalogRepository {
  /// Returns the full, current catalog of selectable games.
  ///
  /// Throws [GameCatalogUnavailable] if the catalog cannot be retrieved
  /// (network failure, timeout, or an unparseable response). Callers
  /// (use cases) MUST NOT need to know why it failed beyond that —
  /// the retry affordance in FR-012 does not depend on the failure
  /// reason.
  Future<List<Game>> fetchCatalog();
}
```

## Contract rules

1. **No partial catalogs**: the method either returns the complete
   catalog or throws `GameCatalogUnavailable` — it MUST NOT return a
   partial/truncated list silently, since FR-001 requires the *full*
   catalog and SC-002 requires 100% of games to be reachable.
2. **Freshness**: each call reflects the source's current state at call
   time (see research.md item 6 — no persisted caching inside this port;
   an implementation MAY keep a short-lived in-memory cache for the
   current app session only).
3. **Pairing already resolved**: each `Game` returned already represents
   one paired release (FR-002) — this port MUST NOT return individual
   unpaired versions as separate entries. Resolving PokeAPI's
   `version-group`/`version`/`generation` shape into this form is the
   implementing adapter's responsibility, not the caller's.
4. **Determinism of identity**: `Game.id` MUST be stable across calls for
   the same underlying game, since `SelectedGameStore` persists it
   (FR-008) and later calls must be able to match it back to a `Game` in
   a freshly-fetched catalog.

## Implementing adapter (this feature)

`PokeApiGameCatalogRepository` implements this port using:
- `GET https://pokeapi.co/api/v2/version-group?limit=<n>` — enumerate
  version-groups.
- `GET https://pokeapi.co/api/v2/version-group/{id}/` — resolve each
  group's paired version names and linked generation.
- `GET https://pokeapi.co/api/v2/generation/{id}/` — resolve a
  human-readable generation label for `Generation.label`.

These HTTP/URL details are internal to the adapter and MUST NOT appear
in the domain or application layers.

## Test doubles

Domain and application tests (Principle II) use a fake implementing this
same interface (via `mocktail`) that returns fixed `List<Game>` values or
throws `GameCatalogUnavailable`, so those tests need neither Flutter nor
network access.
