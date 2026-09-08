# Research: Selección de Idioma de la Aplicación

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

All items below were open questions in the Technical Context. One (scope:
PokeAPI content vs. full UI translation) was resolved directly with the
user during `/speckit-specify`; the rest are standard technical decisions
resolved here so no `NEEDS CLARIFICATION` markers remain before Phase 1.

## 1. Localizing BrewDex's own UI text

- **Decision**: Flutter's first-party localization toolchain —
  `flutter_localizations` + `intl`, ARB files under `lib/l10n/`, generated
  via `flutter gen-l10n` (configured by `l10n.yaml`) into a type-safe
  `AppLocalizations` class, wired through `MaterialApp.localizationsDelegates`
  and `MaterialApp.locale`.
- **Rationale**: This is the SDK-provided, zero-extra-dependency way to
  localize a Flutter app's own strings; it integrates natively with
  `MaterialApp`/`Localizations` (which the app already uses via
  `MaterialApp` in `main.dart`), gives compile-time-checked accessors
  (typo in a string key is a build error, not a runtime blank), and
  handles pluralization/formatting for free via `intl`. Per Principle I,
  reaching for SDK tooling beats adding a third-party i18n package for a
  need the SDK already solves.
- **Alternatives considered**: `easy_localization` (JSON-based, popular
  for hot-reloadable translations) — rejected, adds a dependency and a
  second translation-file format for something `intl`/ARB already
  provides, with no compile-time key checking. Hand-rolled
  `Map<String, Map<String, String>>` lookup — rejected, reinvents
  pluralization/date/number formatting and locale fallback that `intl`
  already solves correctly.

## 2. Sourcing the selectable language list (FR-001, FR-002)

- **Decision**: Fetch dynamically from PokeAPI's `GET /api/v2/language?limit=100`,
  keep only entries where `official == true`, and collapse the two
  Japanese entries (`ja`, `ja-Hrkt`) into a single "Japanese" selector
  option backed by the `ja` code (see item 3). Cache the fetched list
  in memory for the current app session only (same stance as
  `001-select-game`'s game catalog) — not persisted to disk.
- **Rationale**: The spec's edge case is explicit: if PokeAPI's language
  catalog changes, the selector must reflect it "sin requerir una nueva
  versión de la aplicación." A hardcoded constant list cannot satisfy
  that. The catalog is tiny (~12 entries) and changes rarely, so an
  in-memory-only, fetch-on-load cache (no persisted cache/invalidation
  policy) is the simplest design that satisfies the requirement
  (Principle I), mirroring the decision already made for the game
  catalog in `001-select-game` research.md item 6.
- **Alternatives considered**: A hardcoded list of the 9 languages named
  in the spec's Assumptions — rejected, contradicts the edge case above
  and SC-002's "exactly matches PokeAPI's official catalog" requirement.
  A persisted, disk-cached catalog with invalidation — rejected as
  unjustified complexity for data this small and stable (Principle I).

## 3. Collapsing `ja` / `ja-Hrkt` into one "Japanese" option

- **Decision**: Present exactly one "Japanese" entry in the selector,
  backed by PokeAPI's `ja` (kanji) language code for both content
  requests and the app's `ja` UI locale.
- **Rationale**: PokeAPI's `ja-Hrkt` is a furigana/hiragana variant of the
  same underlying Japanese names, not a distinct language a user would
  consciously choose between — showing both would be confusing and
  contradicts the spec's own FR-001 enumeration, which lists exactly 9
  human languages (one "japonés"). `ja` is the complete, canonical
  Japanese translation set in PokeAPI.
- **Alternatives considered**: Exposing both as separate selectable
  entries — rejected as confusing and inconsistent with the 9-language
  list already fixed in the spec.

## 4. Persisting the selected language (FR-005)

- **Decision**: `shared_preferences`, storing only the selected PokeAPI
  language code (a string) under a single namespaced key
  (`language_selection.language_code`), mirroring
  `LocalSelectedGameStore` from `001-select-game`.
- **Rationale**: Same shape of problem as persisting the selected game —
  a single small string. Reusing the established pattern keeps the
  codebase consistent and needs no new dependency (Principle I).
- **Alternatives considered**: A local database (`Hive`/`Isar`) —
  rejected as disproportionate for one string, same reasoning as
  `001-select-game`.

## 5. Resolving the default language on first use (FR-006)

- **Decision**: On first run (no persisted preference), read the
  device/browser's platform locale (`PlatformDispatcher.instance.locale`),
  map its language subtag to a PokeAPI code if that code is present in
  the fetched official-language catalog, otherwise default to English
  (`en`).
- **Rationale**: `PlatformDispatcher.instance.locale` is provided by the
  Flutter SDK with no extra dependency and works on both Android and
  Web. This directly implements FR-006's stated default rule.
- **Alternatives considered**: Always defaulting to English regardless of
  device locale — simpler, but explicitly contradicts FR-006.

## 6. Falling back to English when a translation is missing (FR-007)

- **Decision**:
  - *UI strings*: every ARB locale file MUST contain the full key set
    defined in the template (`app_en.arb`); a key not yet translated for
    a given language ships with the English string as its literal value
    at authoring time, rather than being omitted. This sidesteps
    `gen-l10n`'s per-locale lookup entirely — there is never a missing
    key at runtime, only an English-valued one until translated. CI can
    surface un-translated-but-English-valued keys via `gen-l10n`'s
    untranslated-messages report as a non-blocking signal for
    translators.
  - *PokeAPI content*: infrastructure adapters that resolve a
    localized-name array (e.g. `names: [{language, name}, ...]`) look up
    the active language's entry first and fall back to the `en` entry if
    absent, generalizing the pattern `PokeApiGameCatalogRepository`
    already uses in `_fetchGeneration` (currently hardcoded to `en`).
- **Rationale**: Guarantees FR-007/SC-004 (no empty fields, no raw
  translation keys) without relying on framework-specific runtime
  fallback quirks, and reuses a pattern already proven in the codebase.
- **Alternatives considered**: Letting `gen-l10n` silently fall back to
  the template locale for missing keys — this is real gen-l10n behavior
  for the *default* locale only in some configurations, but is fragile
  and version-dependent; requiring complete ARB files removes the
  ambiguity entirely.

## 7. Cross-bounded-context contract for the active language

- **Decision**: `language_selection`'s domain publishes one additional
  port beyond its own two internal ones: `ActiveLanguageReader`
  (`currentLanguageCode()` + `onLanguageChanged()` stream). Other bounded
  contexts' application layers (starting with `game_selection`'s
  `GetGameCatalog` use case) depend on this port — not on any other
  internal type of `language_selection` — to know which PokeAPI language
  code to request content in, and to react when the user changes it.
- **Rationale**: Constitution Principle VI requires cross-context
  communication to go through an explicit, documented contract instead of
  one context reaching into another's internals. A single narrow
  read/observe port is the smallest contract that lets `game_selection`
  (and future contexts) stay reactive to language changes without
  depending on `language_selection`'s Cubit, storage, or catalog types.
- **Alternatives considered**: Threading the language code as a parameter
  passed down from the UI/composition root on every relevant call —
  rejected, turns every future PokeAPI-content feature into ad hoc
  plumbing instead of one reusable contract (Principle I: the port is the
  simplest shared solution, not the parameter-threading).

## 8. Amending `GameCatalogRepository` to be language-aware

- **Decision**: `fetchCatalog()` becomes `fetchCatalog({required String
  languageCode})`. `PokeApiGameCatalogRepository` resolves each game's
  `displayName` from the underlying `version` resources' own localized
  `names` array (looked up by `languageCode`, falling back to `en`)
  instead of title-casing the version-group slug, and resolves
  `Generation.label` the same way `_fetchGeneration` already does today,
  generalized to any language with an `en` fallback.
- **Rationale**: This is the one existing screen with PokeAPI-sourced
  content already in the app (game selection), so it is the concrete
  proof that FR-003/SC-005 work end-to-end. Reusing PokeAPI's own
  per-version `names` array is more accurate than the current
  slug-title-casing (which happens to look right only because it was
  never tested against a non-English name) and needs no new endpoint —
  the `version` resource is already fetched.
- **Alternatives considered**: Leaving `GameCatalogRepository` as-is and
  adding a second, parallel "translated name" lookup call from the
  presentation layer — rejected, splits one entity's display name across
  two data-fetch paths for no benefit, and bypasses the port abstraction
  the constitution requires domain/application code to go through.

## 9. Testing tools

- **Decision**: `flutter_test`, `bloc_test`, `mocktail`, `integration_test`
  — the same stack already adopted in `001-select-game`, extended with
  widget-test coverage asserting `AppLocalizations` returns the expected
  string per selected locale (including the English-fallback case from
  item 6).
- **Rationale**: Consistent with the existing testing stack (Principle I);
  sufficient to cover Principle II (Test-First) at every layer for this
  feature's ports, use cases, Cubit, and UI.
- **Alternatives considered**: None — this simply extends the
  already-adopted stack; no new testing tool is justified.

## Outcome

All Technical Context fields are resolved; no `NEEDS CLARIFICATION`
markers remain. Proceeding to Phase 1 design.
