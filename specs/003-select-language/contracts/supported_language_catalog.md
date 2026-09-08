# Port Contract: `SupportedLanguageCatalog`

**Layer**: Defined in `domain/language_selection/ports`. Implemented in
`infrastructure/language_selection` (`PokeApiSupportedLanguageCatalog`),
consumed only by the `application/language_selection` use cases.

## Purpose

Retrieves the full list of selectable `SupportedLanguage`s (FR-001) —
PokeAPI's official languages, with the two Japanese variants collapsed
into one entry (research.md items 2–3) — without leaking PokeAPI's JSON
shape into the domain.

## Interface

```dart
abstract class SupportedLanguageCatalog {
  /// Returns the current official language catalog, in a stable,
  /// presentable order.
  ///
  /// Throws [LanguageCatalogUnavailable] if the catalog cannot be
  /// retrieved (network failure, timeout, or an unparseable response).
  Future<List<SupportedLanguage>> fetchSupportedLanguages();
}
```

## Contract rules

1. **Official only**: the returned list MUST include only languages
   PokeAPI marks `official: true` (FR-001) — unofficial entries (e.g.
   `roomaji`, `cs`) MUST NOT appear.
2. **One Japanese entry**: `ja` and `ja-Hrkt` MUST be collapsed into a
   single `SupportedLanguage(code: "ja", ...)` entry (research.md item 3)
   — the port MUST NOT return both.
3. **No partial catalogs**: either the complete official list is
   returned, or `LanguageCatalogUnavailable` is thrown — never a
   truncated list (mirrors `GameCatalogRepository`'s rule 1 in
   `001-select-game`).
4. **Freshness**: reflects PokeAPI's current `/language` catalog at call
   time; an implementation MAY keep a short-lived in-memory cache for the
   current app session only (research.md item 2), never persisted to
   disk.
5. **Determinism of identity**: `SupportedLanguage.code` MUST be stable
   across calls, since `LanguagePreferenceStore` persists it and
   `ActiveLanguageReader` consumers match against it.

## Implementing adapter (this feature)

`PokeApiSupportedLanguageCatalog` implements this port using:
- `GET https://pokeapi.co/api/v2/language?limit=100` — enumerate
  languages and filter to `official == true`.
- Per-language `names` (already included in the `/language` list
  response's detail, or resolved via the entry's own resource URL if the
  list response is reference-only) to derive `displayName` — preferring
  the language's own self-name when available, else its English name.

These HTTP/URL/JSON details are internal to the adapter and MUST NOT
appear in the domain or application layers.

## Test doubles

Domain and application tests (Principle II) use a fake implementing this
interface (via `mocktail`) that returns a fixed `List<SupportedLanguage>`
or throws `LanguageCatalogUnavailable`, so those tests need neither
Flutter nor network access.
