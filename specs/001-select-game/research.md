# Research: Selección de Juego para el Constructor de Equipos

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

All items below were open questions in the Technical Context. Two
(platform and persistence strategy) were resolved directly with the user;
the rest are standard technical decisions resolved here so no
`NEEDS CLARIFICATION` markers remain before Phase 1.

## 1. Application platform & stack

- **Decision**: Frontend-only Flutter application, targeting Android and
  Web from a single codebase. No backend service.
- **Rationale**: Explicit user decision. Flutter's single-codebase model
  covers both required targets, and a purely client-side app is the
  simplest architecture that satisfies every functional requirement in
  the spec — nothing in FR-001–FR-012 requires server-side logic.
- **Alternatives considered**: A web SPA (React/TS) with or without a
  companion backend was the initial default proposal, but the user
  explicitly chose Flutter frontend-only instead.

## 2. Persisting the last-selected game (FR-008)

- **Decision**: `shared_preferences`, storing only the selected game's
  identifier (a string) under a single key.
- **Rationale**: User explicitly chose local, on-device/browser storage
  over a backend+database. `shared_preferences` is the standard Flutter
  package for exactly this shape of data (a small amount of key-value
  state) and already abstracts over Android (`SharedPreferences`) and Web
  (`window.localStorage`), so the same infrastructure adapter code runs
  on both targets.
- **Alternatives considered**: `Hive`/`Isar` (local databases) — rejected
  as disproportionate for persisting a single string (Principle I,
  Simplicity & YAGNI). A backend with a database — rejected per the
  user's explicit platform decision (no backend).

## 3. State management / application-layer orchestration

- **Decision**: `flutter_bloc`, using a Cubit to drive the game-selection
  screen.
- **Rationale**: The constitution's Principle VI requires use cases to be
  orchestrated outside the presentation layer and entry-point widgets to
  stay thin. A Cubit is a natural application-layer coordinator: it calls
  the use cases (`GetGameCatalog`, `SearchGames`,
  `FilterGamesByGeneration`, `SelectGame`, `SwitchGame`) and emits
  immutable UI state, keeping widgets free of business logic. `bloc_test`
  gives isolated, fast tests for this orchestration (Principle II).
- **Alternatives considered**: `Riverpod` — comparable fit, also viable,
  but `flutter_bloc`'s Cubit/State separation maps slightly more directly
  onto "use case in, immutable state out" without extra provider
  boilerplate for this feature's scope. Raw `setState`/`ChangeNotifier` in
  the widget tree — rejected because it would pull orchestration logic
  into the presentation layer, violating the "entry-point adapters MUST
  stay thin" rule in Principle VI.

## 4. HTTP client for PokeAPI

- **Decision**: `http` (the official `dart.dev`-published package).
- **Rationale**: The only network need is a handful of small, infrequent
  GET requests (fetch version-groups, fetch generations for filtering).
  `http` covers this with no extra surface area. Per Principle I, added
  capability (retry policies, interceptors, request cancellation) is not
  justified by any current requirement.
- **Alternatives considered**: `dio` — offers interceptors/retry/caching
  out of the box, but none of that is required by FR-001–FR-012 today; if
  a future feature needs it, the change is confined to the
  `infrastructure/game_selection` adapter behind the existing
  `GameCatalogRepository` port and will not touch domain/application code.

## 5. Mapping PokeAPI data to the `Game` domain concept

- **Decision**: Each selectable `Game` maps to one PokeAPI `version-group`
  resource (`GET /api/v2/version-group` for the list,
  `GET /api/v2/version-group/{id}` for detail), with its display name
  derived from the paired `versions` it contains (e.g. "Scarlet/Violet")
  and its generation taken from the version-group's linked `generation`
  resource.
- **Rationale**: PokeAPI's `version-group` resource already represents
  exactly the "paired release" concept the user chose in the granularity
  clarification (FR-002) — it groups the individual `version` entries
  that were sold together and links to a single `generation`. Building the
  domain model on top of it means no custom pairing/grouping logic is
  needed in the app itself, directly satisfying FR-005 (filter by
  generation) using data already returned by the API.
- **Alternatives considered**: Building `Game` from the individual
  `version` resource — rejected, would show paired releases as separate
  options, contradicting FR-002 and the user's explicit granularity
  decision.

## 6. Catalog freshness vs. caching

- **Decision**: Fetch the catalog fresh from PokeAPI every time the
  selector loads; do not persist the catalog itself locally (only the
  selected game's identifier is persisted, per item 2). An in-memory
  cache may be kept for the lifetime of a single app session to avoid
  redundant requests while the user searches/filters, but it is not
  written to disk.
- **Rationale**: The spec's edge case is explicit: "if the underlying
  game catalog changes... the next time the selector loads, it MUST
  reflect the current catalog without requiring any manual update." The
  simplest way to guarantee that (Principle I) is to not introduce a
  persisted cache with invalidation rules at all — fetch-on-load already
  satisfies the requirement, and the catalog is small enough (~20-25
  items) that this is cheap.
- **Alternatives considered**: A persisted cache with a time-based
  invalidation policy — rejected as unjustified complexity for a small,
  infrequently-changing catalog; can be introduced later behind the same
  `GameCatalogRepository` port if performance data ever shows a need.

## 7. Testing tools

- **Decision**: `flutter_test` (widgets), `bloc_test` (Cubit behavior),
  `mocktail` (fake `GameCatalogRepository`/`SelectedGameStore`
  implementations for domain/application tests), `integration_test`
  (on-device/browser end-to-end flows).
- **Rationale**: This combination is the standard Flutter testing stack
  and is sufficient to satisfy Principle II (Test-First) at every layer:
  pure-Dart unit tests for domain/application against mocked ports, Cubit
  tests for orchestration, widget tests for presentation, and one
  end-to-end integration test per priority user story.
- **Alternatives considered**: `mockito` instead of `mocktail` — both are
  viable; `mocktail` was chosen for its null-safety-first API and because
  it needs no code generation step, keeping the toolchain simpler
  (Principle I).

## Outcome

All Technical Context fields are resolved; no `NEEDS CLARIFICATION`
markers remain. Proceeding to Phase 1 design.
