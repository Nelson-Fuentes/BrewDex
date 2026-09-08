# Research: Armador de Equipo y Pokédex del Juego

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

All Technical Context unknowns are resolved below so no `NEEDS
CLARIFICATION` markers remain before Phase 1. Several items also record
integration decisions with the already-shipped `001-select-game` /
`002-material-design-ui` / `003-select-language` code, since this feature
lands directly on top of seams those features left open on purpose.

## 1. Bounded context shape

- **Decision**: A new `team_builder` bounded context
  (`domain|application|infrastructure|presentation/team_builder/`),
  parallel to `game_selection` and `language_selection`. It depends on
  `game_selection`'s already-public domain types (`Game`, `Generation`,
  `GameDlc`, `TeamBuildingSession`) as its declared cross-context
  contract, and implements the `RosterValidityChecker` port that
  `game_selection` already defined and stubbed for it.
- **Rationale**: `TeamBuildingSession`'s own doc comment already
  earmarks "the future team-building feature" as the owner of roster
  mechanics, and `RosterValidityChecker`/`AlwaysValidRosterChecker` were
  built specifically as a placeholder seam for this feature to fill
  (Constitution Principle VI: bounded contexts communicate through an
  explicit, documented contract — reusing these existing ports/entities
  *is* that contract, not a violation of it).
- **Alternatives considered**: Folding this feature's code into the
  existing `game_selection` context — rejected, "browsing/filtering a
  game's Pokédex and assembling a team" is a distinct concern with its
  own ubiquitous language (Pokédex entry, team slot) from "picking which
  game", and mixing them would make `game_selection` responsible for
  data it does not otherwise need.

## 2. Reusing/relocating the existing DLC toggle UI

- **Decision**: `game_selection`'s existing `DlcToggleList` widget,
  `GameSelectionState.activeDlcIds`, and `GameSelectionCubit.toggleDlc`
  move to `team_builder` (the widget file relocates to
  `presentation/team_builder/widgets/dlc_toggle_list.dart`; the toggle
  state moves into `TeamBuilderState`). They are removed from
  `game_selection`.
- **Rationale**: `001-select-game`'s own spec never requires a DLC
  toggle — it was added ahead of spec in anticipation of this feature,
  on the wrong screen relative to this feature's spec (Historia de
  Usuario 4: the flags belong to the armador/Pokédex screen, not the
  game picker). No test currently covers `toggleDlc`/`DlcToggleList`
  (confirmed by search), so relocating is a same-day, low-risk move, not
  a breaking refactor of tested behavior. Keeping DLC toggle state in
  two places (game selection *and* team builder) would be a duplicated,
  confusing control (Principle I).
- **Alternatives considered**: Leaving the toggle on the game-selection
  screen and having `team_builder` merely read its resulting
  `activeDlcIds` as a one-time seed — rejected, because the spec's
  acceptance scenarios (Historia de Usuario 4) are explicit that the
  flags are offered *when the user opens the armador*, and keeping a
  second, redundant control upstream serves no one once this feature
  ships.

## 3. Wiring the "Continuar" seam to real navigation

- **Decision**: `game_selection_page.dart`'s "Continuar" button, which
  today only shows a placeholder SnackBar
  (`l10n.activeGameSnackbar` — "Team building is coming in a future
  feature"), is changed to `Navigator.push` a `TeamBuilderPage(game:
  state.activeGame!)` when `state.canProceedToTeamBuilding` is true.
- **Rationale**: This is exactly the seam `001-select-game` left for
  this feature; the placeholder string and its accompanying comment
  describe this literally.
- **Alternatives considered**: A named-route/`go_router` navigation
  layer — rejected, the app has no router today (`MaterialApp.home` +
  plain `Navigator.push`, per `main.dart`); introducing one is
  unjustified complexity for a single new destination (Principle I).

## 4. Persisting the in-progress roster (FR-002, spec Assumptions)

- **Decision**: A new `TeamRosterStore` port
  (`domain/team_builder/ports`), implemented by `LocalTeamRosterStore`
  (`infrastructure/team_builder`) via `shared_preferences`, storing the
  roster as a single JSON-encoded list of Pokémon species identifiers
  under one key — the same storage mechanism and granularity as
  `SelectedGameStore` (`001-select-game`, research.md item 2).
- **Rationale**: Consistent with the precedent already set for
  persisting small, single-user, single-device state; introducing
  `Hive`/`Isar` or a backend for a list of at most 6 strings would be
  disproportionate (Principle I).
- **Alternatives considered**: none seriously — this mirrors an
  already-accepted decision in the same codebase.

## 5. Replacing `AlwaysValidRosterChecker`

- **Decision**: `infrastructure/team_builder/pokedex_roster_validity_checker.dart`
  implements the existing `RosterValidityChecker` port for real: a
  roster Pokémon id is valid for a `Game` when it appears in that game's
  regional Pokédex or in any of its DLC Pokédexes (i.e., it is
  obtainable in that specific game version — independent of whatever
  National Dex/DLC *display* toggles happen to be on in the UI at the
  time). It is built on top of the same `PokedexRepository` this feature
  introduces (item 6). The composition root (`app_dependencies.dart`)
  swaps its default from `AlwaysValidRosterChecker` to this
  implementation.
- **Rationale**: `AlwaysValidRosterChecker`'s own doc comment says
  explicitly to replace it "when the team-building bounded context
  lands" and that the port/`SwitchGame` use case do not need to change —
  confirmed by reading `switch_game.dart`, which only depends on the
  `RosterValidityChecker` interface.
- **Alternatives considered**: Checking only against the regional dex
  (ignoring DLC) — rejected, a Pokémon obtainable only through an owned
  DLC is still legitimately obtainable in that game, so treating it as
  invalid would incorrectly strip valid team members on an unrelated
  game switch.

## 6. Mapping PokeAPI data to Pokédex entries

- **Decision**: For a given `Game` (a PokeAPI `version-group`) and the
  active view:
  - **Regional**: `GET /api/v2/version-group/{id}` → its `pokedexes[]`
    refs → `GET /api/v2/pokedex/{name}` per ref → `pokemon_entries[]`
    (`entry_number` + species ref) — a game's regional dex may span more
    than one `pokedex` resource (e.g. two-region games); all are merged.
  - **National**: `GET /api/v2/pokedex/national` → its
    `pokemon_entries[]`, used instead of the regional ones when the
    National Dex toggle is on (numbering and list both come from this
    single resource — see item 7).
  - **DLC**: each active `GameDlc.id` is itself a `version-group` name
    (already established by `PokeApiGameCatalogRepository`'s DLC
    mapping) — `GET /api/v2/version-group/{dlcId}` → its own
    `pokedexes[]` → same resolution as regional, merged in on top of
    whichever base list (regional or national) is active.
  - **Per-species detail**: `GET /api/v2/pokemon-species/{id}` for the
    localized display name (`names[]`, same locale-resolution/fallback
    pattern as `PokeApiGameCatalogRepository`) and introduction
    generation (`generation`, FR-013); `GET /api/v2/pokemon/{id}` for
    ordered `types[]` (type 1/2, FR-012) and `sprites` (item 8).
- **Rationale**: This is the PokeAPI shape that already matches the
  spec's own vocabulary (regional vs. national Pokédex, DLC as its own
  version-group) — no custom grouping/merging scheme has to be invented,
  consistent with the precedent set in `001-select-game` research.md
  item 5.
- **Alternatives considered**: Deriving "obtainable in this game" from
  each `pokemon`'s own `game_indices`/`held_items` fields instead of the
  `pokedex` resource — rejected, far more requests (one path per
  Pokémon) for the same information the `pokedex` resource already
  aggregates in one call per dex.

## 7. Regional vs. National numbering when toggled

- **Decision**: Activating the National Dex toggle replaces the
  regional list and numbering outright with the national Pokédex's list
  and numbering (`entry_number` from `GET /api/v2/pokedex/national`) —
  it does not merge/show both numbering schemes side by side.
- **Rationale**: Matches how the actual games' in-Pokédex "Local/National"
  toggle behaves (a well-known, unambiguous convention the user's own
  spec explicitly referenced), and is also simply what the `national`
  `pokedex` resource already *is* — a complete, self-contained,
  nationally-numbered list; no merging logic is needed at all.
- **Alternatives considered**: Keeping regional numbers for
  regionally-present species and only appending nationally-numbered
  "extra" entries — rejected as a bespoke scheme not asked for by the
  spec and not how the reference games behave.

## 8. Type modeling

- **Decision**: A small `PokemonType` value object (`{id, label}`) in
  `domain/team_builder/value_objects`, structurally identical in shape
  to `Generation` — sourced from each Pokémon's `types[]` entries
  (`GET /api/v2/pokemon/{id}`), with the display label localized the
  same way `Generation.label` already is (names resolved per active
  language, falling back to English).
- **Rationale**: Consistent, already-proven pattern in this codebase
  (`Generation`) for a small, stable, source-provided enumeration that
  needs a localized label; avoids hand-maintaining an 18-entry enum with
  its own translation table when PokeAPI already exposes localized type
  names.
- **Alternatives considered**: A hardcoded Dart `enum` for the 18 types —
  rejected, would require this feature to hand-maintain localized labels
  for every supported language instead of resolving them the same way
  every other localized string in the app already is.

## 9. Sprite resolution per game (FR-004, FR-005)

- **Decision**: Resolve, in order, the first available of: (1)
  `sprites.versions.{generation}.{gameVersionKey}.front_default` when
  PokeAPI publishes a per-version sprite for that game (only populated
  for Generation I–V games), (2) `sprites.front_default` (the
  species' modern default sprite) otherwise. When neither is present,
  the domain returns `null` and the presentation layer renders the
  bundled placeholder image required by FR-005.
- **Rationale**: PokeAPI only publishes historical per-version sprites
  up to Generation V; Generation VI+ games have no `versions.*` entry to
  read. Falling back to the species' modern default sprite is the
  closest available approximation to "the sprite for that game" the
  data source can offer, and still satisfies FR-004/FR-005 (a real,
  correct-looking sprite is shown, with a clear placeholder only for the
  genuinely-missing case).
- **Alternatives considered**: Only ever showing `front_default` and
  ignoring per-version sprites — rejected, it would ignore real
  game-specific sprite data PokeAPI does provide for older games, which
  the spec explicitly asks for ("sprite correspondiente a ese juego").

## 10. State management, HTTP client, testing tools

- **Decision**: Same stack as `001-select-game`/`003-select-language` —
  `flutter_bloc` (`TeamBuilderCubit`), `http` (new
  `PokeApiPokedexRepository` adapter, reusing the existing
  `http.Client`/base-URL pattern), `equatable` (new domain
  entities/value objects), `flutter_test`/`bloc_test`/`mocktail`/
  `integration_test` for the corresponding layers.
- **Rationale**: No new requirement in the spec calls for a different
  tool; reusing the existing stack avoids adding a dependency the
  project doesn't already carry (Principle I) and keeps this feature's
  testing approach consistent with the rest of the app.
- **Alternatives considered**: None re-evaluated — same reasoning as
  `001-select-game` research.md items 3, 4, 7 applies unchanged.

## 11. Filtering strategy (FR-011–FR-015)

- **Decision**: `GetPokedex` fetches the full entry list for the
  currently active view (regional/national × active DLCs) over the
  network; name/type/generation filters (and their AND-combination) are
  applied client-side by a pure `FilterPokedexEntries` use case over the
  already-fetched list, preserving its ascending-by-number order (FR-006)
  since filtering only ever removes entries, never reorders them.
  Changing the National Dex/DLC toggles re-invokes `GetPokedex` (a new
  network fetch), since those change *which* underlying dataset is in
  play, not just which subset of it is shown.
- **Rationale**: Directly mirrors the proven approach from
  `001-select-game` research.md item 6 (fetch full catalog, filter
  client-side) at the scale of one game's Pokédex (at most a few hundred
  entries) — cheap enough that no server-side filtering/pagination is
  justified.
- **Alternatives considered**: Re-fetching from the network on every
  keystroke/filter change — rejected, unnecessary network traffic and
  latency for filtering an already-fetched, bounded list.

## Outcome

All Technical Context fields are resolved; no `NEEDS CLARIFICATION`
markers remain. Proceeding to Phase 1 design.
