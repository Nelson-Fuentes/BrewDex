# Phase 1 Data Model: Ajustes de Tamaño de Tipos, Disponibilidad de Formas por Juego, Tarjetas y Análisis de Cobertura

No new domain entities, value objects, or ports are introduced by this feature — every user story is either a presentation-layer sizing/layout/reuse change, or a reconciliation rule expressed purely in terms of value objects that already exist. This document records the fields that change meaning/behavior and the one new (presentation-level) invariant.

## Existing value objects touched

### `RosterEntry` (`domain/team_builder/value_objects/roster_entry.dart`)

No field shape changes. Behavior change (User Story 2): the invariant "`formVarietyId` (when non-null) identifies a member of the *active game's* `PokedexEntry.selectableForms`, and `megaActive`/`gigamaxActive` (when `true`) are only `true` when the active game's `PokedexEntry.megaForm`/`gigamaxForm` is non-null" is now actively enforced by `TeamBuilderCubit.load()` on every load/game-switch, instead of only being true by construction at selection time. A stored value that violates it (left over from a different game) is corrected back to `null`/`false` and persisted.

| Field | Before this feature | After this feature |
|---|---|---|
| `formVarietyId` | Set when the user picks a form; never re-validated against a later game switch. | Same, plus: cleared to `null` by `load()` if it no longer matches any `resolvedEntries[pokemonId]!.selectableForms[*].varietyId` for the newly active game. |
| `megaActive` | Set when the user activates Mega; never re-validated. | Same, plus: cleared to `false` by `load()` if `resolvedEntries[pokemonId]!.megaForm` is `null` for the newly active game. |
| `gigamaxActive` | Set when the user activates Gigamax; never re-validated. | Same, plus: cleared to `false` by `load()` if `resolvedEntries[pokemonId]!.gigamaxForm` is `null` for the newly active game. |

### `PokedexEntry` (`domain/team_builder/entities/pokedex_entry.dart`)

Unchanged shape. `selectableForms`/`megaForm`/`gigamaxForm` (already game-scoped by `PokeApiPokedexRepository`) become the source of truth the new reconciliation pass in `TeamBuilderCubit.load()` reads against — no new field needed.

### `PokemonType` (`domain/team_builder/value_objects/pokemon_type.dart`)

Unchanged. Reused as-is for the Coverage Analysis table's rows via the existing `kAllPokemonTypes` list (`presentation/team_builder/widgets/all_pokemon_types.dart`) — `.label` is rendered as the table's first-column text (FR-016); `.id`/`.numericId` are not needed by this increment.

## New presentation-level constant

### `kStandardTypeIconSize`

- **Where**: `presentation/team_builder/widgets/type_icon_resolution.dart`.
- **Shape**: `const double kStandardTypeIconSize = 24.0;`
- **Used by**: every `PokemonTypeIcon` call site that renders a Pokémon's own type(s) — `TeamSlot`, `PokedexTypeFilter._TypeTile`, `PokemonCustomizationCard`'s type row. Not applied to the Tera Type badge (kept at whatever size already reads correctly next to the standard type row, since it is a distinct badge rather than one of "the Pokémon's types"), nor to the move-row's per-move type icon inside `MoveListTile` (already a distinct, smaller, already-reasonable size — 24/28px — used consistently for a different purpose: labeling a move's type inside a list row, not badging the Pokémon itself).

## New presentation-level shared widget

### `MoveListTile` (promoted from `move_selection_sheet.dart`'s private `_MoveListTile`)

| Field | Type | Notes |
|---|---|---|
| `move` | `Move` | Required — same as before promotion. |
| `l10n` | `AppLocalizations` | Required — same as before promotion. |
| `onTap` | `VoidCallback` | Required — same as before promotion. |
| `trailing` | `Widget?` | **New.** `null` (default) renders exactly as today (the selector's own usage). `PokemonCustomizationCard` passes its existing "clear move" `IconButton` here for a filled slot. |

No new state, no new business rule — purely a widget-API addition (one optional field) to make the existing row reusable from a second call site.

## New page & widget (User Story 7)

### `CoverageAnalysisPage`

- **Where**: `presentation/team_builder/pages/coverage_analysis_page.dart`.
- **Inputs**: none for this increment (no `game`/`roster` parameter yet — the table is fully static, per spec.md Assumptions scoping columns beyond "all types" out of this increment).
- **Renders**: `AdaptiveScaffold(title: <localized "Análisis de Cobertura">, body: CoverageTable())`.

### `CoverageTable`

- **Where**: `presentation/team_builder/widgets/coverage_table.dart`.
- **Inputs**: none for this increment (reads `kAllPokemonTypes` directly — the same posture `TeraTypePicker` already has toward that constant).
- **Renders**: one `DataTable`, one `DataColumn` (localized "Tipo" header), one `DataRow` per `kAllPokemonTypes` entry with a single `DataCell(Text(type.label))`.
- **Future extension point** (out of scope, recorded for continuity): later increments add further `DataColumn`s (one per roster Pokémon, or aggregate offense/defense columns) and will need `game`/roster data as inputs at that point — this increment's signature intentionally stays parameter-free rather than threading unused parameters through now (Principle I).
