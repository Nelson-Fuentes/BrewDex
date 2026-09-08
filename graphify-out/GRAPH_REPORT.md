# Graph Report - web  (2026-09-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 745 nodes · 1815 edges · 37 communities (34 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36

## God Nodes (most connected - your core abstractions)
1. `Game` - 72 edges
2. `Generation` - 48 edges
3. `@angular/core` - 45 edges
4. `PokemonType` - 45 edges
5. `@jsverse/transloco` - 41 edges
6. `PokedexEntry` - 41 edges
7. `PokedexView` - 27 edges
8. `PokemonStats` - 27 edges
9. `InMemoryTeamService` - 22 edges
10. `Move` - 20 edges

## Surprising Connections (you probably didn't know these)
- `entry()` --calls--> `PokedexEntry`  [EXTRACTED]
  web/src/pokedex/application/filter-pokedex-entries.spec.ts → web/src/pokemon/domain/entities/pokedex-entry.ts
- `PokedexSection` --references--> `PokedexEntry`  [EXTRACTED]
  web/src/pokedex/presentation/pokedex-browser.component.ts → web/src/pokemon/domain/entities/pokedex-entry.ts
- `pokedexEntryFor()` --calls--> `PokedexEntry`  [EXTRACTED]
  web/src/team/infrastructure/in-memory-team.service.spec.ts → web/src/pokemon/domain/entities/pokedex-entry.ts
- `InMemoryPokedexService` --references--> `Game`  [EXTRACTED]
  web/src/pokedex/infrastructure/in-memory-pokedex.service.ts → web/src/game/domain/entities/game.ts
- `build()` --calls--> `Game`  [EXTRACTED]
  web/src/team/presentation/team-builder.page.spec.ts → web/src/game/domain/entities/game.ts

## Import Cycles
- None detected.

## Communities (37 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (31): getGameCatalog(), selectGame(), Game, generation, TeamBuildingSession, GameCatalogRepository, RosterValidityChecker, PokedexView (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (26): Gender, genderCapability, resolveDisplayGender(), colorForType(), POKEMON_TYPE_COLORS, Component, TypeBadgeComponent, addPokemonToTeam() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (26): DEFAULT_LANGUAGE_CODE, getActiveLanguage(), supported, getSupportedLanguages(), selectLanguage(), ActiveLanguageReader, DeviceLocaleProvider, LanguageCatalogUnavailable (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (24): @angular/core, rxjs, TranslocoHttpLoader, Injectable, GameSelectionReader, GameCatalogLoadStatus, InMemoryGameService, Injectable (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (24): GameCatalogUnavailable, detectDlcParent(), DLC_VERSION_GROUP_OVERRIDES, DlcMatch, NamedApiResource, NEVER_DLC_VERSION_GROUP_NAMES, PokeApiGenerationResource, PokeApiNamedResource (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): getPokedexIndex(), PokedexIndexRepository, PokedexIndexUnavailable, PokedexIndexEntry, GENERATION_ORDER, generationOrdinal(), isNationalDexEligible(), NamedApiResource (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (27): name, private, version, @angular/animations, @angular/cdk, @angular/cli, @angular/common, @angular/compiler (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (16): PokedexEntrySource, CosmeticVariant, DLC_EXCLUSIVE_REGIONAL_SPECIES, GENERATION_ORDER, NamedApiResource, PokeApiFormResource, PokeApiGenerationResource, PokeApiPastTypeEntry (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (13): Generation, makeEntry(), PokedexEntryCardComponent, entry, Component, PokedexEntry, buildEntry(), generationI (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (21): devDependencies, @angular/cli, @angular/compiler-cli, @angular-devkit/build-angular, angular-eslint, @axe-core/playwright, eslint, eslint-import-resolver-typescript (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (16): dependencies, @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.23
Nodes (5): entry, makeEntry(), PokemonType, TeraTypePickerComponent, Component

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (6): Breakpoints, ScreenSize, Injectable, ViewportService, TeamBuilderTwoPaneLayoutComponent, Component

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (8): @angular/forms, @jsverse/transloco, GameSearchBarComponent, Component, GenerationFilterComponent, Component, PokedexSearchBarComponent, Component

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (9): SelectableForm, SelectableFormKind, fire, stats, FormSelectionModalComponent, form, normal, stats (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (7): NationalDexToggleComponent, Component, PokedexSection, PokedexGenerationFilterComponent, Component, PokedexTypeFilterComponent, Component

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (6): PokedexFilterCriteria, build(), form, normal, rotomEntry, stats

### Community 18 - "Community 18"
Cohesion: 0.24
Nodes (7): PokemonStats, entryFor(), game, dualEntry(), EntryOverrides, entryWithGenderDifferences(), makeEntry()

### Community 19 - "Community 19"
Cohesion: 0.27
Nodes (11): options, assets, browser, index, inlineStyleLanguage, outputPath, polyfills, scripts (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (6): @angular/platform-browser, @angular/router, AppComponent, Component, appConfig, routes

### Community 21 - "Community 21"
Cohesion: 0.31
Nodes (3): GameDlc, DlcToggleListComponent, Component

### Community 22 - "Community 22"
Cohesion: 0.31
Nodes (5): GameCardComponent, Component, colorForGame(), GAME_COLOR_PALETTE, hashString()

### Community 23 - "Community 23"
Cohesion: 0.24
Nodes (4): GameSelectionPage, Component, ROSTER_READER, RosterReader

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (8): cli, analytics, packageManager, schematicCollections, newProjectRoot, projects, $schema, version

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (9): build, builder, configurations, defaultConfiguration, development, buildTarget, extractLicenses, optimization (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (9): extract-i18n, lint, test, builder, builder, options, lintFilePatterns, builder (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (9): serve, production, budgets, buildTarget, outputHashing, serviceWorker, builder, configurations (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (7): filterPokedexEntries(), entry(), fire, generationI, generationIV, grass, stats

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (8): web, style, @schematics/angular:component, prefix, projectType, root, schematics, sourceRoot

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (7): angular, boundaries, eslint, tseslint, angular-eslint, eslint-plugin-boundaries, typescript-eslint

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (8): scripts, build, lint, ng, start, test, test:e2e, watch

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (7): Build, Code scaffolding, Development server, Further help, Running end-to-end tests, Running unit tests, Web

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): arrowParens, overrides, printWidth, singleQuote, trailingComma

### Community 35 - "Community 35"
Cohesion: 0.50
Nodes (3): assetGroups, index, $schema

## Knowledge Gaps
- **195 isolated node(s):** `singleQuote`, `printWidth`, `trailingComma`, `arrowParens`, `overrides` (+190 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 322 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@angular/core` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 11`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 20`, `Community 21`, `Community 22`, `Community 23`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `@jsverse/transloco` connect `Community 14` to `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 8`, `Community 11`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 21`, `Community 22`, `Community 23`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Game` connect `Community 0` to `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 11`, `Community 14`, `Community 17`, `Community 18`, `Community 21`, `Community 22`, `Community 23`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `singleQuote`, `printWidth`, `trailingComma` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.051511758118701005 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05031645569620253 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06241519674355495 - nodes in this community are weakly interconnected._