# Phase 1 Data Model: Correcciones de Configurador de Equipo (Tipos, Tarjeta, Legends Z-A y Cobertura)

No new entities are introduced. Every user story amends an existing type's
behavior or a widget's rendering; this document records exactly what
changes and what stays the same.

## `PokemonType` (`domain/team_builder/value_objects/pokemon_type.dart`)

Unchanged shape (`id`, `label`, `numericId`). User Story 5 (pre-Fairy types)
changes *which* `PokemonType` values a `PokedexEntry.typePrimary`/
`typeSecondary` resolve to for a given `(species, game)` pair — never the
value object's fields.

## `PokedexEntry` (`domain/team_builder/entities/pokedex_entry.dart`)

Unchanged fields. `typePrimary`/`typeSecondary` are populated by
`PokeApiPokedexRepository` from `pokemon.past_types` instead of
`pokemon.types` whenever the active game's generation predates the
generation at which a `past_types` entry took effect (research.md Decision
5) — a resolution-time change in the infrastructure adapter, not a schema
change to this entity.

`megaForm` (a `SelectableForm?`) is unaffected in shape; User Story 4 only
changes *whether* the repository ever gets far enough to populate it for
Legends Z-A (the `mega-dimension` Pokédex source is no longer gated behind
an opt-in DLC toggle for that one game — research.md Decision 4).

## `RosterEntry` (`domain/team_builder/value_objects/roster_entry.dart`)

Unchanged fields (`moveIds`, `megaActive`, `gigamaxActive`, ...). User Story
1 changes a *cubit-level* read pattern — `fetchMovepoolForActiveSlot` no
longer lets an active `megaActive`/`gigamaxActive` state redirect its
movepool fetch to the Mega/Gigamax variety id — never the entry's own
stored fields or their meaning.

## `Move` (`domain/team_builder/value_objects/move.dart`)

Unchanged shape. User Story 3 changes which upstream `version_group`(s)
`PokeApiMovepoolRepository` is willing to source a species' `Move` list
from — a fallback at the infrastructure boundary — never `Move`'s fields.

## `CoverageTable` widget (presentation-only; no domain entity)

**Before**: `CoverageTable()` — no parameters; one `DataColumn` (type name).

**After**:

```dart
class CoverageTable extends StatelessWidget {
  const CoverageTable({super.key, this.pokemonTypes});

  /// The currently-displayed card's resolved 1–2 types (User Story 8,
  /// FR-012–FR-014). `null`/empty renders the type-name column alone,
  /// same as before this feature (013's parameter-free first increment).
  final List<PokemonType>? pokemonTypes;

  @override
  Widget build(BuildContext context) { ... }
}
```

- Rows: unchanged — one per `kAllPokemonTypes` entry, in the same order.
- New `DataColumn` ("Eficacia de defensa" / `coverageAnalysisDefenseColumnHeader`),
  populated only when `pokemonTypes` is non-null/non-empty. Cell value per
  row = the product, over each type in `pokemonTypes`, of that attacking
  type's multiplier against the defending type — sourced from
  `type_effectiveness_chart.dart`'s existing per-type multiplier map, the
  same combination rule the removed (013) weaknesses section used. Rendered
  values are one of `0`, `0.5`, `1`, `2`, `4` per spec.md FR-012/FR-013 (a
  two-type Pokémon can combine two `2`s into `4`, or a `0.5` and a `0` into
  `0`, etc. — the raw product, not a custom rounding rule).
- When `pokemonTypes` is `null` (table opened without a specific Pokémon
  context, if that path still exists after `/speckit-tasks` wiring
  decisions), the defense column is omitted entirely rather than rendered
  empty — avoids an ambiguous "0 vs. not computed" column.

## `CoverageAnalysisPage` (presentation-only; no domain entity)

**Before**: `CoverageAnalysisPage()` — no parameters, reachable only from
the armador's app-bar action, calls `const CoverageTable()`.

**After**: gains a way to receive the currently-open customization card's
resolved types (exact parameter/navigation shape is an implementation
decision for `/speckit-tasks`; data-model-level requirement is only that
the page can thread a non-null `List<PokemonType>` through to
`CoverageTable.pokemonTypes` when opened from a card context) and wraps its
`body` in a vertical `SingleChildScrollView` (User Story 2, research.md
Decision 6) so the table is always reachable regardless of viewport height.

## `PokemonTypeIcon` (presentation-only; no domain entity)

**Before**: `Image.network(url, height: size, fit: BoxFit.contain, ...)` —
width unconstrained.

**After**: `Image.network(url, width: size, height: size, fit:
BoxFit.contain, ...)` — both dimensions pinned to the same `size` (User
Story 6, research.md Decision 1). Call sites that previously wrapped it in
their own `SizedBox(width: ..., height: ...)` (the customization card) drop
that wrapper as redundant.
