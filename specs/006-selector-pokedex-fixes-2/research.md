# Research: Segunda Ronda de Correcciones del Selector de Juego, la Pokédex y el Armador de Equipo

Every item below was verified against the **live codebase** (`lib/`, as it
stands after `005-selector-pokedex-fixes`'s implementation) and, where the
defect is data-shaped, against **live PokeAPI / PokeAPI-sprites responses**
during planning — same methodology `005-selector-pokedex-fixes`'s
research.md established. Diagnostic Dart scripts that exercised the real
`PokeApiPokedexRepository`/`PokeApiGameCatalogRepository` classes against
the network were written, run, and deleted; they are not part of this
plan's deliverables.

## 1. Historia 1 (P1) — Black/White and Black 2/White 2 never reach the armador: confirmed root cause

**Decision**: Relax `PokedexEntry`'s constructor assertion from
`pokedexNumber > 0` to `pokedexNumber >= 0`
(`lib/domain/team_builder/entities/pokedex_entry.dart:25`).

**Rationale**: Live-verified: PokeAPI's `original-unova` pokedex (Black/
White, `pokedex/8/`) and `updated-unova` pokedex (Black 2/White 2,
`pokedex/9/`) both number **Victini as `entry_number: 0`** — a genuine,
documented in-game quirk (Victini is Unova Dex "#000", a bonus entry
before Snivy at #001). Running the real repository code with
`--enable-asserts` (Dart's default for `flutter run`/`flutter test` debug
builds — the environment developers and CI actually exercise) against the
live API reproduces the exact failure: constructing Victini's
`PokedexEntry` throws `AssertionError` inside `_buildEntry`, caught by
`fetchPokedex`'s generic `catch` and rethrown as `PokedexUnavailable` —
`TeamBuilderPage` then renders its permanent error view instead of the
roster screen for **both** games. In Dart/Flutter release builds asserts
are stripped, so the same defect there instead silently accepts number 0
— but the *debug-mode* failure is what QA/dev builds actually hit, which
matches the report. No other exception surfaced for either game — the
catalog fetch, the DLC-less base-dex fetch, sprite/type resolution, and
sorting all completed cleanly once the assertion was loosened locally
during diagnosis.

**Alternatives considered**:
- Special-casing Victini's number to `1` — rejected: silently
  misrepresents the real in-game numbering (FR-004 requires the *correct*
  regional number, not merely *a* positive one), and would need updating
  if PokeAPI/future games introduce another "#000" bonus entry elsewhere.
- Filtering out `entry_number == 0` — rejected: it would just delete
  Victini from both Pokédexes, contradicting "todos los Pokémon deben
  poder agregarse" implied by the rest of the spec.

## 2. Historia 3 (P3) — X/Y duplicate/misordered numbers: confirmed root cause

**Decision**: X/Y's Kalos Pokédex is not one list — PokeAPI's
`version-group/x-y` resolves to **three** pokedex resources
(`kalos-central` #1–150, `kalos-coastal`, `kalos-mountain`, each
independently numbered from 1, live-verified). `_resolveDexRefs`/the
merge in `PokeApiPokedexRepository.fetchPokedex` currently treats every
resolved pokedex ref as one interchangeable "regional" bucket and keeps
each species' own local `entry_number` — so after the flat merge, three
different species legitimately carry regional number `1`, three carry
`2`, etc., and the final `sort` only reinforces the collision instead of
fixing it. This exactly reproduces the reported "doble número y mal
ordenamiento".

The fix renumbers X/Y's three sub-dexes into one continuous, gap-free,
duplicate-free sequence in the order the app already presents Central →
Coastal → Mountain refs (`kalos-central` first — species order within
each sub-dex is preserved), rather than inventing a new visual grouping:
this satisfies FR-003/FR-004 literally ("sin números duplicados... orden
ascendente") without turning X/Y into a fourth kind of grouped-grid
screen alongside the DLC-grid pattern (Historia 5) — Simplicity
(Principle I): one small, general rule ("offset each subsequent
multi-pokedex ref's numbers past the previous ref's max") fixes X/Y and
protects against the same shape of bug for any future game PokeAPI
models with more than one non-DLC, non-national pokedex resource, with no
per-game special case.

**Alternatives considered**:
- Showing Central/Coastal/Mountain as three separate labeled grids (like
  DLC sections) — rejected: it is a bigger, game-specific UI change the
  spec's FR-003/FR-004 do not ask for (they describe one Pokédex view
  with correct numbers), and it would need its own new user story to be
  in scope (out of bounds for this planning cycle per Principle I).
- Keeping each sub-dex's local number as-is and simply deduplicating
  display — rejected: doesn't fix "mal ordenamiento" and would still
  show three different species labeled "#1".

## 3. Historia 4 (P4) — Gold/Silver, Red/Green (Japan), Blue (Japan) sprites: confirmed root cause

**Decision**: Add a small, adapter-local, hardcoded resolution table
(same established pattern as `_dlcParentVersionGroup`/
`_regionalFormSuffixByGameId`) mapping a `Game.id` that has **no**
directly-matching `sprites.versions[generation][gameId]` bucket to the
bucket key that actually carries its sprites:

| `Game.id` (version-group) | Correct sprite-bucket key | Why |
|---|---|---|
| `gold-silver` | `gold` (representative — see below) | Gen II's bucket is split **per individual version** (`gold`, `silver`, `crystal` — live-verified on `pokemon/1`), not merged under the pair's version-group id; no `gold-silver` bucket exists at all |
| `red-green-japan` | `red-blue` | Japan's original Red/Green release predates PokeAPI's sprite mirror's coverage; live-verified it has no `red-green-japan` bucket, but is visually identical Gen-I engine art to the already-covered `red-blue` bucket |
| `blue-japan` | `red-blue` | Same reasoning — Japan's standalone later Blue release has no dedicated bucket either |

**Rationale**: `_resolveSpriteUrl` currently does
`sprites['versions'][game.generation.id][game.id]['front_default']`,
implicitly assuming a game's PokeAPI version-**group** id always equals
its sprite version-**bucket** key. Live-verified against `pokemon/1`
(Bulbasaur)'s full `sprites.versions` map that this holds for most games
(`red-blue`, `ruby-sapphire`, `firered-leafgreen`, `diamond-pearl`,
`platinum`, `heartgold-soulsilver`, `x-y`, `black-white`,
`ultra-sun-ultra-moon`, `scarlet-violet`, `brilliant-diamond-shining-pearl`
all match their own version-group id directly — no fix needed there) but
**breaks** for the three reported games, which is exactly why only those
three were reported: everywhere else the id already happens to line up.
The current silent fallback to `sprites['front_default']` (the modern
official-artwork sprite) for a missing bucket is what the user sees as
"sprites incorrectos" — technically a valid image, just not that game's
own era-appropriate art. Picking `gold` (rather than `silver`) as Gold/
Silver's representative is an arbitrary-but-documented, deterministic
choice (Principle I: a `Game` already represents a paired release as one
entity with one sprite, same simplification already accepted for every
other paired game whose two versions' sprites are pixel-identical).

**Also discovered, out of this feature's stated scope but same defect
class** (documented here so a future report is fast to diagnose, no code
changes made for these since they're not in spec's FR-005–FR-009):
`black-2-white-2` has no distinct Gen-V bucket either (only `black-white`
exists) and `omega-ruby-alpha-sapphire`'s bucket is spelled
`omegaruby-alphasapphire` (no internal hyphens) — both would read the
same "falls back to default artwork" symptom. The resolution table above
is written as an open, easily-extended map for exactly this reason, but
only the three FR-005–FR-009 rows are populated by this feature per
Principle I (no speculative entries for an unreported defect).

## 4. Historia 6 (P6) — National Dex for Brilliant Diamond/Shining Pearl: confirmed root cause

**Decision**: Add `brilliant-diamond-shining-pearl` as an explicit
exception to `PokedexView.isNationalDexEligible`, alongside (not
replacing) the existing `_nationalDexEligibleGenerationIds` generation-ii
through generation-vii set.

**Rationale**: `isNationalDexEligible` currently gates purely on
`Generation.id`, and `generation-viii` is not in the eligible set at all
(`lib/domain/team_builder/value_objects/pokedex_view.dart:9-22`) — so
**no** 8th-generation game currently offers the toggle, which is correct
for Sword/Shield and Legends Arceus but wrong for BDSP per the spec.
Live-verified `version-group/brilliant-diamond-shining-pearl`:
`generation: "generation-viii"`, `pokedexes: ["original-sinnoh"]`,
`versions: ["brilliant-diamond", "shining-pearl"]` — a completely
ordinary version-group with nothing else distinguishing it from Sword/
Shield's, so a **game-id**-keyed exception (not a broader
generation-viii-wide change, which would wrongly re-enable it for Sword/
Shield/Legends Arceus too) is the correct, minimal fix. The existing
generation-ordinal cutoff scoping (`generationOrdinal`,
`005-selector-pokedex-fixes` FR-010) already correctly reuses without
change once eligibility is granted — `generation-viii`'s ordinal (7) is
already present in `_generationOrder`.

## 5. Historia 5 (P5) — DLC grid separation & FR-011/FR-012 canonical order: mostly already correct, one gap confirmed

**Decision**: No change needed to `_resolveDexRefs`'s species-dedup
order or `TeamBuilderPage`'s per-DLC-section rendering — both already
satisfy FR-010–FR-012 as written. New work is scoped to FR-028/FR-029
only (a DLC unlocking a *new form* of an already-listed species — see
item 6 below) and to regression tests pinning today's already-correct
behavior down so a future refactor can't silently regress it.

**Rationale**: Traced live: `PokeApiGameCatalogRepository` builds each
`Game.dlcs` list by iterating PokeAPI's `version-group?limit=100` results
in listing order, which is (live-verified via each DLC's numeric `id`
field: `the-isle-of-armor`=21, `the-crown-tundra`=22, `the-teal-mask`=26,
`the-indigo-disk`=27, `mega-dimension`=31) already monotonically
increasing — i.e., real-world release order, a data-driven ordering with
**no invented table** (satisfies the Clarifications' "orden canónico...
según los datos del juego" decision for free). `_resolveDexRefs` then
fetches refs in exactly `[base, ...validDlcIds]` order, and
`fetchPokedex`'s species-merge (`rawById`) keeps only the **first-seen**
occurrence per species across that ordered `refs` list — so a species
obtainable via two active DLCs already, today, ends up tagged with
whichever DLC comes first in that canonical order, never duplicated
(FR-012, already correct). `TeamBuilderPage` already renders one labeled
`SliverPadding`+grid **per** `state.game.dlcs` entry present in
`state.dlcVisibleEntriesByDlcId` (`team_builder_page.dart:185-201`), not
a single merged "DLC" bucket — satisfying FR-010/FR-011's "grilla
separada por cada DLC" literally, already.

## 6. Historia 5 (P5, FR-028/FR-029) — a DLC unlocking a form of an already-listed species: new work

**Decision**: When a DLC's pokedex resource lists a species whose base
form (or another DLC's form) already produced a `PokedexEntry`
elsewhere, `_resolveDexRefs`'s per-ref species scan must **not** drop
that DLC's contribution outright (today's first-seen dedup already
avoids a duplicate grid entry — correct for FR-029's "no duplicada") but
must additionally record that this DLC also exposes a
`SelectableForm` for that species (item 8 below), so it appears as a
choice in that species' form-selection modal/card — a **new** signal not
tracked by `_RawEntry`/`PokedexEntry` today; today's code only records
the *number/source* of the first-seen sighting per species; it never
looks at whether a *later* ref (a different DLC, or the base dex if the
species was first seen via a DLC and only later listed in the base
dex — the reverse order matters too, see data-model.md) also lists that
species under a **different underlying `pokemon` variety** (a DLC-only
form). Resolving which varieties are unlocked per (species, active DLC
set) requires cross-referencing each ref's raw `pokemon_species` entries
against `pokemon-species/{id}`'s full `varieties` list (already fetched
once per species in `_buildEntry`) — no new HTTP endpoint, just more use
of data already on hand.

**Rationale**: Live-verified PokeAPI has no field that says "this variety
requires DLC X" directly — varieties are just named
`{species}-{suffix}`, same mechanism as the already-handled regional
forms. The signal this feature needs (does variety V of species S
require the DLC currently being scanned to be *obtainable*, vs. it being
a form obtainable from the base game already) is inferred the same way
`_regionalFormSuffixByGameId` already infers regional-form applicability:
a small, reviewed, adapter-local per-game+DLC table is not viable here
(unlike the ~30-game regional-form table, the number of DLC-unlocked
alternate forms across all games is open-ended and would grow
unboundedly) — instead, data-model.md documents a generic rule:
**a form is "DLC-unlocked" for a species when that variety's own name
suffix does not appear in the base regional dex's raw entries for that
species, but does appear associated with an active DLC's pokedex
fetch.** This stays data-driven (Principle I) with no new hardcoded
per-species table.

## 7. Historia 7 (P7) — game name header: trivial

**Decision**: `TeamBuilderPage`'s `AdaptiveScaffold(title: ...)` currently
hardcodes `l10n.teamBuilderTitle` (a fixed localized string, e.g.
"Armador de Equipo"), never `widget.game.displayName` — despite `Game
game` already being available to `TeamBuilderPage` as a required
constructor parameter. Fix is a same-file, one-line title change (append
or replace with `game.displayName`), no new state, no new port.

## 8. Historia 8 (P8) — collapsible sections: two real gaps, one already satisfied

**Decision**:
- **FR-014 (collapsed by default)**: `CollapsibleFilterSection`'s
  `initiallyExpanded` defaults to `true`
  (`lib/shared/design_system/widgets/collapsible_filter_section.dart:20`)
  — flip the **default** to `false`. Every current call site
  (`GenerationFilter`, `PokedexTypeFilter`) passes no explicit value, so
  they inherit the new default automatically; no call-site changes
  required unless a specific screen has a documented reason to override
  it (none identified).
- **FR-015 (auto-collapse on selection)**: not implemented at all today
  — `CollapsibleFilterSection` owns its `_expanded` bool as purely local
  `State`, with no way for a selection made by its `child` to reach back
  up and collapse it. Needs a narrow, explicit seam: an optional
  `collapseSignal` (e.g. a `Listenable`/`ValueNotifier<int>` bumped by
  the caller right after it forwards a selection to the Cubit) that
  `CollapsibleFilterSection` listens to and collapses on. Kept a "signal"
  rather than lifting `_expanded` state up entirely — Principle I: the
  collapse/expand mechanic itself stays fully local/ephemeral UI state
  (matching its existing doc comment), only the *one-way* "something was
  just selected" event crosses the boundary.
- **FR-016/FR-017 (multi-column web, one-column mobile)**: **correction
  during implementation** — this was assumed satisfied-as-is by the
  existing `Wrap` layout; a widget test written to lock that in instead
  caught a real, previously undiagnosed bug: `_GenerationTile`/`_TypeTile`
  wrap their content in a `Container` with `alignment: Alignment.center`
  and no explicit width. An unconstrained `Container` with `alignment`
  set expands to fill all *available* space to align its child within it
  (a well-known Flutter gotcha), so inside a `Wrap` every tile silently
  claimed its entire row — no two tiles could ever share a row, at any
  width, regardless of how short the labels were. Fixed by wrapping each
  tile's `Container` in `IntrinsicWidth` (pins it to its content's own
  natural width first) **and** introducing `ResponsiveFilterOptions`
  (`shared/design_system/widgets`), a small `LayoutBuilder`-driven
  wrapper reusing the existing `Breakpoints.compact` threshold
  (`002-material-design-ui`) to render a strict single-column `Column`
  below it — needed because short labels ("Fire", "Generation I") fit
  several per row even at a narrow width, and FR-017 requires exactly
  one regardless of content length, not merely "wraps when it doesn't
  fit". Both `GenerationFilter` and `PokedexTypeFilter` now share this
  one widget instead of each hand-rolling the same breakpoint check.

## 9. Historia 9 (P9) — type icons per game/generation

**Decision**: Replace `pokemon_type_icons.dart`'s static
`Map<String, IconData>` (18 bundled Material icons, generation-agnostic)
with a URL-resolving function that fetches from
`github.com/PokeAPI/sprites`' `sprites/types/{generation}/{gameOrGroup}/
{numericTypeId}.png`, rendered the same way `Image.network` already
renders every Pokémon sprite in this codebase — **no new package, no
bundled asset pipeline**, reusing the exact runtime-network-image pattern
already established for `PokedexEntry.spriteUrl`/`homeSpriteUrl`.

**Rationale, live-verified against `api.github.com/repos/PokeAPI/
sprites/contents/sprites/types`**:
- Only `generation-iii` through `generation-ix` have icon folders at all
  (Gen I/II never had an in-game type-icon UI to source art from) —
  confirms FR-019's "cuando no exista un set propio... usar el más
  cercano" is a real, not hypothetical, case for every Gen I/II game.
- Each generation folder's sub-folder names match the **version-group
  id** convention used everywhere else in this codebase almost exactly
  (`firered-leafgreen`, `ruby-sapphire`, `sword-shield`,
  `scarlet-violet`, `brilliant-diamond-shining-pearl`,
  `legends-arceus`...) — so `Game.id`/`Game.generation.id` can key
  straight into this repo's path shape with only a small number of
  known exceptions (documented in data-model.md) needing a lookup table,
  the same established pattern as `_regionalFormSuffixByGameId`.
- Files are named by PokeAPI's **numeric** type id (`10.png` = fire), not
  the type's string name — `PokemonType` (currently `{id, label}`, both
  strings) needs one additive field for this numeric id, resolved for
  free from the `type` resource's own `id` field already fetched by
  `_fetchType` (no new HTTP call).
- Fallback chain for FR-019, in order: (a) exact
  `{generation}/{game.id}` folder, (b) any other folder under the same
  `{generation}` (e.g. a DLC using its base game's icon set), (c) the
  nearest older generation that has a folder at all, (d) the existing
  Material-icon map as the absolute last resort (kept, not deleted) —
  "nunca un ícono roto o ausente" (FR-019) is satisfied structurally,
  not by hoping the network call succeeds.

**Alternatives considered**: Bundling a static copy of every icon as a
Flutter asset — rejected: hundreds of small files across 7 generations
×~15 games ×18-21 types, a real asset-pipeline/pubspec footprint, for
data this codebase already fetches everything else about a Pokémon over
the network at runtime; the live network-image pattern this app already
uses everywhere else is simpler (Principle I) and automatically stays in
sync if PokeAPI/sprites adds a new generation folder later.

## 10. Historia 10 (P10) — form-selection modal: Mega Evolution/Gigamax must be data-driven, not hardcoded

**Decision**: A species' selectable template forms (FR-020) are exactly
its `pokemon-species.varieties` entries whose underlying `pokemon-form`
resource has **`is_mega: false` and `is_battle_only: false`** (excluding
the species' own default/regional-principal variety, already selected by
existing FR-014/015 logic) — no hardcoded "Rotom/Arceus/Deoxys/..." list.
Mega Evolution and Gigamax/Dinamax (Historia 11) are detected the same
data-driven way but kept **out** of this modal per the Clarifications
decision.

**Rationale, live-verified**: `pokemon-species/charizard`'s `varieties`
already lists `charizard-mega-x`, `charizard-mega-y`, and
`charizard-gmax` as plain varieties — structurally indistinguishable
from a regional/template-form variety by name alone. The
`pokemon-form/{name}` resource (already one HTTP request away — no new
endpoint class) exposes exactly the two booleans needed to classify
each: `is_mega` (true only for Mega varieties) and `form_name` (literally
`"gmax"` for Gigantamax varieties — `is_battle_only` alone is `true` for
*both* Mega and Gigamax and therefore insufficient by itself, but
combined with `is_mega`/`form_name` gives an exact partition: Mega
(`is_mega`), Gigamax (`is_battle_only && form_name == "gmax"` or name
ends with `-gmax`), template form (everything else, `is_battle_only:
false`). One documented exception: Eternatus's story-exclusive Dynamax
form is the variety `eternatus-eternamax` — `is_battle_only: true`,
`form_name` is `"eternamax"`, **not** `"gmax"` — data-model.md records
this as excluded from the Gigamax button (it has no in-game "activate
Gigantamax" choice the way regular Gigamax Pokémon do; it is a permanent
one-time story transformation) rather than forcing it into either
FR-020's modal or Historia 11's button incorrectly.

**Alternatives considered**: A hardcoded per-species table of which
Pokémon have Mega/Gigamax forms — rejected outright: hundreds of species
across generations, a maintenance burden with no natural ceiling, when
the `pokemon-form` fields already answer the question generically
(Principle I).

## 11. Historia 10 (P10) — gender control: data-driven default

**Decision**: `pokemon-species.gender_rate` (already fetchable from the
same species body `_buildEntry` already fetches) drives the default:
`gender_rate == -1` → genderless (no control shown, single implicit
value); `gender_rate == 8` (always female) → default "female"; any other
value (including `0`, always male) → default "male", matching the
Clarifications' "macho por defecto, hembra si la especie no tiene macho".
`pokemon-species.has_gender_differences` (already on the same body)
gates whether the control has any visible *effect* on the slot's sprite
— when `false`, PokeAPI's own `front_female`/`front_shiny_female` sprite
fields are simply absent/identical, so the control can still exist for
correctness (a user may still want to record which they caught) without
implying a sprite change.

**Rationale, live-verified**: `pokemon-species/pikachu`:
`has_gender_differences: true`, `gender_rate: 4`; `pokemon/pikachu`'s
`sprites` already carry `front_female`, `front_shiny`,
`front_shiny_female`, and the same four keys again under
`sprites.other.home` — i.e., the **same already-fetched `pokemon` body**
`_resolveHomeSpriteUrl` reads `sprites.other.home.front_default` from
also carries the female/shiny-female HOME variants needed, zero new HTTP
calls.

## 12. Historia 10 (P10) — cosmetic variants: data-driven, and the spec's "Spinda" example does not apply

**Decision**: A species' cosmetic variants (FR-023c) are the
`pokemon.forms` list (a **third** PokeAPI concept, distinct from
`pokemon-species.varieties`) of whichever variety `_selectPrincipalVariety`
already resolves — when that list has more than one entry, the extras are
offered as a variant picker; each `pokemon-form/{name}` carries its own
sprite set for exactly this purpose. **Live-verified this genuinely
covers Vivillon** (20 named forms: `vivillon-meadow`,
`vivillon-icy-snow`, ... `vivillon-poke-ball`, each with its own sprite)
but **does not cover Spinda** — `pokemon/spinda`'s `forms` list has
exactly one entry (`spinda`). PokeAPI does not model Spinda's spot
pattern at all (it is procedurally derived per-individual from a hidden
in-game value with billions of combinations, not a fixed enumerable
set); data-model.md and the tasks this feeds will not build a picker for
Spinda specifically, since there is nothing to enumerate — the spec's
mention of Spinda alongside Vivillon (Historia 10 body text) was
illustrative, not a hard per-species requirement, and FR-023c's actual
text ("una especie con variantes puramente estéticas") is already
species-agnostic and satisfied correctly by this data-driven rule:
Spinda simply has zero extra forms, so it never triggers the picker,
which is the *correct* behavior given what the data source can actually
back.

## 13. Historia 12 (P12) — shiny sprite fields

**Decision**: `front_shiny`/`front_shiny_female` (regular sprite set) and
`other.home.front_shiny`/`other.home.front_shiny_female` (HOME-style,
what a filled slot actually renders per FR-019 from
`005-selector-pokedex-fixes`) are present on the **same already-fetched**
`pokemon` body every other sprite field is already read from — confirmed
live on both Charizard's Mega/Gigamax varieties and Pikachu. No new HTTP
call. `PokedexEntry` gains `homeSpriteShinyUrl`/`homeSpriteShinyFemaleUrl`
fields (data-model.md) alongside the existing `homeSpriteUrl`; FR-026a's
"no mostrar la opción cuando no exista" reduces to a plain `null` check
on the already-resolved field the slot already has in hand — no extra
availability probe.

## 14. Historia 2 (P1→P2 in this plan's story order) — slot not freed after a game switch: confirmed root cause, a pre-existing bug independent of the assertion fix

**Decision**: `TeamBuilderCubit.load()` must reconcile the roster it
reads against the Pokédex it just fetched — dropping (and persisting the
drop of) any `rosterPokemonIds` entry absent from the fetched Pokédex —
instead of trusting `TeamRosterStore`'s contents unconditionally.

**Rationale, traced live in the code (no network needed for this one)**:
`GameSelectionCubit.confirmGameSwitch()` → `SwitchGame.call()` already
computes which roster ids remain valid for the new game
(`RosterValidityChecker.validFor`, backed by
`PokedexRosterValidityChecker`, which itself calls
`PokedexRepository.fetchPokedex` — and therefore was *also* silently
subject to item 1's assertion bug for a switch **into** Black/White or
Black 2/White 2 specifically, an unhandled `PokedexUnavailable` thrown
straight out of `confirmGameSwitch()` with no try/catch around it) — but
that computed, reconciled roster is **only** kept in
`GameSelectionCubit`'s in-memory `state.rosterPokemonIds`. It is never
written to `TeamRosterStore` (only `SelectedGameStore.writeSelectedGameId`
is called). `TeamBuilderCubit`, freshly constructed for the new game by
`_openTeamBuilder`, independently calls
`_teamRosterStore.readRosterPokemonIds()` — reading the **stale,
unreconciled** list straight from storage, completely bypassing
`GameSelectionCubit`'s already-computed reconciliation. A slot whose
`rosterPokemonIds[index]` is now-invalid resolves `entryCache[id]` to
`null` (that id isn't among the newly-fetched entries) — `TeamSlotView
.isEmpty` reads `entry == null`, so the slot *looks* empty — **but**
`rosterPokemonIds.length` still counts that stale index, so
`isTeamFull`/`AddPokemonToTeam`'s "next empty slot" logic (which appends
past `rosterPokemonIds.length`, per `add_pokemon_to_team.dart`) still
treats that position as occupied — reproducing exactly "el slot se
mantiene reservado ... debería estar libre". Centralizing the
reconciliation inside `TeamBuilderCubit.load()` (which already has both
`entries` and `roster` in hand at the same point, for every game, not
just a switch) fixes this at its single actual source of truth, and
naturally also covers the case the spec calls out explicitly (a stale
roster from *before* this fix ships, for *any* previously-mismatched
game/roster combination, per the Edge Cases section) — no separate
"migrate old broken state" code path is needed.

## Summary of confirmed root causes vs. new capability work

| Historia | Nature | Confirmed how |
|---|---|---|
| 1 — B/W, B2/W2 blocked | Pre-existing bug | Live repro with `--enable-asserts` against real PokeAPI data |
| 2 — slot not freed | Pre-existing bug | Traced live in `TeamBuilderCubit`/`GameSelectionCubit`/`SwitchGame` |
| 3 — X/Y duplicate numbers | Pre-existing bug | Live-verified X/Y's 3-pokedex split |
| 4 — classic sprite mismatches | Pre-existing bug | Live-verified `sprites.versions` bucket-key mismatches |
| 5 — DLC grid/order | Already correct + one gap (6) | Live-traced merge/render order; FR-028/029 is new |
| 6 — BDSP National Dex | Pre-existing gap | Live-verified eligibility table omission |
| 7 — game name header | Pre-existing gap | Read `TeamBuilderPage`'s hardcoded title |
| 8 — collapsible sections | Pre-existing gap (2 of 3 sub-items) | Read `CollapsibleFilterSection`/filter widgets |
| 9 — type icons per game | New capability | Live-verified `PokeAPI/sprites` repo shape |
| 10 — form/gender/cosmetic | New capability | Live-verified `pokemon-form`/`pokemon-species` fields |
| 11 — Mega/Gigamax buttons | New capability | Live-verified `is_mega`/`form_name` fields |
| 12 — shiny in slot | New capability | Live-verified sprite fields already in hand |
