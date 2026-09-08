# Contract Amendment: `GameCatalogRepository` (originally defined in `001-select-game`)

**Original contract**: [`../001-select-game/contracts/game_catalog_repository.md`](../../001-select-game/contracts/game_catalog_repository.md)

**Status**: Breaking change to an existing port, introduced by this
feature and justified in `plan.md`'s Complexity Tracking (Constitution
Principle III/V require breaking contract changes to be called out
explicitly).

## What changes

```diff
 abstract class GameCatalogRepository {
-  Future<List<Game>> fetchCatalog();
+  /// [languageCode] is a PokeAPI official language code obtained from
+  /// `ActiveLanguageReader.currentLanguageCode()` (see
+  /// `003-select-language/contracts/active_language_reader.md`).
+  Future<List<Game>> fetchCatalog({required String languageCode});
 }
```

`Game.displayName` and `Generation.label` (both defined in
`001-select-game/data-model.md`) are now resolved for `languageCode`,
falling back to English when no translation exists for that field
(FR-007) — see research.md item 8.

## Why this is safe to amend (not a new port)

- The entity shapes (`Game`, `Generation`, `GameDlc`) are unchanged — only
  the method used to *populate* two string fields changes, plus the one
  new required parameter.
- The port's existing four contract rules (no partial catalogs,
  freshness, pairing already resolved, stable identity) all still hold
  unmodified for the new signature.
- The only consumer in the codebase, `GetGameCatalog`
  (`application/game_selection/use_cases`), is amended in the same
  feature to supply `languageCode` from `ActiveLanguageReader`, so no
  caller is left on the old signature.

## Consumer update

```dart
// application/game_selection/use_cases/get_game_catalog.dart (amended)
class GetGameCatalog {
  GetGameCatalog(this._catalogRepository, this._activeLanguageReader);

  final GameCatalogRepository _catalogRepository;
  final ActiveLanguageReader _activeLanguageReader;

  Future<List<Game>> call() => _catalogRepository.fetchCatalog(
        languageCode: _activeLanguageReader.currentLanguageCode(),
      );
}
```

`GameSelectionCubit` (presentation layer) additionally subscribes to
`ActiveLanguageReader.onLanguageChanged()` and re-invokes `GetGameCatalog`
whenever it fires, so an already-visible catalog updates in place when
the user changes language (FR-003) instead of only on next screen entry.

## Test impact

- `test/application/game_selection/get_game_catalog_test.dart` (from
  `001-select-game`) is updated to inject a fake `ActiveLanguageReader`
  alongside the existing fake `GameCatalogRepository`.
- `test/infrastructure/game_selection/pokeapi_game_catalog_repository_test.dart`
  gains cases for: a non-English `languageCode` resolving translated
  `displayName`/`generation.label`; and the English-fallback path when a
  translation is missing (FR-007).
