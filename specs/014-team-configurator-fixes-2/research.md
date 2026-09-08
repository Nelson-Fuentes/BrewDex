# Phase 0 Research: Correcciones de Configurador de Equipo (Tipos, Tarjeta, Legends Z-A y Cobertura)

No `NEEDS CLARIFICATION` markers remain in spec.md, so this phase records the
code-grounded root-cause investigation behind each fix rather than resolving
open unknowns — every decision below is anchored to a specific file/line read
during planning.

## Decision 1 — Pin both dimensions of a type badge, not just height

**Finding**: `PokemonTypeIcon` (`lib/presentation/team_builder/widgets/type_icon_resolution.dart`)
renders its network image as `Image.network(url, height: size, fit: BoxFit.contain, ...)`
— `width` is never set. Inside `team_slot.dart`'s `Wrap` (no width constraint
on its children), a source icon whose natural aspect ratio isn't square
renders wider than `kStandardTypeIconSize` regardless of the constant's
value, which is the root cause behind "los tipos siguen siendo grandes" /
two types not fitting one row on web even though `kStandardTypeIconSize` is
already a small `24.0`. Separately, `pokemon_customization_card.dart` wraps
the *same* `PokemonTypeIcon` in `SizedBox(width: kStandardTypeIconSize,
height: kStandardTypeIconSize)` — an extra width constraint the slot never
gets — which squeezes the card's badge to a narrower rendered width than the
slot's, the root cause behind "en la tarjeta redujiste el paño de los tipos".

**Decision**: Make `PokemonTypeIcon` itself pin `width: size, height: size`
(both axes, one constant), so every call site renders identically without
needing its own wrapping `SizedBox`. Remove the now-redundant `SizedBox` in
`pokemon_customization_card.dart`. This makes slot and card render from one
sizing rule instead of two independently-tuned ones, closing the door on the
two of them drifting apart again (as they just did between `013` and now).

**Alternatives considered**: Keep `height`-only sizing and instead shrink
`kStandardTypeIconSize` further — rejected because it doesn't fix the actual
defect (asymmetric constraints between the two call sites) and would make
the *team slot* — which the user says should stay "the size defined for
slots" as the reference size — smaller than intended just to route around a
card-only bug.

## Decision 2 — Legends Z-A movepool fallback for data-sparse species

**Finding**: `PokeApiMovepoolRepository.fetchMovepool`/`fetchDefaultMoveset`
(`lib/infrastructure/team_builder/pokeapi_movepool_repository.dart`) keep
only moves whose `version_group_details[].version_group.name` equals
`game.id` exactly. Legends Z-A is a very recently released game; PokeAPI's
community-maintained data for its version-group is confirmed incomplete for
at least one species (Feraligatr returns zero matching entries), which is a
plain upstream data gap, not an intentional "Feraligatr can't be used in
this game" rule — Feraligatr is a fully obtainable/usable Pokémon in Legends
Z-A.

**Decision**: When the primary game's version-group filter yields zero
moves for a species, fall back to the closest available game's
`version_group_details` for that same species (e.g. the same generation's
other version-group, or the most recent version-group with non-empty data
for that species) instead of surfacing an empty movepool. Log the fallback
via the existing `developer.log` pattern so a future PokeAPI data fix is
easy to notice and revert. This mirrors FR-004's "or any other Pokémon
affected by the same cause" requirement without hand-listing species.

**Alternatives considered**: Hand-maintain a per-species move override table
for Legends Z-A (rejected — brittle, grows unbounded as more upstream gaps
surface, and duplicates data PokeAPI already has under a nearby
version-group); silently keep the empty movepool and only special-case
Feraligatr (rejected — spec.md's Acceptance Scenario 2 explicitly requires
fixing the *cause*, not just the one reported symptom).

## Decision 3 — Preserve `moveIds` across a Mega/Dinamax toggle

**Finding**: `TeamBuilderCubit.fetchMovepoolForActiveSlot`
(`lib/presentation/team_builder/cubit/team_builder_cubit.dart`) resolves the
variety id to fetch moves for via `resolveSlotVarietyId(entry, rosterEntry)`
(`slot_sprite_resolution.dart`), which returns the **Mega/Gigamax variety's
own id** once `rosterEntry.megaActive`/`gigamaxActive` is true. PokeAPI's
Mega/Gigamax `pokemon` resources carry no independent `moves` list of their
own (a transformed form's learnset lives entirely on the base variety), so
`learnableIds` comes back empty/near-empty right after the toggle, and the
existing "drop any `moveIds` entry no longer in the freshly-resolved
movepool" logic (added for the legitimate case of switching to a *different
selectable form*) wipes out every previously-chosen move as a side effect.

**Decision**: `fetchMovepoolForActiveSlot` fetches the movepool for the
**base** variety id (`entry.pokemonId`) whenever the active slot's Mega or
Gigamax state is active, instead of the Mega/Gigamax variety id — a
Pokémon's Mega Evolution or Dynamax/Gigamax form does not change which
moves it can select in this app's model (base learnset), only its
sprite/types/stats (already handled by `resolveSlotSpriteUrl`/
`resolveSlotTypes`/`resolveSlotStats`, none of which this decision touches).
`resolveSlotVarietyId` itself is left unchanged, since it's still correct
for the "switch to a different selectable form" case that motivated it in
`011-forms-icons-moves` — the movepool call site alone special-cases
Mega/Gigamax to use the base id instead.

**Alternatives considered**: Merge the Mega/Gigamax variety's (near-empty)
`learnableIds` with the base variety's before diffing (rejected — more
moving parts than simply targeting the base variety, and Mega/Gigamax
varieties occasionally carry a stray non-empty `moves` entry upstream that
would then incorrectly be unioned in as always-learnable); stop clearing
`moveIds` at all on movepool refresh (rejected — would silently reintroduce
the original `011` bug where a genuinely-invalid move stays selected after
switching to an unrelated alternate form).

## Decision 4 — Legends Z-A's Mega Evolution is not opt-in DLC

**Finding**: `kMegaEvolutionEnabledGameIds` (`form_availability.dart`)
already lists `legends-za`. But `PokeApiGameCatalogRepository`'s
`_dlcParentVersionGroup` maps PokeAPI's `mega-dimension` version-group to
`legends-za` as an **opt-in DLC**, the same modeling used for genuinely
optional paid expansions (`the-isle-of-armor`, `the-teal-mask`, etc.). Mega
Evolution in Legends Z-A is a base-game, core mechanic, not gated behind any
purchase — so `PokeApiPokedexRepository` only resolving a `megaForm` from
`mega-dimension`'s Pokédex once the user has separately toggled that "DLC"
on (`TeamBuilderView.activeDlcIds`) makes Mega look unavailable by default,
matching the report.

**Decision**: Keep `mega-dimension` in `_dlcParentVersionGroup` (it's still
the correct PokeAPI version-group to source Mega forms from), but treat it
as **always active** for `legends-za` rather than requiring the user to
toggle it — either by defaulting `activeDlcIds` to include it whenever
`game.id == 'legends-za'` on load, or by folding its Pokédex fetch into the
base-game fetch unconditionally for that one game id. Document this as the
one intentional exception to the "DLC is opt-in" rule, so a future
contributor doesn't revert it while fixing an unrelated DLC bug.

**Alternatives considered**: Remove `mega-dimension` from
`_dlcParentVersionGroup` entirely so it behaves as an independent, selectable
"game" (rejected — Mega Dimension isn't a separate purchasable version on
PokeAPI's `version` list the way Isle of Armor is; it would misrepresent it
as its own selectable game in the game-selection screen); widen
`kMegaEvolutionEnabledGameIds`'s meaning to also force the DLC on (rejected
— conflates "which games have the mechanic" with "which version-group its
data comes from", two different existing concerns that should stay
separately named per Principle III).

## Decision 5 — Pre-Fairy types via `pokemon.past_types`

**Finding**: `PokeApiPokedexRepository` (line ~404) reads `pokemon['types']`
directly — PokeAPI's *current*, generation-agnostic type list — with no
generation-aware override. PokeAPI separately exposes `pokemon.past_types`:
a list of `{generation: {name: ...}, types: [...]}` entries recording a
species' type(s) *before* a given generation's games, precisely for cases
like Clefairy/Jigglypuff/Marill/Mr. Mime/Snubbull/Togepi, all Normal (or
Water, for Marill) before Fairy was introduced in Generation VI.

**Decision**: When `pokemon.past_types` contains an entry whose
`generation` is the generation *at which* the type changed and the active
game's generation is earlier than that entry's generation, use that entry's
`types` instead of `pokemon.types`. This reuses the same
`generationOrdinal`/`Generation` comparison already used elsewhere in this
same file for species-introduction gating (line ~78), so no new
generation-comparison helper is introduced.

**Alternatives considered**: Hand-maintain a fixed list of "these species
lose Fairy before Gen VI" (rejected — PokeAPI already publishes exactly this
data field; duplicating it invites drift and misses any species not
explicitly anticipated).

## Decision 6 — Coverage Analysis page needs to scroll vertically

**Finding**: `CoverageAnalysisPage` passes `body: const CoverageTable()`
straight into `AdaptiveScaffold`, whose `Scaffold.body` gives its child
exactly the viewport's remaining height with no scrolling of its own.
`CoverageTable` only wraps its `DataTable` in a *horizontal*
`SingleChildScrollView` (for wide rows) — with 18 type rows (soon 19+
columns wide once the defense column lands), the table's natural height
regularly exceeds a phone or a non-maximized desktop window's viewport,
overflowing past the bottom of the screen. This matches "no aparece la
tabla ... no es visible": the table page renders, but the table itself is
(partially or fully) pushed out of the visible/interactive area.

**Decision**: Wrap `CoverageTable`'s `DataTable` in a vertical
`SingleChildScrollView` as well (nesting the existing horizontal one, the
standard Flutter pattern for a table that can overflow in both axes), so
the whole section is always reachable by scrolling regardless of viewport
height.

**Alternatives considered**: Cap `DataTable` row height / font size instead
(rejected — doesn't scale once the defense-efficacy column, and any future
column, are added; scrolling is the standard, unbounded-content-safe fix).

## Decision 7 — Defense-efficacy column reuses the existing type chart

**Finding**: `type_effectiveness_chart.dart` already encodes the full
18×18 attack/defense multiplier table (used previously for the
now-removed customization-card weaknesses section per `013`). `CoverageTable`
is currently parameter-free by design (`013`'s own doc comment: "later
increments will add further columns ... and take game/roster data as
inputs at that point").

**Decision**: `CoverageTable` gains a `pokemonTypes` parameter (the
currently-displayed card's resolved 1–2 types) and, when non-null, renders
a second `DataColumn` computing, per attacking-type row, the product of
that chart's per-type multiplier against each of `pokemonTypes` — the same
combination rule (multiply each type's individual factor) the removed
weaknesses section already used, so no new combination logic is invented.
`CoverageAnalysisPage`'s navigation is extended to receive those types
from wherever it's opened (the customization card, per spec.md's framing
of "el Pokémon de la tarjeta actualmente mostrada") rather than only the
existing app-bar entry point, which has no notion of "the current card".

**Alternatives considered**: Compute defense efficacy ad hoc in the widget
without going through `type_effectiveness_chart.dart` (rejected — would
duplicate the exact matrix already unit-tested and shipped, violating
Principle IV's "absence of duplicated code").
