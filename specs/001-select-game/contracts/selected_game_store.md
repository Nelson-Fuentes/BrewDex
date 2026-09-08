# Port Contract: `SelectedGameStore`

**Layer**: Defined in `domain/game_selection/ports`. Implemented in
`infrastructure/game_selection` (`LocalSelectedGameStore`), consumed only
by the `application/game_selection` use cases.

## Purpose

Persists and retrieves the identifier of the user's most recently
selected `Game` across sessions (FR-008), independent of where or how
that persistence actually happens.

## Interface

```dart
abstract class SelectedGameStore {
  /// Returns the previously persisted game id, or `null` if none has
  /// ever been saved (first run, or storage was cleared).
  Future<String?> readSelectedGameId();

  /// Persists [gameId] as the active selection, replacing any
  /// previously stored value.
  Future<void> writeSelectedGameId(String gameId);
}
```

## Contract rules

1. **Idempotent write**: calling `writeSelectedGameId` with the same id
   twice in a row MUST leave the stored value unchanged and MUST NOT
   error.
2. **No implicit validation against the catalog**: this port only stores
   and returns an id string — it MUST NOT call `GameCatalogRepository` or
   otherwise validate that the id still exists in the current catalog.
   That reconciliation is the `SelectGame`/`GetGameCatalog` use cases'
   responsibility (they treat a stored id that no longer matches any
   fetched `Game` the same as "no selection yet").
3. **Read is safe pre-write**: `readSelectedGameId` MUST return `null`
   rather than throwing when nothing has ever been written.
4. **Local scope only**: per the user's persistence decision, this port
   is backed by on-device/browser storage only — it MUST NOT perform
   network calls, and the stored value MUST NOT be expected to sync
   across devices (see spec Assumptions).

## Implementing adapter (this feature)

`LocalSelectedGameStore` implements this port using the `shared_preferences`
package under a single, namespaced key (e.g.
`game_selection.selected_game_id`), which resolves to `SharedPreferences`
on Android and `window.localStorage` on Web.

## Test doubles

Application-layer tests (e.g. for `SelectGame`, `SwitchGame`) use an
in-memory fake implementing this interface (via `mocktail`) instead of
`shared_preferences`, so they run without platform bindings.
