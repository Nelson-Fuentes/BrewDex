# Data Model: Segunda Ronda de Correcciones del Selector de Juego, la Pokédex y el Armador de Equipo

Every entity below either already exists (amended, noted) or is newly
introduced by this feature. Domain entities stay framework-free
(Constitution Principle VI) — every field is a plain Dart value; no
`Image`, `Color`, `IconData`, or Flutter/HTTP type ever appears here.
Presentation-layer resolution (which icon, which network image) lives in
`presentation/`, driven by these plain values.

## Amended: `PokedexEntry` (`domain/team_builder/entities/pokedex_entry.dart`)

- **`pokedexNumber`**: constraint relaxed from `> 0` to `>= 0` (Historia
  1/research.md item 1) — `0` is a legitimate regional number (Victini,
  Unova).
- **`homeSpriteShinyUrl`** (`String?`, new): the HOME-style shiny sprite
  for this entry's resolved variety — same resolution site as
  `homeSpriteUrl` (`other.home.front_shiny`), `null` when unavailable
  (research.md item 13).
- **`genderRate`** (`int`, new, from `pokemon-species.gender_rate`):
  `-1` genderless, `8` always-female, else mixed/always-male — drives
  `Género del Slot`'s default (research.md item 11). Not itself
  presentation text; the presentation layer maps it to a label.
- **`hasGenderDifferences`** (`bool`, new, from
  `pokemon-species.has_gender_differences`): whether picking "female"
  actually changes any sprite for this entry.
- **`homeSpriteFemaleUrl`** / **`homeSpriteShinyFemaleUrl`** (`String?`,
  new): the two extra HOME sprite variants needed once gender is
  selectable — same already-fetched `pokemon` body, no new request.
- **`selectableForms`** (`List<SelectableForm>`, new, default `const
  []`): this species' other template-form varieties, excluding whichever
  one `_selectPrincipalVariety` already resolved as principal (Historia
  10/FR-020). Empty for a species with no other template form.
- **`megaForm`** / **`gigamaxForm`** (`SelectableForm?`, new): populated
  only when that mechanic is available for this species in this game
  (Historia 11/FR-024a/FR-024b), resolved the same
  `is_mega`/`form_name == "gmax"` classification as `selectableForms`
  but kept as separate fields (not mixed into `selectableForms`) because
  they are surfaced as dedicated buttons, never as modal options
  (Clarifications).
- **`cosmeticVariants`** (`List<CosmeticVariant>`, new, default `const
  []`): the resolved principal variety's `pokemon.forms` list, mapped
  1:1, when it has more than one entry (research.md item 12). Empty for
  the overwhelming majority of species (including, correctly, Spinda).

`PokedexEntry.props` grows to include all of the above (Equatable).

## Amended: `PokemonType` (`domain/team_builder/value_objects/pokemon_type.dart`)

- **`numericId`** (`int`, new, from the `type` resource's own `id`
  field, already fetched by `_fetchType`): the PokeAPI-sprites repo keys
  its type icon files by this number, not by the type's string name
  (research.md item 9).

## Amended: `PokedexView` (`domain/team_builder/value_objects/pokedex_view.dart`)

- `isNationalDexEligible` gains the `brilliant-diamond-shining-pearl`
  game-id exception (research.md item 4) — signature unchanged
  (`bool Function(Generation)`), the check just also consults
  `Game.id` now, so its parameter widens from `Generation` to `Game`
  (contracts/pokedex_view_amendment.md documents this as the one
  narrow, justified signature change in this feature — every existing
  caller already has a `Game` in scope).

## New: `SelectableForm` (`domain/team_builder/value_objects/selectable_form.dart`)

A template form, Mega Evolution, or Gigamax/Dinamax variety a species
can be represented as, distinct from its principal/regional-default
variety (Historia 10/11).

| Field | Type | Notes |
|---|---|---|
| `varietyId` | `String` | PokeAPI variety/pokemon name, e.g. `rotom-heat`, `charizard-mega-x`, `charizard-gmax` — this feature's stable identity for "which form" |
| `displayName` | `String` | Localized form name (`pokemon-form.form_names`, English fallback — same pattern as everywhere else) |
| `gameSpriteUrl` | `String?` | This variety's game-specific sprite (FR-021) — shown in the selection modal/buttons, never in the slot itself |
| `homeSpriteUrl` | `String?` | This variety's HOME-style sprite — what the slot actually renders once chosen (FR-024) |
| `homeSpriteShinyUrl` | `String?` | Same, shiny |
| `kind` | `SelectableFormKind` enum: `template`, `mega`, `gigamax` | Drives whether it appears in the FR-020 modal (`template` only) or as a dedicated button (`mega`/`gigamax`, Historia 11) |
| `requiresDlcId` | `String?` | Set only when this variety was resolved as DLC-unlocked (research.md item 6/FR-028) — `null` for a base-game-available form. Purely informational for now (no FR conditions rendering on it beyond "it's an option"); kept so a future feature can gray it out if its DLC gets deactivated without re-fetching. |

Pure value object (`Equatable`), no Flutter/HTTP.

## New: `CosmeticVariant` (`domain/team_builder/value_objects/cosmetic_variant.dart`)

One entry of a `pokemon.forms` list with more than one member (Historia
10/FR-023c) — e.g. one of Vivillon's 20 patterns.

| Field | Type | Notes |
|---|---|---|
| `formId` | `String` | e.g. `vivillon-meadow` |
| `displayName` | `String` | Localized (`pokemon-form.form_names`) |
| `spriteUrl` | `String?` | This variant's own sprite |
| `isDefault` | `bool` | From `pokemon-form.is_default` — the first entry with `isDefault == true` is what a newly-added slot starts with (FR-023c's "variante por defecto"), never a random pick |

## New: `Gender` (`domain/team_builder/value_objects/gender.dart`)

A small closed enum: `male`, `female`, `genderless` — not a `bool`,
because "no control shown" (genderless) is a distinct third state from
either binary choice, and because a raw `bool isFemale` would silently
default to `false`==male in a way that hides the genderless case
(explicit enum makes every call site handle all three, per Principle
III's "clear contracts").

## New/Amended (cross-context): `RosterEntry` replaces the bare
`pokemonId` `String` in a roster list

**This is the one cross-cutting, multi-bounded-context change in this
feature** — flagged explicitly per Constitution Principle VI (a change
this shape needs to be visible, not buried). Both
`domain/game_selection/entities/team_building_session.dart`
(`rosterPokemonIds`) and `presentation/team_builder/cubit/
team_builder_state.dart` (`rosterPokemonIds`) currently type a roster
slot as a plain `String` (species id only) — with nowhere to hang a
chosen form/gender/cosmetic variant/Mega-Gigamax state/shiny flag per
slot (Historia 9–12 need exactly that, and it is inherently a
**slot-occupancy** property, not a species-level one: two different
slots holding the same species, if the app ever allows that — it
already does, per `AddPokemonToTeam`'s doc comment — could each carry
different customization).

`RosterEntry` (new, `domain/team_builder/value_objects/roster_entry.dart`
— placed in `team_builder`, since customization is exclusively that
context's concern; `game_selection` only ever needs the species id out
of it):

| Field | Type | Default | Notes |
|---|---|---|---|
| `pokemonId` | `String` | — | Unchanged meaning — the species identity used for validity checks and roster storage, exactly what today's `String` already was |
| `formVarietyId` | `String?` | `null` | Set when the user picked a non-principal template form (FR-023a) |
| `gender` | `Gender?` | `null` | `null` only for a species with no gender data yet resolved (transient); resolved to `male`/`female`/`genderless` per item 11 as soon as the entry is known |
| `cosmeticVariantId` | `String?` | `null` | `null` = the entry's default variant |
| `megaActive` / `gigamaxActive` | `bool` | `false` | Mutually exclusive — enforced at the point they're toggled (FR-024c), not by the type system, to keep this a plain data holder |
| `isShiny` | `bool` | `false` | FR-025–FR-027 |

`Equatable`, `copyWith`. **Persistence**: `TeamRosterStore`'s contract
(`contracts/team_roster_store_amendment.md`) widens from
`List<String>` to `List<RosterEntry>`, JSON-encoded as a list of small
objects instead of a list of strings — a genuine, versioned storage
schema change (Constitution Principle V: this is called out as a
breaking-format change in Governance terms; the migration is trivial —
a value that fails to parse as the new shape is treated as "nothing
persisted", same as today's existing corrupt-data fallback in
`LocalTeamRosterStore`, so a pre-upgrade roster is simply not carried
forward rather than crashing).

`TeamBuildingSession.rosterPokemonIds` (`game_selection`'s domain)
**stays** `List<String>` — unchanged, on purpose: `game_selection` only
ever needs species ids to reconcile against a new game's obtainable set
(`RosterValidityChecker`), never the customization payload. The
Cubit-level glue (`GameSelectionCubit`) is responsible for projecting
`List<RosterEntry>` ↔ `List<String>` at the one seam where the two
bounded contexts already talk to each other today (`refreshRoster`/
`confirmGameSwitch`), so `game_selection`'s own domain/contracts stay
untouched — no new dependency from `game_selection` onto anything
`team_builder` owns.

## Amended: `TeamSlotView` (`presentation/team_builder/cubit/
team_builder_state.dart`)

- `entry` (`PokedexEntry?`) stays, but now paired with the
  **resolved `RosterEntry`** for that slot (`rosterEntry` field, new) so
  the widget layer can render the chosen form/gender/variant/shiny
  without re-deriving it — `TeamSlot` already reads straight off
  `TeamSlotView`, this is additive.

## Amended: `TeamBuilderCubit.load()` reconciliation (behavioral, no new
entity)

`load()` now filters `roster` down to entries whose `pokemonId` is
present among the freshly-fetched `entries` (or, more precisely, among
every species obtainable in this game — reusing
`PokedexRosterValidityChecker`'s existing definition of "obtainable" so
the two reconciliation paths agree, research.md item 14) and persists
the filtered list back to `TeamRosterStore` before emitting `loaded` —
closing the gap that let a stale, now-invalid roster entry hold a slot
"reserved" after a game switch.

## Amended interaction: tapping an occupied `TeamSlot`

`TeamSlot`'s `onTap` currently removes the occupant immediately
(004-pokedex-team-builder FR-010). Every occupied slot now needs a way
to reach the Personalización de Pokémon card (Historia 9 through 12 —
notably the shiny toggle, FR-025, applies to **every** occupied slot,
not only ones with a form/gender/variant choice) — so tapping an
occupied slot now **opens that card** instead of removing directly; the
card itself carries an explicit "Quitar del equipo" action, so removal
stays one interaction away rather than two. This supersedes
004's tap-to-remove gesture; `contracts/team_slot_interaction.md`
documents the new gesture map (tap → open card; the card's own remove
action → today's `removePokemon(slotIndex)`, unchanged use case).
