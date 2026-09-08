# Data Model: Slots 3×2 sin Espacio Desperdiciado, Íconos ×4, Movimientos por Defecto y Filtro Ocultable

## Amended Port

### `MovepoolRepository` (amended, `lib/domain/team_builder/ports/movepool_repository.dart`)

New method, alongside the existing `fetchMovepool`:

```dart
/// Resolves the last (highest-level) moves [varietyId] learns by
/// level-up in [game], up to 4, ordered ascending by learn level
/// (012-slots-icons-moves-defaults, User Story 3, FR-005/FR-006).
/// Never includes a move learned only by another method (TM, egg,
/// tutor) — an empty result means [varietyId] learns no moves by
/// level-up in [game] at all. Throws `PokedexUnavailable` on failure,
/// same as `fetchMovepool`.
Future<List<Move>> fetchDefaultMoveset({
  required String varietyId,
  required Game game,
  required String languageCode,
});
```

No new value object — reuses `Move` as-is.

## New Application Use Case

### `GetDefaultMoveset` (new, `lib/application/team_builder/use_cases/get_default_moveset.dart`)

Mirrors `GetMovepool`'s shape exactly — a thin wrapper resolving the active language via `ActiveLanguageReader` before delegating to `MovepoolRepository.fetchDefaultMoveset`.

```dart
class GetDefaultMoveset {
  GetDefaultMoveset({
    required MovepoolRepository movepoolRepository,
    required ActiveLanguageReader activeLanguageReader,
  });

  Future<List<Move>> call({required String varietyId, required Game game});
}
```

## Amended Behavior — `TeamBuilderCubit.addPokemon`

No new state fields. After `_addPokemonToTeam` succeeds and the roster grows by one entry (the new entry is always the last one, per `AddPokemonToTeam`'s existing "next empty slot = append" behavior), `addPokemon`:

1. Resolves `GetDefaultMoveset(varietyId: pokemonId, game: state.game)` (best-effort — a `PokedexUnavailable` here does not fail the whole add; the Pokémon still joins the team with empty move slots, matching the pre-existing edge case "no level-up moves available").
2. Builds the new slot's `RosterEntry.moveIds` from the resolved moves' ids (padded with `null` up to 4).
3. Persists the roster (via the same `TeamRosterStore` write already used elsewhere) and emits the updated state.

No change to `AddPokemonToTeam` itself (research.md Decision 4) — this orchestration lives entirely in `TeamBuilderCubit`, which already composes multiple use cases in sequence (see `load()`).

## Amended Widget State — `MoveSelectionSheet`

New local (ephemeral) field on `_MoveSelectionSheetState`:

```dart
bool _showTypeFilter = false;
```

Toggled by a new `Switch`/`SwitchListTile` in the sheet's build method; flipping it to `false` also resets `_typeFilter` to `null` in the same `setState` call (012, User Story 4, FR-009–FR-011).

## Layout Amendments (no data model change — presentation-only)

- `TeamSlotRow` (`shrinkWrap: false` path only): `GridView.count` → `LayoutBuilder` + `GridView.builder` with a computed `childAspectRatio`, `crossAxisCount: 3` (research.md Decision 1).
- `TeamBuilderTwoPaneLayout`: the `Padding(all: 16)` wrapping the slots-side `TeamSlotRow` is removed/reduced.
- `PokemonCustomizationCard`'s Moves section: `Wrap` → `Column`, each `_MoveSlotTile` full-width (research.md Decision 6).
- Icon size constants at 5 call sites multiplied by 4 (research.md Decision 2) — see contracts/type_icon_sizes_x4.md for the exact table.
