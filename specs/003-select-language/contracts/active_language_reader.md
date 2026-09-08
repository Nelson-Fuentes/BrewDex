# Port Contract: `ActiveLanguageReader`

**Layer**: Defined in `domain/language_selection/ports`. Implemented in
`infrastructure/language_selection` (`InMemoryActiveLanguageReader`).
This is the **cross-bounded-context contract**: it is the *only* type
from `language_selection` that another bounded context's
`application`/`presentation` code is allowed to depend on (Constitution
Principle VI — bounded contexts MUST NOT leak internal models into one
another; cross-context communication MUST go through an explicit,
documented contract). `game_selection`'s `GetGameCatalog` use case is the
first consumer.

## Purpose

Lets any bounded context (a) read which PokeAPI language is currently
active, so it can request content in that language (FR-003), and (b)
react when the user changes it, so already-visible content updates
without requiring a manual refresh.

## Interface

```dart
abstract class ActiveLanguageReader {
  /// The PokeAPI language code currently in effect. Always a valid,
  /// non-empty code — resolved (default or explicit) before any consumer
  /// can observe a value, per `GetActiveLanguage` (FR-006).
  String currentLanguageCode();

  /// Emits a new language code every time it changes (i.e. after
  /// `SelectLanguage` completes — FR-003, FR-008). Does not emit the
  /// current value on subscription; callers needing the current value
  /// immediately MUST call [currentLanguageCode] first.
  Stream<String> onLanguageChanged();
}
```

## Contract rules

1. **Always resolved**: `currentLanguageCode()` MUST NOT return an empty
   string or require the caller to handle "no language yet" — by the
   time any other bounded context can reach this port, FR-006's default
   resolution has already run.
2. **One writer**: only `language_selection`'s own `SelectLanguage` use
   case (via its infrastructure adapter) may cause `onLanguageChanged` to
   emit. Other bounded contexts MUST treat this port as read-only.
3. **No PokeAPI/catalog leakage**: this port exposes only a `String`
   code — never a `SupportedLanguage`, catalog list, or preference
   entity — keeping the contract minimal and stable for consumers.

## Implementing adapter (this feature)

`InMemoryActiveLanguageReader` holds the current code in memory
(seeded via `GetActiveLanguage` at app startup) and is updated by
`SelectLanguage`; it backs both `language_selection`'s own Cubit and any
other bounded context's use cases that inject this port.

## Consumers (this feature)

`application/game_selection/use_cases/get_game_catalog.dart` is amended
to read `ActiveLanguageReader.currentLanguageCode()` before calling
`GameCatalogRepository.fetchCatalog(languageCode: ...)` — see
`game_catalog_repository_amendment.md`.

## Test doubles

Consumers' tests use a fake implementing this interface (via `mocktail`)
that returns a fixed code and/or a controllable `Stream<String>`, so
`game_selection` (and future contexts') tests do not need a real
`language_selection` instance.
