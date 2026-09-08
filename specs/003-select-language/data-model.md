# Data Model: Selección de Idioma de la Aplicación

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

All types below live in the `domain/language_selection` layer (plus one
amendment to `domain/game_selection`) and MUST stay free of Flutter,
HTTP, and storage imports (Constitution Principle VI).

## SupportedLanguage

Represents one selectable language option (FR-001, FR-002). Corresponds
to the checklist's "Idioma" entity from spec.md.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `String` | The PokeAPI language identifier used for content requests (e.g. `"es"`, `"ja"`, `"zh-Hans"`). For Japanese this is always `"ja"` — see research.md item 3. |
| `displayName` | `String` | Human-readable name shown in the selector (native or common name, never the raw code — FR-002). |

**Validation rules**:
- `code` MUST be non-empty and unique within a catalog.
- `displayName` MUST be non-empty.

**Relationships**: A `LanguagePreference.languageCode` references exactly
one `SupportedLanguage.code` (validity is not enforced by the preference
itself — see `LanguagePreferenceStore` contract, mirroring how
`SelectedGameStore` treats stored ids in `001-select-game`).

## LanguagePreference

Represents the language currently in effect for the app (FR-003–FR-006,
FR-008). Corresponds to the spec's "Preferencia de Idioma del Usuario"
entity.

| Field | Type | Notes |
|-------|------|-------|
| `languageCode` | `String` | The active PokeAPI language code. |
| `source` | `LanguagePreferenceSource` (enum: `explicit`, `defaulted`) | Whether the user chose this explicitly (FR-008) or it was assigned by the FR-006 default rule. |
| `setAt` | `DateTime` | When this preference took effect. |

**Validation rules**: `languageCode` MUST be non-empty.

**State transitions**:
- No preference yet → `defaulted` preference: happens on first run, via
  `GetActiveLanguage` applying FR-006 (device locale if supported, else
  `en`).
- Any preference → `explicit` preference: happens whenever `SelectLanguage`
  runs (FR-008), and MUST notify `ActiveLanguageReader` subscribers so UI
  text and PokeAPI-sourced content on screen update together (FR-003).

## Failure types

| Type | When raised | Consumed by |
|------|-------------|-------------|
| `LanguageCatalogUnavailable` | The `SupportedLanguageCatalog` port cannot retrieve the official language list (network error, timeout, malformed response). | `GetSupportedLanguages` use case → surfaced to presentation as a retryable error, mirroring `GameCatalogUnavailable` from `001-select-game`. |

## UiTranslationBundle (conceptual — not a runtime domain type)

Corresponds to the spec's "Paquete de Traducción de Interfaz" entity.
Unlike the types above, this is not represented as a hand-written domain
class: it is materialized by Flutter's `gen-l10n` tool from the ARB files
in `lib/l10n/` into the generated `AppLocalizations` class (one subclass
per locale). It is documented here only to keep the spec's entity list
traceable to its implementation.

| Field (spec entity) | Where it actually lives |
|----------------------|--------------------------|
| Idioma al que corresponde | ARB filename suffix (`app_<code>.arb`) / generated `AppLocalizations` locale |
| Conjunto de textos traducidos | Keys in each ARB file, exposed as generated getters/methods |
| Cobertura respecto al idioma de respaldo | Enforced by the "every ARB file has the full key set" rule (research.md item 6) rather than a runtime field |

## Amendment: `Game` (from `domain/game_selection`, defined in `001-select-game`)

No new fields — `Game.displayName` (see `001-select-game/data-model.md`)
now MUST be resolved for the requested language (with English fallback)
rather than derived by title-casing the version-group slug. This is a
behavioral amendment to how `PokeApiGameCatalogRepository` populates the
existing field, not a schema change to the `Game` entity itself.

## Ports (see `contracts/` for full interface definitions)

| Port | Defined in | Implemented in | Purpose |
|------|------------|-----------------|---------|
| `SupportedLanguageCatalog` | `domain/language_selection/ports` | `infrastructure/language_selection` | Fetch the official PokeAPI language list (FR-001). |
| `LanguagePreferenceStore` | `domain/language_selection/ports` | `infrastructure/language_selection` | Persist/read the selected language code (FR-005). |
| `ActiveLanguageReader` | `domain/language_selection/ports` | `infrastructure/language_selection` | Cross-context contract: current language code + change notifications, consumed by other bounded contexts (e.g. `game_selection`). |
| `GameCatalogRepository` *(amended)* | `domain/game_selection/ports` | `infrastructure/game_selection` | Now takes `languageCode`; see `contracts/game_catalog_repository_amendment.md`. |
