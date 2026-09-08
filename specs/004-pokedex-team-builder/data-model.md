# Data Model: Armador de Equipo y Pokédex del Juego

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

New types below live in `domain/team_builder` and MUST stay free of
Flutter, HTTP, and storage imports (Constitution Principle VI). This
feature also reuses existing `domain/game_selection` types as-is (not
duplicated) — see "Reused entities" at the end.

## PokedexEntry

Represents one Pokémon as it applies to a specific `Game` and the
currently active `PokedexView` (FR-004).

| Field | Type | Notes |
|-------|------|-------|
| `pokemonId` | `String` | Stable PokeAPI Pokémon identifier (species-level). Used as the value stored in a `TeamBuildingSession.rosterPokemonIds` entry and as this entry's equality key. |
| `displayName` | `String` | Localized species name (FR-004), resolved for the active language with English fallback (same pattern as `Game.displayName`). |
| `pokedexNumber` | `int` | The number to display and sort by (FR-004, FR-006) — regional or national depending on the `PokedexView` that produced this entry (research.md item 7). Meaning is contextual, not a fixed "the" dex number. |
| `spriteUrl` | `String?` | Game-specific sprite when available, else the species' default sprite, else `null` (research.md item 9). `null` renders the FR-005 placeholder. |
| `typePrimary` | `PokemonType` | Type 1. |
| `typeSecondary` | `PokemonType?` | Type 2, when the species has one. |
| `introducedGeneration` | `Generation` | The generation this species was first introduced in (FR-013) — independent of `pokedexNumber`'s source view. |
| `sourceTag` | `PokedexEntrySource` | Why this entry is currently visible: `regional`, `national`, or `dlc(dlcId)` — lets the UI/tests distinguish "from the base list" vs "added by a DLC toggle" without re-deriving it. |

**Validation rules**:
- `pokemonId` and `displayName` MUST be non-empty.
- `pokedexNumber` MUST be a positive integer.

**Relationships**: Produced by `PokedexRepository.fetchPokedex` for one
`(Game, PokedexView)` pair. A `TeamSlot` holds at most one
`PokedexEntry.pokemonId` reference (by id, not the full entry — the slot
resolves back to the currently-loaded entry for display).

## PokemonType

Value object for a type a `PokedexEntry` can have (type 1 or type 2).

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | Stable identifier (PokeAPI type name, e.g. `"rock"`). |
| `label` | `String` | Localized display label used in the type filter (FR-012), same resolution/fallback pattern as `Generation.label`. |

**Validation rules**: `id` and `label` MUST be non-empty. Equality is by
`id` (mirrors `Generation`).

## PokedexView

Describes which underlying dataset is active — what determines *which*
Pokémon are fetched/shown and which numbering they use (FR-016–FR-019).

| Field | Type | Notes |
|-------|------|-------|
| `useNationalDex` | `bool` | When `true` and the `Game`'s generation is eligible (research.md item 7; 2nd–7th generation only), replaces the regional list/numbering with the national one (FR-017). Ignored (treated as `false`) for an ineligible game. |
| `activeDlcIds` | `Set<String>` | Ids of the `Game.dlcs` currently toggled on (FR-018); their Pokémon are merged into whichever base list is active. |

**Validation rules**: every id in `activeDlcIds` MUST belong to the
target `Game.dlcs`; a `PokedexView` is otherwise always valid (no
selection is itself an error — it just means "regional only, no DLC").

## PokedexFilterCriteria

The user's current search/filter input (FR-011–FR-015), applied
client-side over an already-fetched list of `PokedexEntry` (research.md
item 11).

| Field | Type | Notes |
|-------|------|-------|
| `searchText` | `String` | Partial, case-insensitive match against `displayName` (FR-011). Empty means no name filter. |
| `type` | `PokemonType?` | Matches an entry whose `typePrimary` OR `typeSecondary` equals this type (FR-012). `null` means no type filter. |
| `generation` | `Generation?` | Matches `introducedGeneration` (FR-013). `null` means no generation filter. |

**Validation rules**: none — every field is independently optional; all
active fields combine with AND (FR-014).

## TeamSlot

One of the team's 6 fixed positions (FR-001).

| Field | Type | Notes |
|-------|------|-------|
| `index` | `int` | Position, `0`–`5`. |
| `pokemonId` | `String?` | The occupying Pokémon's id, or `null` when empty. |

**Validation rules**: exactly 6 slots exist per team at all times; a
`TeamSlot` is a derived/presentational view over
`TeamBuildingSession.rosterPokemonIds[index]` (index out of range ⇒
empty) rather than its own persisted entity — see "Reused entities"
below for where the underlying list actually lives.

**State transitions**: empty → occupied (`AddPokemonToTeam`, FR-008);
occupied → empty (`RemovePokemonFromTeam`, FR-010). Occupied → occupied
(replacing one Pokémon with another directly) is out of scope — remove,
then add (spec Assumptions).

## Reused entities (from `domain/game_selection`, unchanged in shape)

- **`Game`**: the selected game this Pokédex/team belongs to (already
  defined by `001-select-game`).
- **`GameDlc`**: source of the DLC ids `PokedexView.activeDlcIds`
  references and that `DlcToggleList` renders (relocated to this
  feature's presentation layer — see `research.md` item 2).
- **`Generation`**: reused directly for both `PokedexEntry.introducedGeneration`
  and the generation filter (FR-013) — the same value object already
  used for `Game.generation` in `001-select-game`, not a new parallel
  type.
- **`TeamBuildingSession`**: this feature is the first to actually read
  and write `rosterPokemonIds` (previously only reconciled by
  `SwitchGame` against a caller-supplied fixture). `AddPokemonToTeam`/
  `RemovePokemonFromTeam` (below) are the only use cases that mutate it;
  its max size (6) is enforced by those use cases against the existing
  `rosterPokemonIds` list — no new field is added to the entity itself.

## Use case summary (`application/team_builder/use_cases`)

- **`GetPokedex`**: `(Game, PokedexView, languageCode)` → sorted
  `List<PokedexEntry>` (FR-003, FR-004, FR-006, FR-016–FR-018), via
  `PokedexRepository`.
- **`FilterPokedexEntries`**: `(List<PokedexEntry>, PokedexFilterCriteria)`
  → filtered `List<PokedexEntry>`, order preserved (FR-011–FR-015).
- **`AddPokemonToTeam`**: `(TeamBuildingSession, pokemonId)` → updated
  session, or a `TeamFullFailure` when all 6 slots are already occupied
  (FR-008, FR-009); persists via `TeamRosterStore`.
- **`RemovePokemonFromTeam`**: `(TeamBuildingSession, pokemonId)` →
  updated session (FR-010); persists via `TeamRosterStore`.

## Ports (`domain/team_builder/ports`)

- **`PokedexRepository`**: `fetchPokedex({Game, PokedexView, languageCode})
  → List<PokedexEntry>` — see `contracts/pokedex_repository.md`.
- **`TeamRosterStore`**: read/write the persisted `rosterPokemonIds` —
  see `contracts/team_roster_store.md`.
- **`RosterValidityChecker`**: **not new** — this feature *implements*
  the port `001-select-game` already declared
  (`domain/game_selection/ports/roster_validity_checker.dart`); see
  `contracts/roster_validity_checker_implementation.md`.

## Failures (`domain/team_builder/failures`)

- **`PokedexUnavailable`**: thrown by `PokedexRepository.fetchPokedex`
  when the Pokédex cannot be retrieved (FR-020) — same shape/role as
  `GameCatalogUnavailable` from `001-select-game`.
- **`TeamFullFailure`**: thrown by `AddPokemonToTeam` when no slot is
  free (FR-009).
