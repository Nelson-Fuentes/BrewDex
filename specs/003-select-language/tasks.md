---

description: "Task list template for feature implementation"
---

# Tasks: Selección de Idioma de la Aplicación

**Input**: Design documents from `/specs/003-select-language/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The project constitution's Principle II (Test-First Development, "MUST" for business logic and public interfaces) and `plan.md`'s Constitution Check both commit this feature to red-green-refactor for domain/application logic, so test tasks are mandatory here, not optional.

**Organization**: Tasks are grouped by user story (from `spec.md`) to enable independent implementation and testing of each story, layered per the hexagonal/Clean/DDD structure from `plan.md` (`domain` → `application` → `infrastructure`/`presentation`), across the new `language_selection` bounded context plus the documented amendment to `game_selection`'s `GameCatalogRepository`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths below are relative to the repository root and follow the layout in `plan.md`'s Project Structure section.

## Path Conventions

Single Flutter project (frontend-only, mobile + web from one codebase, no backend — see `plan.md`):
- `lib/domain/language_selection/`, `lib/application/language_selection/`, `lib/infrastructure/language_selection/`, `lib/presentation/language_selection/`
- `lib/domain/game_selection/`, `lib/infrastructure/game_selection/`, `lib/presentation/game_selection/` (amended, from `001-select-game`)
- `lib/l10n/` (ARB files), `l10n.yaml` (repo root)
- `test/{domain,application,infrastructure,presentation}/language_selection/`, plus amended files under `test/{application,infrastructure}/game_selection/`
- `integration_test/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create the `language_selection` bounded-context folders — `lib/domain/language_selection/{value_objects,entities,ports,failures}/`, `lib/application/language_selection/use_cases/`, `lib/infrastructure/language_selection/`, `lib/presentation/language_selection/{cubit,pages,widgets}/`, `test/{domain,application,infrastructure,presentation}/language_selection/` — and `lib/l10n/`, per the layout in `plan.md`
- [X] T002 Add `flutter_localizations` (`sdk: flutter`) and `intl` to `pubspec.yaml` dependencies, enable `generate: true` under the `flutter:` section, then run `flutter pub get`
- [X] T003 [P] Create `l10n.yaml` at the repo root configuring `arb-dir: lib/l10n`, `template-arb-file: app_en.arb`, `output-localization-file: app_localizations.dart`, `output-class: AppLocalizations` (research.md item 1)

**Checkpoint**: `flutter pub get` succeeds and `l10n.yaml` is in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain types, ports, adapters, and the complete UI-translation bundle that every user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Domain

- [X] T004 [P] Create `SupportedLanguage` value object (`code`, `displayName`, non-empty/unique validation per `data-model.md`) in `lib/domain/language_selection/value_objects/supported_language.dart`, using `equatable`
- [X] T005 [P] Create the `LanguagePreferenceSource` enum (`explicit`, `defaulted`) and `LanguagePreference` entity (`languageCode`, `source`, `setAt`) in `lib/domain/language_selection/entities/language_preference.dart`
- [X] T006 [P] Create the `LanguageCatalogUnavailable` failure type in `lib/domain/language_selection/failures/language_catalog_failure.dart`
- [X] T007 [P] Define the `SupportedLanguageCatalog` port (`Future<List<SupportedLanguage>> fetchSupportedLanguages()`, throwing `LanguageCatalogUnavailable`) in `lib/domain/language_selection/ports/supported_language_catalog.dart` per `contracts/supported_language_catalog.md`
- [X] T008 [P] Define the `LanguagePreferenceStore` port (`readLanguageCode`, `writeLanguageCode`) in `lib/domain/language_selection/ports/language_preference_store.dart` per `contracts/language_preference_store.md`
- [X] T009 [P] Define the `ActiveLanguageReader` port (`currentLanguageCode()`, `onLanguageChanged()`) in `lib/domain/language_selection/ports/active_language_reader.dart` per `contracts/active_language_reader.md`
- [X] T010 [P] Amend the `GameCatalogRepository` port to `Future<List<Game>> fetchCatalog({required String languageCode})` in `lib/domain/game_selection/ports/game_catalog_repository.dart` per `contracts/game_catalog_repository_amendment.md`

### Infrastructure adapters

- [X] T011 [P] Unit test `PokeApiSupportedLanguageCatalog`'s mapping from PokeAPI `/language` JSON to `List<SupportedLanguage>` — official-only filter, `ja`/`ja-Hrkt` collapsed into one `ja` entry, `displayName` falling back to the English name when no self-name is available — in `test/infrastructure/language_selection/pokeapi_supported_language_catalog_test.dart`, using a fake `http.Client`
- [X] T012 Implement `PokeApiSupportedLanguageCatalog` (implements `SupportedLanguageCatalog` via `GET /language?limit=100`, research.md items 2–3) in `lib/infrastructure/language_selection/pokeapi_supported_language_catalog.dart` — depends on T004, T006, T007, T011
- [X] T013 [P] Unit test `LocalLanguagePreferenceStore` (read returns `null` pre-write, write is idempotent) in `test/infrastructure/language_selection/local_language_preference_store_test.dart`, using `shared_preferences`'s in-memory test mock
- [X] T014 Implement `LocalLanguagePreferenceStore` (implements `LanguagePreferenceStore` via `shared_preferences` under a namespaced key) in `lib/infrastructure/language_selection/local_language_preference_store.dart` — depends on T008, T013
- [X] T015 [P] Unit test `InMemoryActiveLanguageReader` (`currentLanguageCode` reflects the last value set, `onLanguageChanged` emits only on change, not on subscribe) in `test/infrastructure/language_selection/in_memory_active_language_reader_test.dart`
- [X] T016 Implement `InMemoryActiveLanguageReader` in `lib/infrastructure/language_selection/in_memory_active_language_reader.dart` — depends on T009, T015
- [X] T017 [P] Extend `PokeApiGameCatalogRepository`'s unit tests for the amended `fetchCatalog({required languageCode})` — `Game.displayName` resolved from each `version`'s localized `names` entry for `languageCode`, `Generation.label` resolved the same way, both falling back to the `en` entry when the requested language's entry is absent (research.md item 8) — in `test/infrastructure/game_selection/pokeapi_game_catalog_repository_test.dart`
- [X] T018 Amend `PokeApiGameCatalogRepository` to accept `languageCode`, drop the slug-title-casing derivation, and resolve `displayName`/`Generation.label` via each resource's `names` array with English fallback, in `lib/infrastructure/game_selection/pokeapi_game_catalog_repository.dart` — depends on T010, T017

### UI translation bundle (blocks every screen in every language)

- [X] T019 [P] Author `lib/l10n/app_en.arb` (template/fallback locale) with every UI string key the app currently needs, each with an `@key` ICU description: `appBarTitle`, `genericErrorMessage`, `changeGameDialogTitle`, `changeGameDialogContent` (`{gameName}` placeholder), `cancelButton`, `changeButton`, `removedPokemonDialogTitle`, `removedPokemonDialogContent` (`{removedIds}` placeholder), `understoodButton`, `retryButton`, `gameCountSubtitle` (ICU plural on `{count}`), `activeGameSnackbar` (`{gameName}` placeholder), `continueButton`, `noGamesAvailable`, `noSearchMatches`, `clearSearchFilter`, `searchHint`, `expansionsHeading`, `languageSelectorTitle`, `languageSelectorEntryTooltip`, `languageCatalogErrorMessage` — sourced from the literals currently hardcoded in `game_selection_page.dart`, `game_search_bar.dart`, and `dlc_toggle_list.dart`
- [X] T020 [P] Author `lib/l10n/app_es.arb` — full Spanish translation of every key in `app_en.arb` (research.md item 6: no key may be missing) — depends on T019
- [X] T021 [P] Author `lib/l10n/app_fr.arb` — full French translation of every key — depends on T019
- [X] T022 [P] Author `lib/l10n/app_de.arb` — full German translation of every key — depends on T019
- [X] T023 [P] Author `lib/l10n/app_it.arb` — full Italian translation of every key — depends on T019
- [X] T024 [P] Author `lib/l10n/app_ko.arb` — full Korean translation of every key — depends on T019
- [X] T025 [P] Author `lib/l10n/app_ja.arb` — full Japanese translation of every key — depends on T019
- [X] T026 [P] Author `lib/l10n/app_zh_Hans.arb` — full Chinese (Simplified) translation of every key — depends on T019
- [X] T027 [P] Author `lib/l10n/app_zh_Hant.arb` — full Chinese (Traditional) translation of every key — depends on T019
- [X] T028 Run `flutter gen-l10n` and resolve any generation errors/warnings (missing keys, malformed ICU) across `lib/l10n/app_*.arb` — depends on T020, T021, T022, T023, T024, T025, T026, T027

**Checkpoint**: Domain types, all three ports, the `GameCatalogRepository` amendment, their adapters, and a complete 9-language ARB bundle all exist and are unit-tested/generated — user story implementation can now begin.

---

## Phase 3: User Story 1 - Elegir el idioma de toda la aplicación (Priority: P1) 🎯 MVP

**Goal**: A user can open the language selector, see exactly the 9 official PokeAPI languages, pick one, and see both BrewDex's own UI text and PokeAPI-sourced content (game names) update to it, with the active language clearly marked (FR-001–FR-004, FR-008, FR-009).

**Independent Test**: Open the language selector, confirm only the 9 official languages are listed with readable names, pick a different one, confirm the game-selection screen's UI text and game names both update within ~10s and the picked language is marked active (quickstart.md scenario 1).

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T029 [P] [US1] Unit test `GetSupportedLanguages` use case (returns the catalog on success, surfaces `LanguageCatalogUnavailable` on failure) in `test/application/language_selection/get_supported_languages_test.dart`, mocking `SupportedLanguageCatalog` with `mocktail`
- [X] T030 [P] [US1] Unit test `SelectLanguage` use case (persists the chosen code via `LanguagePreferenceStore`, updates `ActiveLanguageReader`, builds an `explicit` `LanguagePreference`) in `test/application/language_selection/select_language_test.dart`
- [X] T031 [P] [US1] `bloc_test` for `LanguageSelectionCubit`'s load → select flow (loading → loaded-with-catalog → active-language-changed states) in `test/presentation/language_selection/language_selection_cubit_test.dart`, mocking the two use cases
- [X] T032 [P] [US1] Extend `GetGameCatalog`'s unit tests for the amended dependency on `ActiveLanguageReader` — reads `currentLanguageCode()` and passes it to `GameCatalogRepository.fetchCatalog` — in `test/application/game_selection/get_game_catalog_test.dart`, mocking `ActiveLanguageReader` alongside the existing fakes

### Implementation for User Story 1

- [X] T033 [US1] Implement `GetSupportedLanguages` use case in `lib/application/language_selection/use_cases/get_supported_languages.dart` — depends on T029 (failing test), T007
- [X] T034 [US1] Implement `SelectLanguage` use case in `lib/application/language_selection/use_cases/select_language.dart` — depends on T030 (failing test), T008, T009
- [X] T035 [US1] Implement `LanguageSelectionState` (loading/loaded/error/active-changed variants) and `LanguageSelectionCubit` (calls `GetSupportedLanguages` on init, `SelectLanguage` on pick) in `lib/presentation/language_selection/cubit/` — depends on T031 (failing test), T033, T034
- [X] T036 [P] [US1] Implement `LanguageOptionTile` widget (renders one `SupportedLanguage.displayName`, tappable, shows an active-state marker per FR-004) in `lib/presentation/language_selection/widgets/language_option_tile.dart`
- [X] T037 [US1] Implement `LanguageSelectorPage` (renders loading/error/list-of-`LanguageOptionTile` from the Cubit, retry action for `LanguageCatalogUnavailable`) in `lib/presentation/language_selection/pages/language_selector_page.dart` — depends on T035, T036
- [X] T038 [US1] Amend `GetGameCatalog` to depend on `ActiveLanguageReader` and pass `languageCode: activeLanguageReader.currentLanguageCode()` to `GameCatalogRepository.fetchCatalog` in `lib/application/game_selection/use_cases/get_game_catalog.dart` — depends on T032 (failing test), T018
- [X] T039 [US1] Subscribe `GameSelectionCubit` to `ActiveLanguageReader.onLanguageChanged()` and re-invoke `GetGameCatalog` whenever it fires, so an already-visible catalog updates in place instead of only on next screen entry (FR-003) in `lib/presentation/game_selection/cubit/game_selection_cubit.dart` — depends on T038
- [X] T040 [US1] Replace every hardcoded literal identified in T019 within `game_selection_page.dart`, `game_search_bar.dart`, and `dlc_toggle_list.dart` with `AppLocalizations.of(context)` lookups — depends on T028, T037
- [X] T041 [US1] Wire `MaterialApp.locale`, `localizationsDelegates` (`AppLocalizations.delegate` plus the three `Global*Localizations.delegate`s), and `supportedLocales` in `lib/main.dart`, deriving the current `Locale` from `LanguageSelectionCubit`'s active code (mapping PokeAPI code → Flutter `Locale`, e.g. `zh-Hans` → `Locale('zh', 'Hans')`) — depends on T035, T040
- [X] T042 [US1] Add a language-selector entry point (app-bar action opening `LanguageSelectorPage`) reachable from `GameSelectionPage`, and wire `PokeApiSupportedLanguageCatalog`, `LocalLanguagePreferenceStore`, and `InMemoryActiveLanguageReader` into `AppDependencies`/`main.dart` — depends on T037, T041
- [X] T043 [US1] Integration test covering Acceptance Scenarios 1.1–1.3 (only official languages listed, selecting a language updates both UI text and game names together, active language visibly marked) in `integration_test/language_selection_flow_test.dart` — depends on T042 — ⚠️ written and analyzer-clean, but NOT executed in this environment (no Android emulator/device and no Linux desktop support configured; web is unsupported by `flutter test integration_test`), matching the same caveat already recorded for `001-select-game`'s integration tests

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Conservar el idioma elegido entre sesiones (Priority: P2)

**Goal**: The selected language is remembered across app restarts, and a first-time launch picks a sensible default (device locale if supported, else English) (FR-005, FR-006).

**Independent Test**: Select a non-default language, close and reopen the app, confirm it's still active; then reset local storage and reopen, confirming the device-locale-or-English default (quickstart.md scenario 2).

### Tests for User Story 2 ⚠️

- [X] T044 [P] [US2] Unit test `GetActiveLanguage` use case — returns the persisted code with `source: explicit` when present; when absent, maps the device locale to a supported code if present in the catalog (`source: defaulted`), else defaults to `"en"` — in `test/application/language_selection/get_active_language_test.dart`, mocking `LanguagePreferenceStore`, `SupportedLanguageCatalog`, and the device-locale port
- [X] T045 [P] [US2] `bloc_test`/widget test verifying `LanguageSelectionCubit`'s startup path calls `GetActiveLanguage` and applies its result before the first frame renders (no flash of the wrong language) in `test/presentation/language_selection/language_selection_cubit_startup_test.dart`

### Implementation for User Story 2

- [X] T046 [US2] Implement `GetActiveLanguage` use case (FR-006 default-resolution rule) in `lib/application/language_selection/use_cases/get_active_language.dart` — depends on T044 (failing test), T007, T008
- [X] T047 [US2] Introduce a `DeviceLocaleProvider` port (`Locale currentDeviceLocale()`, kept framework-free per Constitution Principle VI) and its Flutter-backed adapter using `PlatformDispatcher.instance.locale`, in `lib/domain/language_selection/ports/device_locale_provider.dart` and `lib/infrastructure/language_selection/platform_device_locale_provider.dart` — depends on T046
- [X] T048 [US2] Wire `LanguageSelectionCubit`'s startup to call `GetActiveLanguage` and seed `InMemoryActiveLanguageReader` before `GameSelectionCubit`/`MaterialApp` build their first frame, in `lib/presentation/language_selection/cubit/language_selection_cubit.dart` and `lib/main.dart` — depends on T045 (failing test), T046, T047
- [X] T049 [US2] Integration test covering Acceptance Scenarios 2.1–2.2 (remembered language across relaunch; fresh install falling back to device locale or English) in `integration_test/language_persistence_flow_test.dart` — depends on T048 — ⚠️ written and analyzer-clean, but NOT executed in this environment (same device/desktop-support caveat as T043)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Ver contenido de forma consistente cuando falta traducción (Priority: P3)

**Goal**: When a translation is genuinely missing — for a PokeAPI-sourced field or (structurally, by construction) a UI string — the user always sees English text instead of a blank field or an untranslated key placeholder (FR-007).

**Independent Test**: Select a language with a known translation gap for a PokeAPI resource and confirm English text renders instead of a blank field; confirm no screen, in any of the 9 languages, ever shows an empty string or a raw ICU key (quickstart.md scenario 3).

### Tests for User Story 3 ⚠️

- [X] T050 [P] [US3] Add the missing-translation-falls-back-to-English case to `PokeApiSupportedLanguageCatalog`'s and `PokeApiGameCatalogRepository`'s unit tests — a `names` array missing the active language's entry resolves to the `en` entry rather than `null`/empty — extending `test/infrastructure/language_selection/pokeapi_supported_language_catalog_test.dart` and `test/infrastructure/game_selection/pokeapi_game_catalog_repository_test.dart` (from T011/T017)
- [X] T051 [P] [US3] Widget test asserting `GameCard`, `LanguageOptionTile`, and `LanguageSelectorPage` never render an empty string or an unresolved ICU key placeholder, across all 9 supported locales, in `test/presentation/language_selection/no_blank_or_key_placeholder_test.dart`

### Implementation for User Story 3

- [X] T052 [P] [US3] Add an ARB-completeness check (a `flutter_test` case or small `tool/check_arb_completeness.dart` script) that parses every `lib/l10n/app_*.arb` file and fails if any locale is missing a key present in `app_en.arb` (research.md item 6) — depends on T028
- [X] T053 [P] [US3] Confirm and harden the English-fallback branch in `PokeApiSupportedLanguageCatalog` and `PokeApiGameCatalogRepository` so a fallback is logged (Constitution Principle V) rather than silently swallowed, in `lib/infrastructure/language_selection/pokeapi_supported_language_catalog.dart` and `lib/infrastructure/game_selection/pokeapi_game_catalog_repository.dart` — depends on T050 (failing test) — already implemented as part of the Foundational adapters (the same `_resolveLocalizedName`/`_resolveDisplayName` helper handles lookup and fallback together); confirmed via T050's new test cases, no further code change needed
- [X] T054 [US3] Integration test covering Acceptance Scenario 3.1 (selecting a language with a known translation gap still renders English fallback text, never blank, for both PokeAPI content and UI text) in `integration_test/language_fallback_flow_test.dart` — depends on T051, T052, T053 — ⚠️ written and analyzer-clean, but NOT executed in this environment (same device/desktop-support caveat as T043)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and validation that span all three stories

- [X] T055 [P] Run `flutter analyze` across `lib/` and `test/` and resolve all findings
- [X] T056 [P] Verify the hexagonal boundary holds for the new context: `grep -rl "package:flutter\|package:http\|package:shared_preferences" lib/domain/language_selection lib/application/language_selection` returns no matches (Constitution Principle VI)
- [X] T057 [P] Confirm `game_selection`'s existing test suite (from `001-select-game`) still passes end-to-end with the amended `GameCatalogRepository`/`GetGameCatalog` signatures, updating any remaining call sites/fixtures the amendment tasks (T010, T018, T038) didn't already cover
- [~] T058 Run the full manual validation pass from `quickstart.md` (all 4 scenarios) and record the results — ⚠️ NOT fully done: this sandbox has no display/emulator, so the manual UI scenarios could not be walked by hand. Substituted with `flutter build web --release` (✅ succeeded) and `flutter build apk --debug` (✅ succeeded) as compile-level validation on both target platforms, plus the 124 passing automated tests (unit/bloc/infrastructure/widget) that exercise the same scenarios, matching the same substitution `001-select-game` used. A real manual (or device-based `integration_test`) pass is still recommended before shipping.
- [X] T059 [P] Bump `pubspec.yaml`'s version per the constitution's semantic versioning policy (Principle V) — MINOR bump (adds functionality; the `GameCatalogRepository` signature change is an internal contract, not a released public API) — bumped 0.1.0+1 → 0.2.0+2

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; reuses `LanguageSelectionCubit`/`LanguageSelectorPage` from US1 (T048 builds on T035) but its use case and device-locale adapter are independently testable per T044–T045
- **User Story 3 (Phase 5)**: Depends on Foundational; hardens fallback behavior already present in the Foundational adapters (T012, T018) and the ARB bundle (T019–T027), independently testable per T050–T052
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- Tests are written and MUST FAIL before their corresponding implementation task
- Domain/application (use cases) before presentation (Cubit, widgets, pages)
- Story implementation complete and checkpoint-verified before moving to the next priority

### Parallel Opportunities

- T004–T010 (domain entities/ports/amendment) can all run in parallel
- T011, T013, T015, T017 (adapter unit tests) can run in parallel with each other and with T004–T010
- T019 can run in parallel with T004–T018; T020–T027 (per-language ARB authoring) can all run in parallel with each other once T019 exists
- T029–T032 (US1 tests) can run in parallel; T036 (widget) can run in parallel with T033–T035
- T044–T045 (US2 tests) can run in parallel
- T050–T053 (US3 tests and hardening) can run in parallel
- T055–T057 and T059 in Polish can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test GetSupportedLanguages use case in test/application/language_selection/get_supported_languages_test.dart"
Task: "Unit test SelectLanguage use case in test/application/language_selection/select_language_test.dart"
Task: "bloc_test for LanguageSelectionCubit in test/presentation/language_selection/language_selection_cubit_test.dart"
Task: "Extend GetGameCatalog tests for ActiveLanguageReader in test/application/game_selection/get_game_catalog_test.dart"

# Launch independent implementation pieces together:
Task: "Implement LanguageOptionTile widget in lib/presentation/language_selection/widgets/language_option_tile.dart"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories, includes the full 9-language ARB bundle)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md scenario 1 and the T043 integration test
5. Demo if ready — this alone satisfies FR-001–FR-004, FR-008, FR-009

### Incremental Delivery

1. Setup + Foundational → foundation ready (all 9 languages selectable and fully translated for the UI)
2. Add User Story 1 → validate independently → MVP demo
3. Add User Story 2 → validate independently (persistence + default) → demo
4. Add User Story 3 → validate independently (missing-translation robustness) → demo
5. Polish → final quickstart.md pass across all three stories

### Parallel Team Strategy

With multiple developers, once Foundational (Phase 2) is done:
- Developer A: User Story 1 (Phase 3)
- Developer B: User Story 2 (Phase 4) — can start its use case/adapter work (T044–T047) immediately, then integrates with T035 once available
- Developer C: User Story 3 (Phase 5) — can start immediately since it only hardens/tests the Foundational adapters and ARB bundle, then integrates its integration test once T042 (US1's entry point) exists

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Domain and application tests use `mocktail` fakes for all ports — no network, storage, or Flutter binding required
- Verify each test fails before implementing the task that makes it pass
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- US2 and US3 extend `LanguageSelectionCubit`/the Foundational adapters by extension rather than duplication, per Constitution Principle I (Simplicity & YAGNI) — avoid introducing separate Cubits or parallel adapter implementations per story
- The `GameCatalogRepository` breaking-change amendment (T010, T018, T038) is deliberately placed across Foundational and US1 rather than duplicated — see `contracts/game_catalog_repository_amendment.md` for the full rationale
