# Graph Report - .  (2026-09-08)

## Corpus Check
- Large corpus: 597 files · ~520.945 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 571 nodes · 1130 edges · 44 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 337 · imports_from: 321 · contains: 257 · method: 130 · calls: 67 · implements: 15 · inherits: 3


## Input Scope
- Requested: all
- Resolved: all (source: cli)
- Included files: 597 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 8 sensitive · 0 missing committed

## Graph Freshness
- Built from Git commit: `7af566e`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `Game` - 43 edges
2. `Generation` - 38 edges
3. `PokemonType` - 32 edges
4. `PokedexEntry` - 27 edges
5. `PokemonStats` - 19 edges
6. `PokedexBrowserComponent` - 18 edges
7. `InMemoryTeamService` - 18 edges
8. `PokedexView` - 17 edges
9. `SelectableForm` - 17 edges
10. `SupportedLanguage` - 15 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (24): getGameCatalog(), selectGame(), Game, generation, TeamBuildingSession, GameCatalogLoadStatus, darmanitanFormResponders(), darmanitanSpeciesFixture() (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (20): getActiveLanguage(), supported, getSupportedLanguages(), selectLanguage(), FLAG_EMOJI_BY_LANGUAGE_CODE, flagEmojiForLanguage(), BrowserDeviceLocaleProviderService, DeviceLocaleProvider (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (22): getPokedexIndex(), getPokemonDetails(), PokedexLoadStatus, GENERATION_ORDER, generationOrdinal(), isNationalDexEligible(), NamedApiResource, NATIONAL_DEX_ELIGIBLE_GAME_IDS (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (16): addPokemonToTeam(), TeamFull, removePokemonFromTeam(), colorForType(), POKEMON_TYPE_COLORS, rgbaForType(), TypeBadgeComponent, RosterReader (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (17): getDefaultMoveset(), getMovepool(), GEN_I_III_GENERATION_IDS, NamedApiResource, PHYSICAL_TYPES_GEN_I_III, PokeApiLocalizedEntry, PokeApiMoveListEntry, PokeApiMoveResource (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (21): DLC_EXCLUSIVE_REGIONAL_SPECIES, EXTRA_ALTERNATE_REGIONAL_SUFFIX_BY_GAME_ID, GENERATION_ORDER, NamedApiResource, NON_COSMETIC_DESPITE_SAME_STATS_VARIETY_IDS, PokeApiFormResource, PokeApiGenerationResource, PokeApiPastTypeEntry (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (10): filterPokedexEntries(), PokedexEntry, generationI, normal, stats, game, PokedexSection, PokedexEntryCardComponent (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (7): fire, generationI, generationIV, grass, stats, entry, PokedexFilterCriteria

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (2): InMemoryTeamService, RosterReader

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (4): AfterViewInit, DoCheck, OnDestroy, PokedexBrowserComponent

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (12): detectDlcParent(), DLC_VERSION_GROUP_OVERRIDES, DlcMatch, GameCatalogRepository, NamedApiResource, NEVER_DLC_VERSION_GROUP_NAMES, PokeApiGameCatalogRepositoryService, PokeApiGenerationResource (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.23
Nodes (4): findStat(), generationOrdinal(), PokeApiPokemonRepositoryService, PokemonRepository

### Community 12 - "Community 12"
Cohesion: 0.19
Nodes (7): FormSelectionModalComponent, form, normal, stats, SelectableForm, fire, stats

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (3): PokedexTypeFilterComponent, TeraTypePickerComponent, PokemonType

### Community 14 - "Community 14"
Cohesion: 0.27
Nodes (2): InMemoryPokedexService, PokedexDetailsReader

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (1): TeamBuilderPage

### Community 16 - "Community 16"
Cohesion: 0.31
Nodes (7): dualEntry(), EntryOverrides, entryWithGenderDifferences(), frostForm(), heatForm(), makeEntry(), rotomEntry()

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (2): GameSelectionReader, InMemoryGameService

### Community 18 - "Community 18"
Cohesion: 0.31
Nodes (2): entry, PokemonStats

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (5): electric, fire, generationIv, ice, stats

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (4): appConfig, routes, TranslocoHttpLoader, TranslocoLoader

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (2): ScreenSize, ViewportService

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (2): ActiveLanguageReader, InMemoryActiveLanguageService

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (4): GENERATION_NAMES, VERSION_GROUPS, VERSION_NAMES, GameCatalogUnavailable

### Community 24 - "Community 24"
Cohesion: 0.43
Nodes (2): MovepoolRepository, PokeApiMovepoolRepositoryService

### Community 25 - "Community 25"
Cohesion: 0.43
Nodes (5): build(), fakeGameSelectionReader(), heatForm(), measureIn200pxCell(), rotomEntry()

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (3): generation, normal, stats

### Community 27 - "Community 27"
Cohesion: 0.40
Nodes (4): PokeApiLocalizedEntry, resolveLocalizedName(), entries, NameEntry

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (4): form, normal, rotomEntry, stats

### Community 29 - "Community 29"
Cohesion: 0.60
Nodes (3): colorForGame(), GAME_COLOR_PALETTE, hashString()

### Community 30 - "Community 30"
Cohesion: 0.40
Nodes (4): angular, boundaries, eslint, tseslint

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (1): PokemonDetailModalComponent

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (1): CosmeticVariant

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (2): logAndRethrow(), TestFailure

### Community 34 - "Community 34"
Cohesion: 0.50
Nodes (1): LoggingService

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (1): AppComponent

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (1): LanguageSelectorPage

### Community 41 - "Community 41"
Cohesion: 1.00
Nodes (2): PokeApiLocalizedEntry, PokeApiNamedLocalizedEntry

### Community 42 - "Community 42"
Cohesion: 1.00
Nodes (1): PokedexUnavailable

### Community 43 - "Community 43"
Cohesion: 1.00
Nodes (1): GameSearchBarComponent

### Community 44 - "Community 44"
Cohesion: 1.00
Nodes (1): NationalDexToggleComponent

### Community 45 - "Community 45"
Cohesion: 1.00
Nodes (1): PokedexSearchBarComponent

### Community 47 - "Community 47"
Cohesion: 1.00
Nodes (1): TeamBuilderTwoPaneLayoutComponent

### Community 48 - "Community 48"
Cohesion: 1.00
Nodes (1): config

## Knowledge Gaps
- **114 isolated node(s):** `eslint`, `tseslint`, `angular`, `boundaries`, `appConfig` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (2 nodes): `InMemoryTeamService`, `RosterReader`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `InMemoryPokedexService`, `PokedexDetailsReader`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `TeamBuilderPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `GameSelectionReader`, `InMemoryGameService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `entry`, `PokemonStats`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `ScreenSize`, `ViewportService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `ActiveLanguageReader`, `InMemoryActiveLanguageService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `MovepoolRepository`, `PokeApiMovepoolRepositoryService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `PokemonDetailModalComponent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `CosmeticVariant`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `logAndRethrow()`, `TestFailure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `LoggingService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `AppComponent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `LanguageSelectorPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `PokeApiLocalizedEntry`, `PokeApiNamedLocalizedEntry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `PokedexUnavailable`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `GameSearchBarComponent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `NationalDexToggleComponent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `PokedexSearchBarComponent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `TeamBuilderTwoPaneLayoutComponent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Game` connect `Community 0` to `Community 4`, `Community 2`, `Community 18`, `Community 26`, `Community 10`, `Community 5`, `Community 6`, `Community 7`, `Community 28`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `logAndRethrow()` connect `Community 33` to `Community 10`, `Community 4`, `Community 2`, `Community 5`, `Community 1`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `Generation` connect `Community 0` to `Community 7`, `Community 4`, `Community 2`, `Community 6`, `Community 18`, `Community 26`, `Community 10`, `Community 5`, `Community 16`, `Community 28`, `Community 25`, `Community 19`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `eslint`, `tseslint`, `angular` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05995975855130785 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07446808510638298 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0841813135985199 - nodes in this community are weakly interconnected._