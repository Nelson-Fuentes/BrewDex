# Contract: Base stats on `PokedexEntry` / `SelectableForm`

**Amends**: `PokedexEntry` and `SelectableForm` (domain, additive field — see data-model.md), and `PokeApiPokedexRepository` (infrastructure, new parsing of an already-fetched response body).

## Source data

PokeAPI's `pokemon` resource (already fetched in full for the principal variety in `_buildEntry`, and for every other variety in `_classifyOtherVarieties`) carries:

```json
"stats": [
  { "base_stat": 45, "stat": { "name": "hp", "url": "..." } },
  { "base_stat": 49, "stat": { "name": "attack", "url": "..." } },
  { "base_stat": 49, "stat": { "name": "defense", "url": "..." } },
  { "base_stat": 65, "stat": { "name": "special-attack", "url": "..." } },
  { "base_stat": 65, "stat": { "name": "special-defense", "url": "..." } },
  { "base_stat": 45, "stat": { "name": "speed", "url": "..." } }
]
```

## Parsing rule

A new private helper, `_parseStats(List<dynamic> statsJson) → PokemonStats`, maps each entry's `stat.name` to the matching `PokemonStats` field by `base_stat`. All six names are expected to be present (PokeAPI always publishes all six for every `pokemon` resource this app fetches) — a missing name defaults its field to `0` rather than throwing, matching this repository's existing "never throw over a merely-incomplete field" posture (e.g. `genderRate`'s `?? -1` default).

## Consumers

- `PokedexEntry.baseStats` — the principal variety's stats.
- `SelectableForm.baseStats` — that variety's own stats (independent of the principal variety's — e.g. Charizard-Mega-X's stats differ from base Charizard's).
- `resolveSlotStats(entry, rosterEntry)` (new, `slot_sprite_resolution.dart`) — the stats to render for a team slot/customization card, matching whichever form is currently selected (same `_matchedForm` precedence `resolveSlotTypes` already uses; a cosmetic-variant selection falls through to the underlying form/entry's stats, since a cosmetic variant carries no stats of its own in the domain model — consistent with how it already carries no shiny sprite of its own either).
- `PokemonCustomizationCard`'s new "Base Stats" section renders all six via `resolveSlotStats`, recomputed on every rebuild — so a form change updates the shown stats immediately, per `contracts/pokemon_customization_card_reactivity.md`.

## Verification

A repository test fixture with a known `stats` array asserts `PokedexEntry.baseStats`/`SelectableForm.baseStats` match the expected six values; a widget test asserts the customization card shows all six labeled values for a species with resolved stats, and that changing the selected form updates them.
