# Data Model: Selección de Juego para el Constructor de Equipos

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

All types below live in the `domain/game_selection` layer and MUST stay
free of Flutter, HTTP, and storage imports (Constitution Principle VI).

## Game

Represents one selectable Pokémon game option. A paired release (e.g. two
versions sold together) is a single `Game` — never two — per FR-002.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | Stable identifier from the source catalog (PokeAPI version-group name/id); used as the persisted value for FR-008. |
| `displayName` | `String` | Human-readable, unambiguous label (e.g. "Scarlet/Violet"). MUST distinguish this game from every other in the catalog (FR-002). |
| `generation` | `Generation` | The generation this game belongs to; used for FR-005 filtering. |

**Validation rules**:
- `id` MUST be non-empty and unique within a catalog.
- `displayName` MUST be non-empty.

**Relationships**: A `Game` belongs to exactly one `Generation`. A
`Game` may be referenced by zero or one `TeamBuildingSession` at a time
(the session's active selection).

## Generation

A value object grouping games the way the source data already categorizes
them (per the spec's Assumptions — no custom grouping scheme is invented).

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | Stable identifier (e.g. PokeAPI generation name/id). |
| `label` | `String` | Human-readable generation label used in the filter UI (e.g. "Generation I"). |

**Validation rules**: `id` and `label` MUST be non-empty. Equality is
by `id` (two `Generation` values with the same `id` are the same
generation).

## GameCatalog

An in-memory collection representing "the full list of games" (FR-001)
at a point in time. Not persisted (see research.md item 6 — fetched fresh
on every load).

| Field | Type | Notes |
|-------|------|-------|
| `games` | `List<Game>` | The full, unfiltered catalog as returned by the current fetch. |

**Derived operations** (implemented as application-layer use cases, not
methods that reach into infrastructure):
- Search by partial name match against `displayName` (FR-004).
- Filter by `Generation.id` (FR-005).
- Both may be combined (e.g. search text + a generation filter active at
  once).

## TeamBuildingSession

Represents the user's in-progress team and its currently active `Game`.
This feature only manages the `activeGame` facet of the session; the
Pokémon-roster mechanics themselves are out of scope (see spec
Assumptions) and are modeled here only to the extent needed to describe
the reconciliation behavior in FR-009–FR-011.

| Field | Type | Notes |
|-------|------|-------|
| `activeGame` | `Game?` | The currently selected game; `null` until FR-007's gate is satisfied. |
| `rosterPokemonIds` | `List<String>` | Opaque identifiers of Pokémon already added to the in-progress team (owned by the future team-building feature; referenced here only so switching games can be validated against it). |

**State transitions**:
- `activeGame == null` → `activeGame == <chosen Game>`: happens once the
  user completes User Story 1 (FR-003, FR-007).
- `activeGame == A` → `activeGame == B` (User Story 3): triggers the
  `SwitchGame` use case, which:
  1. Determines which entries in `rosterPokemonIds` are valid for `B`
     (validity check delegated to the future team-building bounded
     context's own port — out of scope to define here beyond the
     boundary this use case calls through).
  2. Removes any entry not valid for `B`, producing a notice of what was
     removed (FR-010).
  3. Leaves `rosterPokemonIds` untouched if every entry is valid for `B`
     (FR-011).
- Persistence of `activeGame.id` across sessions is handled by the
  `SelectedGameStore` port (FR-008), not by this in-memory type directly.

## Failure types

| Type | When raised | Consumed by |
|------|-------------|-------------|
| `GameCatalogUnavailable` | The `GameCatalogRepository` port cannot retrieve the catalog (network error, timeout, malformed response). | `GetGameCatalog` use case → surfaced to presentation as the retryable error from FR-012/SC-005. |
