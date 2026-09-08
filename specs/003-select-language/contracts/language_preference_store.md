# Port Contract: `LanguagePreferenceStore`

**Layer**: Defined in `domain/language_selection/ports`. Implemented in
`infrastructure/language_selection` (`LocalLanguagePreferenceStore`),
consumed only by the `application/language_selection` use cases.

## Purpose

Persists and retrieves the user's selected PokeAPI language code across
sessions (FR-005), independent of where or how that persistence actually
happens. Mirrors `SelectedGameStore` from `001-select-game`.

## Interface

```dart
abstract class LanguagePreferenceStore {
  /// Returns the previously persisted language code, or `null` if none
  /// has ever been saved (first run, or storage was cleared).
  Future<String?> readLanguageCode();

  /// Persists [languageCode] as the active selection, replacing any
  /// previously stored value.
  Future<void> writeLanguageCode(String languageCode);
}
```

## Contract rules

1. **Idempotent write**: calling `writeLanguageCode` with the same code
   twice in a row MUST leave the stored value unchanged and MUST NOT
   error.
2. **No implicit validation against the catalog**: this port only stores
   and returns a code string — it MUST NOT call `SupportedLanguageCatalog`
   or otherwise validate that the code is still official. That
   reconciliation is `GetActiveLanguage`'s responsibility (a stored code
   no longer present in a freshly-fetched catalog is treated as "no
   valid selection," falling back to FR-006's default rule).
3. **Read is safe pre-write**: `readLanguageCode` MUST return `null`
   rather than throwing when nothing has ever been written.
4. **Local scope only**: backed by on-device/browser storage only, per
   the same local-persistence stance as `SelectedGameStore` — MUST NOT
   perform network calls or sync across devices.

## Implementing adapter (this feature)

`LocalLanguagePreferenceStore` implements this port using the
`shared_preferences` package under a single, namespaced key (e.g.
`language_selection.language_code`).

## Test doubles

Application-layer tests (e.g. for `SelectLanguage`, `GetActiveLanguage`)
use an in-memory fake implementing this interface (via `mocktail`)
instead of `shared_preferences`, so they run without platform bindings.
