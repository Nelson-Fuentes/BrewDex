# Implementation Plan: Selección de Idioma de la Aplicación

**Branch**: `003-select-language` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-select-language/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Users choose an app-wide language from exactly the set of official
languages PokeAPI exposes for its content (currently 9: Japanese,
English, French, German, Spanish, Italian, Korean, Chinese Simplified,
Chinese Traditional); the choice persists locally and drives both PokeAPI
sourced content (e.g. game names) and BrewDex's own UI text, falling back
to English wherever a translation is missing. Technical approach: a new
`language_selection` hexagonal/DDD bounded context (mirroring
`001-select-game`'s `game_selection`) that fetches the official language
catalog from PokeAPI's `/language` endpoint, persists the chosen code via
`shared_preferences`, and publishes the active language through one
explicit cross-context port so other bounded contexts (starting with
`game_selection`) can request PokeAPI content in that language. BrewDex's
own UI strings move onto Flutter's first-party `intl`/`gen-l10n`
localization tooling (`AppLocalizations`, ARB files), wired to the same
active language via `MaterialApp.locale`.

## Technical Context

**Language/Version**: Dart 3.x, bundled with the latest stable Flutter SDK (same as `001-select-game` / `002-material-design-ui`)

**Primary Dependencies**: `flutter_bloc` (Cubit-based application-layer
orchestration, consistent with `game_selection`); `http` (PokeAPI
`/language` endpoint, infrastructure adapter); `shared_preferences` (local
persistence adapter for the selected language code); `equatable` (value
equality for domain types); **new** — `flutter_localizations` (Flutter
SDK) + `intl`, enabling Flutter's built-in ARB/`gen-l10n` toolchain for
BrewDex's own UI text (needed only now that the user confirmed full-UI
translation is in scope — see spec Assumptions)

**Storage**: Local on-device/browser key-value storage only (via
`shared_preferences`), storing the selected PokeAPI language code as a
single string; no backend, no database. UI-string translations ship
bundled in the app binary as generated Dart (ARB → `AppLocalizations`),
not fetched at runtime.

**Testing**: `flutter_test` (widget tests, including localized-string
rendering), `bloc_test` (Cubit), `mocktail` (fakes for the two
`language_selection` ports so domain/application tests run without
Flutter or network), `integration_test` (end-to-end language-switch
flows)

**Target Platform**: Android and Web from the single existing Flutter
codebase (no iOS/desktop targets in this feature)

**Project Type**: Frontend-only mobile+web application — no backend
service is introduced by this feature

**Performance Goals**: UI text reflects a newly selected language
effectively instantly (<500ms) since translations are bundled at build
time and require no network call; PokeAPI-sourced content (e.g. game
names) re-fetched/re-rendered in the new language within ~2s on a typical
connection — both comfortably inside SC-001's 10s budget

**Constraints**: No backend/server component; every UI string and every
PokeAPI-sourced field MUST have an English fallback so nothing renders
empty or as a raw translation key (FR-007); the selectable language list
MUST exactly match PokeAPI's official languages, no more, no fewer
(FR-001, SC-002); adding this feature must not require an app update for
a language PokeAPI already supports (edge case in spec.md); single
codebase must behave correctly on both Android and Web

**Scale/Scope**: 9 official languages; UI translation must cover all
current app screens (navigation shell, game selection) per SC-005; scope
grows automatically as future bounded contexts (e.g. Pokédex, team
building) are added, since they will consume the same
`ActiveLanguageReader` contract

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|-----------|-------|--------|
| I. Simplicity & YAGNI | Reuses every dependency already in the project (`flutter_bloc`, `http`, `shared_preferences`, `equatable`). The one addition, `flutter_localizations`/`intl`, is Flutter's own first-party localization tooling (no third-party i18n package), justified by the user's explicit confirmation that full UI translation is in scope — not speculative. No persisted cache, no custom translation-file format invented. | PASS |
| II. Test-First Development | Domain/application layers depend only on two ports (`SupportedLanguageCatalog`, `LanguagePreferenceStore`) plus the cross-context `ActiveLanguageReader`, all fakeable via `mocktail`, so use cases are tested red-green-refactor without Flutter or network; `bloc_test` covers the Cubit; widget tests cover ARB-driven string rendering and fallback; `integration_test` covers the end-to-end switch flow. | PASS |
| III. Clear Contracts & Interfaces | Three ports documented in `contracts/`: `SupportedLanguageCatalog`, `LanguagePreferenceStore`, and `ActiveLanguageReader` (the explicit cross-context contract other bounded contexts use). The existing `GameCatalogRepository` port (from `001-select-game`) gains a required `languageCode` parameter — a breaking change to that contract, called out explicitly in `contracts/game_catalog_repository_amendment.md` and in Complexity Tracking below, per the versioning rule in Governance. | PASS (with a documented, justified breaking change) |
| IV. Code Quality & Review | Standard `flutter analyze`/lint gate and required review apply; no exception introduced. | PASS |
| V. Observability & Versioning | Language-catalog fetch failures are surfaced through a typed domain failure (`LanguageCatalogUnavailable`, mirroring `GameCatalogUnavailable`) that the presentation layer logs and turns into a retry affordance; app version follows `pubspec.yaml` semantic versioning, and the `GameCatalogRepository` signature change is treated as the kind of breaking contract change Principle V requires calling out (done here and in research.md). | PASS |
| VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE) | New bounded context `language_selection` with `domain/` (zero Flutter/HTTP/storage imports), `application/` (use cases depending only on domain + its ports), and `infrastructure/` + `presentation/` adapters. Communication with the pre-existing `game_selection` bounded context happens exclusively through the new `ActiveLanguageReader` port — an explicit, documented contract, per the constitution's bounded-context rule — rather than `game_selection` reaching into `language_selection`'s internals. | PASS |

No unjustified violations. One documented, justified breaking contract
change (`GameCatalogRepository`) is recorded in Complexity Tracking.

**Post-Design re-check** (after Phase 1): `data-model.md` and
`contracts/` confirm the domain (`SupportedLanguage`, `LanguagePreference`,
`LanguageCatalogUnavailable`) and the three ports
(`SupportedLanguageCatalog`, `LanguagePreferenceStore`,
`ActiveLanguageReader`) stay framework-free, with
`http`/`shared_preferences`/Flutter/`intl` confined to the infrastructure
and presentation adapters described in Project Structure. The
`GameCatalogRepository` amendment keeps the same shape of change (an
added parameter, no new framework leakage into `domain/game_selection`).
All rows above remain PASS; no new violations introduced by the design
artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/003-select-language/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── supported_language_catalog.md
│   ├── language_preference_store.md
│   ├── active_language_reader.md
│   └── game_catalog_repository_amendment.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   ├── language_selection/
│   │   ├── value_objects/
│   │   │   └── supported_language.dart        # code + display name (FR-001, FR-002)
│   │   ├── entities/
│   │   │   └── language_preference.dart        # active code, source, set-at (FR-005, FR-006)
│   │   ├── ports/
│   │   │   ├── supported_language_catalog.dart  # Port: fetch the official language list
│   │   │   ├── language_preference_store.dart   # Port: read/write the persisted selection
│   │   │   └── active_language_reader.dart       # Cross-context contract (current code + change stream)
│   │   └── failures/
│   │       └── language_catalog_failure.dart     # Typed domain failure (e.g. unavailable)
│   │
│   └── game_selection/
│       └── ports/
│           └── game_catalog_repository.dart      # AMENDED: fetchCatalog(languageCode) — see contracts/
│
├── application/
│   ├── language_selection/
│   │   └── use_cases/
│   │       ├── get_supported_languages.dart      # FR-001, FR-002
│   │       ├── get_active_language.dart          # Default resolution (FR-006)
│   │       └── select_language.dart              # FR-003–FR-005, FR-008, FR-009
│   │
│   └── game_selection/
│       └── use_cases/
│           └── get_game_catalog.dart              # AMENDED: passes active language through
│
├── infrastructure/
│   ├── language_selection/
│   │   ├── pokeapi_supported_language_catalog.dart # Implements SupportedLanguageCatalog via PokeAPI /language
│   │   ├── local_language_preference_store.dart     # Implements LanguagePreferenceStore via shared_preferences
│   │   └── in_memory_active_language_reader.dart     # Implements ActiveLanguageReader, updated by SelectLanguage
│   │
│   └── game_selection/
│       └── pokeapi_game_catalog_repository.dart   # AMENDED: uses languageCode for names/versions lookups
│
├── l10n/
│   ├── app_en.arb            # Template/fallback locale (source of truth for keys)
│   ├── app_es.arb
│   ├── app_fr.arb
│   ├── app_de.arb
│   ├── app_it.arb
│   ├── app_ko.arb
│   ├── app_ja.arb
│   ├── app_zh_Hans.arb
│   └── app_zh_Hant.arb
│
└── presentation/
    └── language_selection/
        ├── cubit/
        │   ├── language_selection_cubit.dart      # Calls use cases, exposes UI state
        │   └── language_selection_state.dart
        ├── pages/
        │   └── language_selector_page.dart         # Screen/sheet listing the 9 languages
        └── widgets/
            └── language_option_tile.dart

test/
├── domain/language_selection/
├── application/language_selection/                 # Use-case tests with faked ports
├── infrastructure/language_selection/               # Adapter tests (PokeAPI mapping, prefs mapping)
└── presentation/language_selection/                 # Widget + bloc_test coverage, incl. fallback rendering

integration_test/
└── language_selection_flow_test.dart                 # End-to-end: select, persist, fallback

l10n.yaml                                              # gen-l10n config (arb-dir: lib/l10n, template: app_en.arb)
```

**Structure Decision**: Same single Flutter package, one-bounded-context-
per-feature shape established by `001-select-game`. `language_selection`
is added as its own bounded context with the four hexagonal layers.
Because this feature's whole purpose is to be consumed by other
contexts, it also amends one existing port (`GameCatalogRepository`) and
its one existing implementation/consumer, rather than duplicating
language-awareness into `game_selection` itself — the amendment is
documented as a breaking, justified contract change (see Complexity
Tracking and `contracts/game_catalog_repository_amendment.md`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Breaking change to `GameCatalogRepository.fetchCatalog()` (adds a required `languageCode` parameter) | FR-003/SC-005 require PokeAPI-sourced content already on screen (game names) to reflect the active language; the port must know which language to request. | Keeping the old no-argument signature and threading the language code around it via a second, parallel lookup was rejected — it would let `game_selection` silently render stale/wrong-language names for content it already owns, and would duplicate the "which language is active" concern instead of routing it through one explicit contract (`ActiveLanguageReader`), violating Principle III. |
