# Data Model: Correcciones del Configurador de Equipo y la Pokédex

No new bounded context and no breaking change to an existing type. This document covers the one new value object and the fields/behavior amended on existing types.

## New: `PokemonStats` (domain value object)

`lib/domain/team_builder/value_objects/pokemon_stats.dart`

The six base stats of a Pokémon form (spec.md Assumptions: "las seis estadísticas estándar de combate ... en su valor base"), mirroring `PokemonType`'s shape (plain, `Equatable`, no Flutter/HTTP imports — Constitution Principle VI).

| Field | Type | Notes |
|---|---|---|
| `hp` | `int` | PokeAPI `stat.name == "hp"` |
| `attack` | `int` | `"attack"` |
| `defense` | `int` | `"defense"` |
| `specialAttack` | `int` | `"special-attack"` |
| `specialDefense` | `int` | `"special-defense"` |
| `speed` | `int` | `"speed"` |

Equality/`props`: all six fields (unlike `SelectableForm`, there's no identity concept here — two `PokemonStats` with the same six values are the same stats).

Validation: no field may be negative (`assert`, matching `PokedexEntry.pokedexNumber`'s existing pattern) — PokeAPI never returns a negative `base_stat`, so this is a defensive assertion, not a real branch.

## Amended: `PokedexEntry` (domain entity)

`lib/domain/team_builder/entities/pokedex_entry.dart`

- **New field**: `baseStats` (`PokemonStats`, required) — the principal variety's base stats. Added alongside `typePrimary`/`typeSecondary` in the constructor and `props`, same treatment.
- No other field changes. Purely additive — every existing caller that constructs or reads a `PokedexEntry` without the new field either supplies it (production/infrastructure code, updated as part of this feature) or is a test fixture that will fail to compile until updated (expected and desired: Dart's `required` catches every missed call site at compile time, per Principle III "breaking changes... called out explicitly" — this one is additive to the type's *data*, not to any already-published external contract).

## Amended: `SelectableForm` (domain value object)

`lib/domain/team_builder/value_objects/selectable_form.dart`

- **New field**: `baseStats` (`PokemonStats`, required) — this variety's own base stats, independent of the principal variety's (mirrors how `typePrimary`/`typeSecondary` already work per-form, `007-configurador-equipo-mejoras` Decision 4). A Mega Evolution's stats are usually different from its base form's — this is the whole reason base stats need to be per-form, not just per-species.
- `props`/equality unchanged (`SelectableForm` equality stays by `varietyId` only, per its existing documented rule — a stale `baseStats` on an otherwise-equal form is still considered the same form, same as today's stale-display-name tolerance).

## Amended: `RosterEntry` (domain value object) — no shape change, new default source

`lib/domain/team_builder/value_objects/roster_entry.dart` itself is unchanged. What changes is *who sets* `gender` at add-time:

- **Before**: `AddPokemonToTeam` always creates `RosterEntry(pokemonId: pokemonId, teraType: teraType)` — `gender` stays `null` for every species, including a single-fixed-gender one.
- **After**: `AddPokemonToTeam` additionally resolves the added entry's `genderRate` (already available to the caller the same way `typePrimary` already is, via `state.resolvedEntries[pokemonId]`) and sets `gender: Gender.male` when `genderRate == 0`, `gender: Gender.female` when `genderRate == 8`, else leaves it `null` (both-genders species: user picks; genderless species: stays unset/"sin género"). See research.md Decision 5.

## Amended: `PokeApiPokedexRepository` (infrastructure) — new parsing, no new HTTP calls

- `_buildEntry` reads `pokemonBody['stats']` (already-fetched principal-variety body) into a `PokemonStats` via a new private `_parseStats(List stats)` helper, passed into the returned `PokedexEntry.baseStats`.
- `_classifyOtherVarieties` reads `varietyPokemonBody['stats']` (already-fetched per-variety body) the same way, passed into each constructed `SelectableForm.baseStats`.
- `typeIconUrl` (presentation, not this repository, but documented here since it's the other "read differently from the same source" change) stops branching on `game.generation.id` — see `contracts/official_type_icons.md`.

## Presentation-layer state/behavior (not new domain data, but load-bearing for this feature)

- **`slot_sprite_resolution.dart`**: new `resolveSlotStats(PokedexEntry entry, RosterEntry? rosterEntry) → PokemonStats` — reuses the existing `_matchedForm` helper (same Mega/Gigamax/alternate-form precedence `resolveSlotTypes` already uses) so the stats shown always match whichever form is currently active, cosmetic variants included (a cosmetic variant carries no separate stats in the domain model — same "no shiny counterpart either" limitation `hasShinySprite` already documents for variants — so `resolveSlotStats` falls through to the underlying form/entry's stats for a cosmetic-variant selection, consistent with how types already behave for that case).
- **`TeamBuilderPage._openCustomizationCard`**: no new state, but its *data source* changes from a one-time local snapshot (`state.slots[slotIndex]` read once before `showModalBottomSheet`) to a `BlocBuilder<TeamBuilderCubit, TeamBuilderState>`-driven read on every rebuild while the sheet is open (research.md Decision 4). `activeSlotIndex` (already existing state) is what the `BlocBuilder` keys its lookup on.
