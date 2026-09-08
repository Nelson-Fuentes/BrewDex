# Phase 1 Data Model: Mejoras al Configurador de Equipo Pokémon

Scope: only entities/value objects that are **new** or **amended** by this feature. Everything else in `domain/team_builder` and `domain/game_selection` keeps its current shape.

## Amended: `RosterEntry` (`domain/team_builder/value_objects/roster_entry.dart`)

| Field | Type | Notes |
|---|---|---|
| `teraType` | `PokemonType?` | **New.** Set once by `AddPokemonToTeam` (research.md Decision 5) to the added entry's `typePrimary` when the target game is `scarlet-violet`; `null`/ignored for every other game. Overwritten only by an explicit user pick via `TeraTypePicker`; never recomputed by a subsequent form change (FR-016c). |

`copyWith`/`toJson`/`fromJson`/`props` all gain `teraType` following the exact existing pattern for `cosmeticVariantId` (nullable, omitted from JSON when `null`, equatable prop). No other field changes.

## Amended: `SelectableForm` (`domain/team_builder/value_objects/selectable_form.dart`)

| Field | Type | Notes |
|---|---|---|
| `typePrimary` | `PokemonType` | **New.** This variety's type 1 — from the same `varietyPokemonBody['types']` the repository already fetches while building this form (research.md Decision 4). |
| `typeSecondary` | `PokemonType?` | **New.** This variety's type 2, when present. |
| `homeSpriteFemaleUrl` | `String?` | **New.** This variety's HOME-style female sprite, mirroring `PokedexEntry.homeSpriteFemaleUrl`. |
| `homeSpriteShinyFemaleUrl` | `String?` | **New.** This variety's HOME-style shiny+female sprite, mirroring `PokedexEntry.homeSpriteShinyFemaleUrl`. |

`props` stays `[varietyId]` (equality is still by identity, unchanged) — the four new fields are payload only, same treatment as the four existing sprite/type fields on `PokedexEntry` itself.

## New: `PokedexIndexEntry` (`domain/team_builder/value_objects/pokedex_index_entry.dart`)

The cheap, ordering-only projection `fetchPokedexIndex` returns (research.md Decision 3) — everything already available from a Pokédex resource's `pokemon_entries` without a per-species HTTP call.

| Field | Type | Notes |
|---|---|---|
| `pokemonId` | `String` | Same identity used by `PokedexEntry.pokemonId`/`RosterEntry.pokemonId`. |
| `pokedexNumber` | `int` | Same meaning/source as `PokedexEntry.pokedexNumber` (regional or national depending on the active `PokedexView`). |
| `sourceTag` | `PokedexEntrySource` | Same type `PokedexEntry.sourceTag` already uses (regional/national/DLC). |

Pure domain value object (no Flutter/HTTP imports), equatable by `pokemonId`. A `PokedexIndexEntry` is a strict subset of what `PokedexEntry` carries — `fetchPokedexDetails` for that same id always resolves a `PokedexEntry` whose `pokemonId`/`pokedexNumber`/`sourceTag` match it exactly, so the presentation layer can render a list ordered by the index and progressively "upgrade" individual rows to full `PokedexEntry`s without ever re-sorting.

## Amended: `PokedexRepository` (`domain/team_builder/ports/pokedex_repository.dart`)

Replaces the single `fetchPokedex` method (see `contracts/pokedex_repository_pagination.md` for the full contract):

```dart
abstract class PokedexRepository {
  Future<List<PokedexIndexEntry>> fetchPokedexIndex({
    required Game game,
    required PokedexView view,
  });

  Future<List<PokedexEntry>> fetchPokedexDetails({
    required Game game,
    required List<String> pokemonIds,
    required String languageCode,
  });
}
```

Both throw `PokedexUnavailable` on failure (unchanged failure type). `fetchPokedexIndex` takes no `languageCode` — it resolves no localized text, only ids/numbers/source tags.

## Amended: `TeamBuilderState` (`presentation/team_builder/cubit/team_builder_state.dart`)

| Field | Type | Notes |
|---|---|---|
| `index` | `List<PokedexIndexEntry>` | **New.** The full ordered index for the active `view` (fetched once). |
| `resolvedEntries` | `Map<String, PokedexEntry>` | **Renames/generalizes today's `entryCache`** — every id whose detail has been fetched so far (initial batch + infinite-scroll batches + search hits), keyed by `pokemonId`. `entryCache`'s existing job (a filled slot resolving its occupant even outside the current view) is unchanged, just backed by the same incrementally-grown map. |
| `resolvedCount` | `int` | **New.** How many of `index` (in order) have been detail-resolved so far — drives "load next batch" (FR-007) and lets the grid render placeholder tiles for `index` entries beyond this count without waiting on them. |
| `isLoadingMore` | `bool` | **New.** True while a batch (scroll-triggered or search-triggered) is in flight — mirrors the existing `isRefreshingPokedex` pattern so the presentation layer can show a scoped loading affordance instead of blocking the whole screen. |
| `activeSlotIndex` | `int?` | **New.** No such concept exists today — the customization card is only ever a transient modal bottom sheet, so no slot is ever visually "active" while closed. FR-014 needs one: set when a slot is tapped (opening its `PokemonCustomizationCard`), cleared when the card closes. `TeamSlotRow`/`TeamSlot` gain an `isActive`/`activeIndex` parameter driven by this field so `PokeballBackground`'s `accent` tone (contracts/pokeball_background.md) can follow it, on both the compact modal-sheet flow and the expanded two-pane layout. |

`allEntries`/`visibleEntries` (today's fully-eager lists) are replaced by deriving "what to render" from `index` + `resolvedEntries`, filtered by the existing `PokedexFilterCriteria` — a visible row is either a resolved `PokedexEntry` (render normally) or an unresolved `PokedexIndexEntry` past `resolvedCount` (render a lightweight placeholder tile, which triggers its own resolution once scrolled near).

## Amended: `GameSelectionState` (`presentation/game_selection/cubit/game_selection_state.dart`)

**Removed**: `pendingGameSwitch`, `rosterRemovalNotice` (research.md Decision 1 — the confirm/removal-notice flow they backed no longer exists). `rosterPokemonIds` stays (still useful for the game-selection screen's own display), but it is always `const []` immediately after any `selectGame` call, since the roster is always reset.

## Removed entirely

- `application/game_selection/use_cases/switch_game.dart` and `domain/game_selection/entities/team_building_session.dart`'s reconciliation role — `TeamBuildingSession` itself may still exist if other code needs the plain `{activeGame, rosterPokemonIds}` pairing, but nothing constructs it for reconciliation purposes anymore.
- `GameSelectionCubit.requestGameSwitch`, `.cancelGameSwitch`, `.confirmGameSwitch`, `.acknowledgeRemovalNotice`.
- The two `AlertDialog`s (`_showConfirmSwitchDialog`, `_showRemovalNoticeDialog`) and their `l10n` strings (`changeGameDialogTitle`/`Content`, `removedPokemonDialogTitle`/`Content`) in `game_selection_page.dart` — confirm removal of the now-unused localization keys during implementation (do not leave orphaned strings in `app_localizations`/ARB files).
