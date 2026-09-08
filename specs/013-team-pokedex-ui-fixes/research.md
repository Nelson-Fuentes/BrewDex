# Phase 0 Research: Ajustes de Tamaño de Tipos, Disponibilidad de Formas por Juego, Tarjetas y Análisis de Cobertura

No `[NEEDS CLARIFICATION]` markers remain in spec.md — every decision below was resolved by reading the current implementation rather than by asking the user, since the current code (and its own history, visible in comments) already explains why each surface got this way.

## Decision 1: One shared `kStandardTypeIconSize` constant, not another per-widget multiply

**Decision**: Add a single named constant near `PokemonTypeIcon` (in `type_icon_resolution.dart`), e.g. `const kStandardTypeIconSize = 24.0;`, and point every type-badge call site at it instead of a locally-chosen literal.

**Rationale**: Reading through `010`→`012`'s history shows the same handful of call sites (team slot, Pokédex type filter, customization card) each independently getting a literal size that then got multiplied by 4 in the very next feature, twice (`008`: 48px baseline → `010`: `×`~1 → `012`: `×4` to 192/208/224px). Naming one shared constant breaks that drift: every place that needs "the standard type badge size" reads the same value, so a future adjustment is a one-line change instead of another multi-file hunt. 24px keeps a two-type row comfortably under 60px wide (2×24 + a few px of spacing) — well inside even the narrowest team-slot cell in the existing 3-column grid (`TeamSlotRow._crossAxisCount = 3`) on a small phone, and small enough that the Pokédex type filter's tiles no longer dominate the screen.

**Alternatives considered**:
- *Keep per-widget literals, just shrink each one*: rejected — it's the exact pattern that produced the current oversized state three features in a row; a shared constant is the simpler fix per Principle I.
- *Make the size responsive (different constant for web vs. mobile)*: rejected — FR-001–FR-003 only require that two types fit in one row on web and that mobile's stacked layout has minimal/no gap, both satisfied by one small fixed size; a responsive size would be unjustified complexity for a badge this small.

## Decision 2: Regional-form leak — reconcile persisted form selection against the active game, not against the picker alone

**Decision**: `_classifyOtherVarieties` in `PokeApiPokedexRepository` already excludes every regional-suffixed variety (`-alola`/`-galar`/`-hisui`/`-paldea`, `_regionalFormSuffixByGameId`) from `selectableForms` in every game, unconditionally — so a freshly-opened form-selection modal (`showFormSelectionModal`, fed directly by `entry.selectableForms`) never lists an Alola form in Rojo Fuego/Verde Hoja today. The reported leak is therefore not in the picker itself but in what a *roster entry already carries*: `RosterEntry.formVarietyId` (and the analogous `megaActive`/`gigamaxActive` flags) is persisted per species in `TeamRosterStore`, independent of any game, and nothing currently re-validates it when the active game changes. A team built while Sun/Moon (or any other game whose `_regionalFormSuffixByGameId` entry made an Alola variety principal, or whose Mega/Gigamax allow-list permitted a Mega/Gigamax pick) is active keeps that `formVarietyId`/flag when the *same persisted roster* is reopened under Rojo Fuego/Verde Hoja — `TeamBuilderCubit.load()` re-resolves every `PokedexEntry` for the new game (correctly excluding Alola from `selectableForms` again) but never checks whether the *already-stored* selection is still among the newly-resolved options.

**Decision (fix)**: Extend `TeamBuilderCubit.load()`'s existing reconciliation step — the one that already drops a roster entry whose species is no longer obtainable in the active game (`obtainableIds`/`reconciledRoster`) — with a second pass, after `resolved`/`resolvedEntries` are computed: for each remaining roster entry, if its `formVarietyId` is non-null and does not match any `resolvedEntries[pokemonId]!.selectableForms[*].varietyId`, clear it back to `null` (principal form); if `megaActive`/`gigamaxActive` is `true` but the matching `resolvedEntries[pokemonId]!.megaForm`/`gigamaxForm` is now `null`, clear that flag too. Persist the reconciled roster the same way the existing species-obtainability pass already does (`_teamRosterStore.writeRoster(reconciledRoster)`), so the correction survives the session, not just the current render.

**Rationale**: This is the same shape of fix the codebase already applies one step earlier in the same method for a structurally identical problem ("data selected under one game context is no longer valid under this one") — extending an established pattern rather than inventing a new one (Principle I). It also directly satisfies FR-006's edge case (revert to the base form on an invalidating game switch) without adding any new port method: everything needed (`selectableForms`, `megaForm`, `gigamaxForm`) is already on the `PokedexEntry` that `load()` resolves for every open.

**Alternatives considered**:
- *Validate at render time in `TeamSlot`/`PokemonCustomizationCard` instead of in `load()`*: rejected — it would leave the invalid selection persisted (so it silently reappears on next load, or leaks into any other reader of `RosterEntry`, e.g. a future export feature), and would duplicate the same check in every rendering call site instead of once where the roster is already being reconciled.
- *Re-fetch/verify a single roster entry's form on every game switch via a new dedicated port method*: rejected — `load()` already fetches every roster occupant's full `PokedexEntry` (needed for the Pokédex grid itself); a separate verification call would be a redundant network round trip for data already in hand.

## Decision 3: Pokédex type filter — same standard size, no black background, box hugs the icon

**Decision**: In `PokedexTypeFilter._TypeTile`, replace `Material(color: Colors.black, ...)` with a themed surface color (matching the app's existing filter-tile conventions elsewhere, e.g. `theme.colorScheme.surfaceContainerHigh` with a `primary`-colored selected border, mirroring `PokedexEntryCard`'s own selected/hover treatment) and shrink the tile down from its fixed `BoxConstraints(minHeight: 224)` to wrapping `PokemonTypeIcon(type: type, size: kStandardTypeIconSize)` with only enough padding for the icon to sit comfortably (no separate oversized touch box).

**Rationale**: Directly implements FR-007–FR-009. The black background was a deliberate, explicit design choice from `005-selector-pokedex-fixes` ("Black background / white text regardless of theme brightness ... FR-017"); this feature's explicit instruction supersedes that earlier decision for this tile.

**Alternatives considered**: Keep the black background but only shrink the box — rejected, the request explicitly asks for both changes together, and a shrunk black square would clash visually against the rest of the (already theme-colored) Pokédex filters.

**Documented trade-off**: `002-material-design-ui`'s FR-003/SC-003 established a ≥44dp minimum touch target for interactive elements; at `kStandardTypeIconSize = 24`, a filter tile with only enough padding to hold the icon will read as visibly smaller than 44dp. This feature's FR-009 is an explicit, deliberate instruction from the user overriding that earlier guidance for this specific tile — recorded here rather than silently applied, so a future review can find the reasoning without spelunking history.

## Decision 4: Customization-card image — literal +75% instead of a relative "big enough" guess

**Decision**: Grow the card's sprite box from `96×96` to `168×168` (96 × 1.75 = 168).

**Rationale**: FR-010/SC-004 specify "at least 75% larger" as a literal, verifiable multiplier — matching it exactly keeps the requirement testable by direct measurement instead of eyeballing "bigger."

**Alternatives considered**: A larger round number (e.g. 192, matching the now-removed 192px type icons) — rejected as arbitrary; 168 is the smallest size that satisfies the stated ≥75% floor without overshooting into needing further layout rework of the header/name row above it.

## Decision 5: Remove the weaknesses *section*, keep the weaknesses *calculation*

**Decision**: Delete `_TypeWeaknessTable`/`_WeaknessCell` and their call site (the "Debilidades de tipo" label + section) from `PokemonCustomizationCard`. Keep `typeEffectivenessAgainst`/`TypeEffectivenessChart` (`domain/team_builder/value_objects/type_effectiveness_chart.dart`) untouched.

**Rationale**: FR-012/SC-005 only ask to remove the *visualization* from the card. The underlying calculation is exactly the kind of per-type effectiveness math the Coverage Analysis section (User Story 7, and its future increments per spec.md Assumptions) will need to compute offensive/defensive coverage — deleting it now would mean re-deriving the same formula shortly after. It stays covered by its own existing unit tests, so it is not unreviewed dead code, only temporarily unused by any UI.

**Alternatives considered**: Delete the domain calculation too, re-add it later — rejected as pure churn against Principle I ("simplest design that satisfies the *current* requirement" does not mean discarding correct, tested domain logic the very next planned feature will need).

## Decision 6: Reuse the move-selector's row via a small promoted public widget

**Decision**: Promote `_MoveListTile` (currently private to `move_selection_sheet.dart`) to a public `MoveListTile`, adding one optional `trailing` widget parameter (defaulting to `null`) so `PokemonCustomizationCard`'s filled-move-slot branch can pass its existing "clear" `IconButton` into the same row layout the selector already uses, instead of maintaining a second, slightly-different-looking row (`_MoveSlotTile`'s current "filled" branch).

**Rationale**: Directly satisfies FR-013 ("reutilizando el componente existente si es posible"). `_MoveSlotTile`'s *empty*-slot branch (the dashed "add a move" affordance) is a different affordance than anything the selector has and stays as its own small private widget — only the *filled* row (name/type/PP/power/description) is shared, since that's the part the user identified as visually inconsistent.

**Alternatives considered**: Extract a whole new third widget shared by both files — rejected, `_MoveListTile` already is exactly the target shape; promoting it is strictly simpler than adding a fourth type.

## Decision 7: Sticky footer via a `Column` split, not a `Stack`/`Positioned` overlay

**Decision**: Change `PokemonCustomizationCard.build`'s top-level structure from `SafeArea(child: SingleChildScrollView(child: Padding(child: Column([...everything, RemoveButton]))))` to `SafeArea(child: Column([Expanded(child: SingleChildScrollView(child: Padding(child: Column([...everything except RemoveButton])))), _RemoveButtonFooter()]))` — the scrollable content keeps its own internal padding; the footer gets matching horizontal padding plus its own top/bottom padding so it doesn't look pasted on.

**Rationale**: This is the standard Flutter shape for a "scrollable content + fixed footer" sheet (the same structure a `Scaffold(bottomNavigationBar:)` uses internally) — no `Stack`/`Positioned`/manual scroll-offset tracking needed, so no risk of the footer overlapping content at the scroll extremes (a common `Stack`-based sticky-footer bug). Satisfies FR-014/SC-006.

**Alternatives considered**: `Stack` with a `Positioned(bottom: 0, ...)` button over the scroll view — rejected: it requires either a fixed-height content padding-bottom reservation (brittle if the button's height ever changes) or accepting the button visually overlapping the last pixels of scrolled content; the `Column`/`Expanded` split has neither problem.

## Decision 8: Coverage Analysis — a static first column, reachable as a new page from the armador

**Decision**: Add `CoverageAnalysisPage` (a new page in `presentation/team_builder/pages/`), opened via a new `IconButton` in `TeamBuilderPage`'s `AdaptiveScaffold.actions` (e.g. `Icons.query_stats` or `Icons.table_chart_outlined`), using `Navigator.push`. Its body is `AdaptiveScaffold(title: l10n.coverageAnalysisPageTitle, body: const CoverageTable())`. `CoverageTable` renders a single Flutter `DataTable` with one `DataColumn` (`l10n.coverageAnalysisTypeColumnHeader`, e.g. "Tipo") and one `DataRow` per `kAllPokemonTypes` entry, each cell a plain `Text(type.label)` — no `PokemonTypeIcon`, per FR-016's explicit "texto, no es necesario usar los logos/iconos de tipo." Wrapped in a horizontally-scrolling `SingleChildScrollView` (`scrollDirection: Axis.horizontal`) so any columns added by a future increment never force the page itself to scroll sideways.

**Rationale**: `kAllPokemonTypes` (`presentation/team_builder/widgets/all_pokemon_types.dart`) is already the single source of "every Pokémon type" this app uses (it backs `TeraTypePicker` today) — reusing it avoids inventing a second type catalog. A dedicated page (rather than a new tab inside the existing single-page armador) matches how this app already navigates to a distinct concern (`Navigator.push` from an app-bar action is the same pattern `_openCustomizationCard`/`showFormSelectionModal` already use for other secondary views) without restructuring `TeamBuilderPage`'s existing body into a tabbed shell for a single, currently-static table.

**Alternatives considered**:
- *A tab inside `TeamBuilderPage` (Equipo / Cobertura)*: rejected for this first increment — it would force `AdaptiveScaffold`/`TeamBuilderPage` into a `TabBar` shell ahead of knowing what the fuller Coverage Analysis screen needs (row-per-type-column-per-roster-Pokémon is the likely next increment, per spec.md Assumptions), which the spec explicitly scopes out. A future increment can still promote this into a tab without changing `CoverageTable` itself.
- *A `Table`/`GridView` instead of `DataTable`*: rejected — `DataTable` is a built-in Flutter widget purpose-built for exactly "rows × columns of cells," needs no new dependency, and already handles header styling and horizontal constraints sensibly.
