---

description: "Task list template for feature implementation"
---

# Tasks: Migración de BrewDex a Angular

**Input**: Design documents from `/specs/017-migracion-angular/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidas — la Constitución (Principio II, Test-First Development) exige tests antes de la implementación para lógica de negocio e interfaces públicas; cada tarea de test debe fallar antes de escribir su implementación.

**Organization**: Las tareas están agrupadas por módulo (`language`, `game`, `pokemon`, `pokedex`, `team`, `shared` — [research.md](./research.md) Decisión 11) y, dentro de cada fase, por User Story de [spec.md](./spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: A qué User Story pertenece (US1, US2) — ausente en Setup/Foundational/Polish
- Cada descripción incluye la ruta de archivo exacta bajo `web/`

## Path Conventions

Proyecto Angular único en `web/` (ver [plan.md](./plan.md) "Project Structure"). Todas las rutas de abajo son relativas a la raíz del repo, ya con el prefijo `web/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Retirar por completo el código Flutter existente y dejar el repositorio listo para inicializar el workspace Angular y las herramientas comunes a todos los módulos.

- [X] T001 Eliminar el árbol Flutter completo del repositorio (`lib/`, `test/`, `integration_test/`, `android/`, `ios/`, `pubspec.yaml`, `pubspec.lock`, `analysis_options.yaml`, `l10n.yaml`, `devtools_options.yaml`, `.metadata`, `.flutter-plugins-dependencies`, `brewdex.iml`, `build/`) — FR-021, corrección explícita del usuario: no hay coexistencia ni validación previa de Angular, se borra ya al empezar. También se eliminaron `web/` (scaffold del target web de Flutter), `.dart_tool/`, `tool/` y `.idea/`, no previstos en el plan pero igualmente específicos de Flutter/Dart.
- [X] T002 Actualizar `README.md` en la raíz del repo para describir el flujo Angular (`cd web && npm start`) en vez de las instrucciones de Flutter ya eliminadas (depende de T001)
- [X] T003 Crear el workspace Angular 18 standalone (`ng new web --routing --style=scss --ssr=false --skip-git`) y los directorios de módulo vacíos `web/src/{language,game,pokemon,pokedex,team,shared}/{domain,application,infrastructure,presentation}` per [plan.md](./plan.md) "Project Structure"
- [X] T004 [P] Agregar Angular Material, Angular CDK y `@angular/pwa` al proyecto (`ng add @angular/material`, `ng add @angular/pwa`) en `web/`
- [X] T005 [P] Agregar `@jsverse/transloco` y su schematic de inicialización en `web/` ([research.md](./research.md) Decisión 3)
- [X] T006 [P] Configurar ESLint + `angular-eslint` + Prettier + una regla de import-boundaries (`eslint-plugin-boundaries@4`, pinned tras incompatibilidad de config con la v7 recién publicada) que impide que el `domain/`/`application/` de un módulo importe `infrastructure/`/`presentation/` de otro módulo, en `web/eslint.config.js` ([research.md](./research.md) Decisión 11, Constitución Principio VI) — `npx ng lint` verificado en verde en su momento, pero **la regla no se aplicaba de verdad hasta T094** (faltaba `import/resolver`; ver research.md Decisión 18)
- [X] T007 [P] Agregar Playwright (pinned a 1.47.0 por compatibilidad con Node 18 del entorno) y `@axe-core/playwright` como devDependencies y crear `web/playwright.config.ts` + `web/e2e/`
- [X] T008 [P] Configurar el tema Angular Material M3 (semilla `deepPurple` #673AB7, variantes claro/oscuro vía `prefers-color-scheme`, radio de esquina 16px) en `web/src/shared/design-system/theme/m3-theme.scss` + `web/src/styles.scss` ([research.md](./research.md) Decisión 8) — `ng build` verificado en verde
- [X] T009 [P] Crear `Breakpoints`/`ScreenSize` (función pura, sin Angular, con test unitario) en `web/src/shared/design-system/breakpoints.ts` per [contracts/responsive-layout.md](./contracts/responsive-layout.md)
- [X] T010 [P] Crear los archivos base de i18n para Transloco (`en.json`/`es.json` completos, `fr.json`/`de.json`/`it.json`/`ja.json`/`ko.json`/`zh.json` con fallback a inglés vía `missingHandler`) en `web/public/i18n/` (ubicación real de assets estáticos servibles, ajustada desde `shared/i18n/` del árbol ilustrativo de plan.md) + `fallbackLang`/`missingHandler` en `web/src/app/app.config.ts` (FR-018)
- [X] T011 [P] Crear `LoggingService` y el helper `http-error-mapping.ts` (mensajes de error claros + reintento, FR-017/FR-019) en `web/src/shared/logging/`, con test unitario

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura transversal que TODAS las User Stories necesitan antes de poder implementarse.

**⚠️ CRITICAL**: Ninguna User Story empieza hasta que esta fase esté completa.

- [X] T012 Configurar los providers raíz (`HttpClient`, Transloco, Angular Material, `provideServiceWorker`) en `web/src/app/app.config.ts`
- [X] T013 Configurar `web/ngsw-config.json` (solo `assetGroups` para el app shell + `/i18n/**`, sin `dataGroups` — [research.md](./research.md) Decisión 6, FR-015) y `web/public/manifest.webmanifest` (nombre "BrewDex", tema, íconos, instalable — FR-023)
- [X] T014 [P] Implementar `ViewportService` (envuelve `BreakpointObserver` de Angular CDK) per [contracts/responsive-layout.md](./contracts/responsive-layout.md) en `web/src/shared/design-system/viewport.service.ts`, con test unitario
- [X] T015 [P] Crear el helper `resolveLocalizedName` (resolución de nombre/texto localizado con fallback a inglés, FR-018) en `web/src/shared/pokeapi/resolve-localized-name.ts`, reutilizable por los adaptadores de `language`/`game`/`pokemon`, con test unitario
- [X] T016 Crear el esqueleto de rutas (placeholder, redirect a `/idioma`) en `web/src/app/app.routes.ts` — las rutas reales se conectan en T045 (US1) y T090 (US2) cuando las páginas correspondientes existan

**Checkpoint**: Fundación lista — las User Stories pueden empezar.

---

## Phase 3: User Story 1 - Elegir idioma y juego al entrar (Priority: P1) 🎯 MVP

**Goal**: Al abrir la app, la persona ve el selector de idioma con una preselección razonable, puede elegir su idioma, y luego elegir un juego (con búsqueda/filtro por generación) y activar sus DLC — todo en memoria, sin ningún almacenamiento (FR-002–FR-007, FR-015).

**Independent Test**: Abrir la app, elegir un idioma de la lista, elegir un juego (filtrando/buscando), activar un DLC — todo sin llegar al constructor de equipo (spec.md, User Story 1).

### Módulo `language`

- [X] T017 [P] [US1] Test unitario de igualdad de `SupportedLanguage` en `web/src/language/domain/value-objects/supported-language.spec.ts`
- [X] T018 [P] [US1] Crear el value object `SupportedLanguage` en `web/src/language/domain/value-objects/supported-language.ts`
- [X] T019 [P] [US1] Definir los puertos `SupportedLanguageCatalog`, `DeviceLocaleProvider`, `ActiveLanguageReader` en `web/src/language/domain/ports/` per [contracts/language-catalog.md](./contracts/language-catalog.md)
- [X] T020 [P] [US1] Tests unitarios de `GetSupportedLanguages`, `GetActiveLanguage` (resolución de default FR-003) y `SelectLanguage` en `web/src/language/application/*.spec.ts`
- [X] T021 [US1] Implementar el caso de uso `GetSupportedLanguages` en `web/src/language/application/get-supported-languages.ts` (depende de T019-T020)
- [X] T022 [US1] Implementar el caso de uso `GetActiveLanguage` (idioma del dispositivo si está soportado, si no default — FR-003) en `web/src/language/application/get-active-language.ts` (depende de T019-T020)
- [X] T023 [US1] Implementar el caso de uso `SelectLanguage` en `web/src/language/application/select-language.ts` (depende de T019-T020)
- [X] T024 [P] [US1] Test unitario de `PokeApiSupportedLanguageCatalogService` — curación explícita a los 8 idiomas de FR-002 con autónimos hand-maintained, no solo `official: true` (research.md Decisión 14, hallazgo verificado en vivo contra PokeAPI) en `web/src/language/infrastructure/pokeapi-supported-language-catalog.service.spec.ts`
- [X] T025 [US1] Implementar `PokeApiSupportedLanguageCatalogService` en `web/src/language/infrastructure/pokeapi-supported-language-catalog.service.ts` (depende de T024)
- [X] T026 [P] [US1] Implementar `BrowserDeviceLocaleProviderService` (colapsa cualquier variante de chino a `zh`, resuelve subtag base de `navigator.language`) en `web/src/language/infrastructure/browser-device-locale-provider.service.ts`, con test unitario
- [X] T027 [US1] Implementar `InMemoryActiveLanguageService` + `LanguageStore` (signals `status`/`supportedLanguages`/`activeLanguageCode`, sin ningún almacenamiento — FR-015) en `web/src/language/infrastructure/in-memory-active-language.service.ts` per [contracts/language-catalog.md](./contracts/language-catalog.md) (depende de T021-T023), con test unitario
- [X] T028 [P] [US1] Construir `LanguageOptionTile` en `web/src/language/presentation/language-option-tile.component.ts`, con test unitario
- [X] T029 [US1] Construir `LanguageSelectorPage` (lista + preselección FR-003, cambio inmediato de idioma FR-003, estados loading/error/ready) en `web/src/language/presentation/language-selector.page.ts` (depende de T027, T028), con test unitario. La sincronización idioma↔Transloco se resolvió en `web/src/app/app.component.ts` (raíz de composición) para no repetirla en cada página.

### Módulo `game`

- [X] T030 [P] [US1] Tests unitarios de igualdad de `Generation`, `GameDlc` y `Game` en `web/src/game/domain/value-objects/generation.spec.ts`, `game-dlc.spec.ts` y `web/src/game/domain/entities/game.spec.ts`
- [X] T031 [P] [US1] Crear los value objects `Generation`, `GameDlc` en `web/src/game/domain/value-objects/`
- [X] T032 [P] [US1] Crear las entidades `Game`, `TeamBuildingSession` en `web/src/game/domain/entities/`
- [X] T033 [P] [US1] Definir los puertos `GameCatalogRepository`, `RosterValidityChecker` en `web/src/game/domain/ports/` per [contracts/game-catalog.md](./contracts/game-catalog.md)
- [X] T034 [P] [US1] Tests unitarios de `GetGameCatalog` y `SelectGame` en `web/src/game/application/*.spec.ts`
- [X] T035 [US1] Implementar el caso de uso `GetGameCatalog` en `web/src/game/application/get-game-catalog.ts` (depende de T031-T034)
- [X] T036 [US1] Implementar el caso de uso `SelectGame` (FR-007) en `web/src/game/application/select-game.ts` (depende de T033-T034)
- [X] T037 [P] [US1] Test unitario de `PokeApiGameCatalogRepositoryService` — un `version-group` de PokeAPI ya es la unidad "lanzamiento conjunto = un juego" (FR-005 sin etapa de colapso aparte); detección de DLC por heurística estructural de nombres de versión, no un mapa fijo, verificada en vivo contra PokeAPI (research.md, hallazgo junto a Decisión 4) en `web/src/game/infrastructure/pokeapi-game-catalog-repository.service.spec.ts`
- [X] T038 [US1] Implementar `PokeApiGameCatalogRepositoryService` en `web/src/game/infrastructure/pokeapi-game-catalog-repository.service.ts` (depende de T037, T015) — excluye version-groups sin Pokédex propia (spin-offs Colosseum/XD)
- [X] T039 [US1] Implementar `GameStore` (signals `status`/`catalog`/`activeGame`/`activeDlcIds`, recarga si cambia el idioma activo, sin ningún almacenamiento — FR-015) en `web/src/game/infrastructure/in-memory-game.service.ts` per [contracts/game-catalog.md](./contracts/game-catalog.md) (depende de T035-T036), con test unitario. Requirió un `InjectionToken` cross-módulo (`shared/tokens/active-language-reader.token.ts`) para inyectar `ActiveLanguageReader` sin romper el import-boundary — cableado en `app.config.ts`.
- [X] T040 [P] [US1] Construir `GameCard` en `web/src/game/presentation/game-card.component.ts`, con test unitario
- [X] T041 [P] [US1] Construir `GameSearchBar` (búsqueda por nombre, FR-004) en `web/src/game/presentation/game-search-bar.component.ts`, con test unitario
- [X] T042 [P] [US1] Construir `GenerationFilter` (filtro por generación, FR-004) en `web/src/game/presentation/generation-filter.component.ts`, con test unitario
- [X] T043 [P] [US1] Construir `DlcToggleList` (activar/desactivar DLC del juego elegido, FR-006 — vive en `game/presentation`, no en `pokedex/presentation` como preveía el árbol ilustrativo de plan.md, para que la User Story 1 sea demostrable de punta a punta sin necesitar el módulo `pokedex`) en `web/src/game/presentation/dlc-toggle-list.component.ts`, con test unitario
- [X] T044 [US1] Construir `GameSelectionPage` (filtrado en cliente por nombre/generación, grid de `GameCard`, DLC del juego activo, botón continuar) en `web/src/game/presentation/game-selection.page.ts` (depende de T039-T043), con test unitario

### Integración de User Story 1

- [X] T045 [US1] Conectar la navegación `/idioma` → `/juego` en `web/src/app/app.routes.ts` (depende de T029, T044)
- [X] T046 [US1] Aplicar la pasada de accesibilidad WCAG 2.1 AA (`aria-pressed` en selección, `role="status"`/`aria-live="polite"` en estados de carga/error, `aria-label` en íconos) a los componentes de `language/presentation` y `game/presentation` (FR-024)
- [X] T047 [P] [US1] Test Playwright de extremo a extremo cubriendo los 4 escenarios de aceptación de User Story 1 + auditoría `@axe-core/playwright` en `web/e2e/user-story-1.spec.ts` (depende de T045-T046) — **corrido contra un `ng serve` real y PokeAPI en vivo: 3/3 verde, 0 violaciones WCAG 2A/2AA**

**Checkpoint**: ✅ User Story 1 completa, verificada de punta a punta (unitarios + build + lint + e2e contra PokeAPI real) y demostrable de forma independiente (idioma + juego + DLC, sin persistencia).

---

## Phase 4: User Story 2 - Construir un equipo de hasta 6 Pokémon (Priority: P1)

**Goal**: Con un juego ya elegido, navegar su Pokédex (filtrable), agregar hasta 6 Pokémon al equipo, elegir forma/variante/tera, y personalizar el moveset (con default sugerido) — todo en memoria (FR-008–FR-016).

**Independent Test**: Con un juego ya seleccionado (User Story 1), buscar/filtrar en la Pokédex, agregar Pokémon hasta llenar 6 slots, intentar un 7º (rechazado), elegir una forma, reemplazar un movimiento, quitar un Pokémon (spec.md, User Story 2).

### Módulo `pokemon`

- [X] T048 [P] [US2] Tests unitarios de `PokemonType`, `PokemonStats`, `Gender`, `SelectableForm`, `CosmeticVariant` en `web/src/pokemon/domain/value-objects/*.spec.ts`
- [X] T049 [P] [US2] Crear los value objects `PokemonType`, `PokemonStats`, `Gender`, `SelectableForm`, `CosmeticVariant` en `web/src/pokemon/domain/value-objects/`
- [X] T050 [P] [US2] Test unitario de `Move`, incluyendo `damageClass` y la regla histórica Gen. I-III (tipo→clase) per [data-model.md](./data-model.md) en `web/src/pokemon/domain/value-objects/move.spec.ts`
- [X] T051 [P] [US2] Crear el value object `Move` (con `damageClass: 'physical' | 'special' | 'status'`) en `web/src/pokemon/domain/value-objects/move.ts`
- [X] T052 [P] [US2] Test unitario de la entidad `PokedexEntry` en `web/src/pokemon/domain/entities/pokedex-entry.spec.ts`
- [X] T053 [P] [US2] Crear la entidad `PokedexEntry` en `web/src/pokemon/domain/entities/pokedex-entry.ts`
- [X] T054 [P] [US2] Definir los puertos `PokemonRepository`, `MovepoolRepository` en `web/src/pokemon/domain/ports/` per [contracts/pokemon.md](./contracts/pokemon.md) y [contracts/movepool.md](./contracts/movepool.md)
- [X] T055 [P] [US2] Tests unitarios de `GetPokemonDetails`, `GetMovepool`, `GetDefaultMoveset` en `web/src/pokemon/application/*.spec.ts`
- [X] T056 [US2] Implementar el caso de uso `GetPokemonDetails` en `web/src/pokemon/application/get-pokemon-details.ts` (depende de T054-T055)
- [X] T057 [US2] Implementar el caso de uso `GetMovepool` en `web/src/pokemon/application/get-movepool.ts` (depende de T054-T055)
- [X] T058 [US2] Implementar el caso de uso `GetDefaultMoveset` (moveset sugerido, FR-014) en `web/src/pokemon/application/get-default-moveset.ts` (depende de T054-T055)
- [X] T059 [P] [US2] Test unitario de `PokeApiPokemonRepositoryService` (mapa de sufijo de forma regional restaurado de research.md Decisión 4, resolución de variedad principal, pokedexNumber vía `pokedex_numbers`) en `web/src/pokemon/infrastructure/pokeapi-pokemon-repository.service.spec.ts`
- [X] T060 [US2] Implementar `PokeApiPokemonRepositoryService` en `web/src/pokemon/infrastructure/pokeapi-pokemon-repository.service.ts` (depende de T059, T015) — Mega/Gigamax detectados vía `pokemon-form.is_mega`/`form_name`, pero **sin acotar por juego todavía** (deuda documentada en research.md Decisión 16)
- [X] T061 [P] [US2] Test unitario de `PokeApiMovepoolRepositoryService`, incluyendo la tabla tipo→clase de Gen. I-III per [research.md](./research.md) Decisión 13 en `web/src/pokemon/infrastructure/pokeapi-movepool-repository.service.spec.ts` — verificado en vivo contra la forma real de `pokemon.moves`/`move` de PokeAPI
- [X] T062 [US2] Implementar `PokeApiMovepoolRepositoryService` (con la regla de `damageClass` por generación) en `web/src/pokemon/infrastructure/pokeapi-movepool-repository.service.ts` (depende de T061, T015)

**Módulo `pokemon` completo** (T048-T062): 78/78 tests unitarios verdes, lint y build en verde.

### Módulo `pokedex`

- [X] T063 [P] [US2] Tests unitarios de `PokedexEntrySource`, `PokedexIndexEntry`, `PokedexView`, `PokedexFilterCriteria` en `web/src/pokedex/domain/value-objects/*.spec.ts`
- [X] T064 [P] [US2] Crear los value objects `PokedexEntrySource`, `PokedexIndexEntry`, `PokedexView`, `PokedexFilterCriteria` en `web/src/pokedex/domain/value-objects/`
- [X] T065 [P] [US2] Definir el puerto `PokedexIndexRepository` en `web/src/pokedex/domain/ports/pokedex-index-repository.ts` per [contracts/pokedex.md](./contracts/pokedex.md)
- [X] T066 [P] [US2] Tests unitarios de `GetPokedexIndex` y `FilterPokedexEntries` en `web/src/pokedex/application/*.spec.ts`
- [X] T067 [US2] Implementar el caso de uso `GetPokedexIndex` en `web/src/pokedex/application/get-pokedex-index.ts` (depende de T065-T066)
- [X] T068 [US2] Implementar el caso de uso `FilterPokedexEntries` (búsqueda por nombre + filtro por tipo/generación, FR-009) en `web/src/pokedex/application/filter-pokedex-entries.ts` (depende de T064, T066)
- [X] T069 [P] [US2] Test unitario de `PokeApiPokedexIndexRepositoryService` (merge/dedup regional+DLC, alcance nacional por generación) en `web/src/pokedex/infrastructure/pokeapi-pokedex-index-repository.service.spec.ts`
- [X] T070 [US2] Implementar `PokeApiPokedexIndexRepositoryService` en `web/src/pokedex/infrastructure/pokeapi-pokedex-index-repository.service.ts` (depende de T069) — verificado en vivo contra `pokedex`/`version-group` reales de PokeAPI
- [X] T071 [US2] Implementar `PokedexStore` (signals `status`/`filterCriteria`/`pokedexIndex`/`pokedexDetailsById`, `pokedexView` derivado, `toggleNationalDex`) en `web/src/pokedex/infrastructure/in-memory-pokedex.service.ts` per [contracts/pokedex.md](./contracts/pokedex.md) (depende de T067-T070, T056), con test unitario. Requirió un segundo puerto cruzado (`GameSelectionReader` en `game/domain/ports/`, cableado en `app.config.ts`) para leer el juego/DLC activos sin romper el import-boundary.
- [X] T072 [P] [US2] Construir `PokedexSearchBar` en `web/src/pokedex/presentation/pokedex-search-bar.component.ts`, con test unitario
- [X] T073 [P] [US2] Construir `PokedexTypeFilter` en `web/src/pokedex/presentation/pokedex-type-filter.component.ts`, con test unitario
- [X] T074 [P] [US2] Construir `NationalDexToggle` (FR-004) en `web/src/pokedex/presentation/national-dex-toggle.component.ts`, con test unitario
- [X] T075 [P] [US2] Construir `PokedexEntryCard` (grid, FR-008) en `web/src/pokedex/presentation/pokedex-entry-card.component.ts`, con test unitario

**Módulo `pokedex` completo** (T063-T075): 103/103 tests unitarios verdes, lint y build en verde.

### Módulo `team`

- [X] T076 [P] [US2] Test unitario de `RosterEntry` y de la constante `MAX_TEAM_SIZE` en `web/src/team/domain/value-objects/roster-entry.spec.ts`
- [X] T077 [P] [US2] Crear el value object `RosterEntry` y la constante `MAX_TEAM_SIZE` en `web/src/team/domain/value-objects/`
- [X] T078 [US2] Implementar `PokedexRosterValidityCheckerService` (implementa `RosterValidityChecker` del módulo `game` usando `PokemonRepository`) en `web/src/team/infrastructure/pokedex-roster-validity-checker.service.ts` (depende de T054) — puerto disponible pero **no** consumido por `TeamStore`: la reconciliación real (FR-016) es "todo o nada" (se vacía el roster completo al cambiar de juego, per contracts/team-session.md), no una validación parcial por especie
- [X] T079 [P] [US2] Tests unitarios de `AddPokemonToTeam` (máximo 6, FR-010/FR-011) y `RemovePokemonFromTeam` (FR-012) en `web/src/team/application/*.spec.ts`
- [X] T080 [US2] Implementar el caso de uso `AddPokemonToTeam` en `web/src/team/application/add-pokemon-to-team.ts` (depende de T077, T079)
- [X] T081 [US2] Implementar el caso de uso `RemovePokemonFromTeam` en `web/src/team/application/remove-pokemon-from-team.ts` (depende de T077, T079)
- [X] T082 [P] [US2] Tests unitarios de `TeamStore` (longitud fija de `slots`, sin duplicar `moveIds`, exclusión mutua Mega/Gigamax, reconciliación FR-016) en `web/src/team/infrastructure/in-memory-team.service.spec.ts`
- [X] T083 [US2] Implementar `TeamStore` (`slots`, `addPokemonToTeam`/`removePokemonFromTeam`/`selectForm`/`selectMove`/`toggleMega`/`toggleGigamax`/`selectTeraType`, reconciliación al cambiar de juego FR-016) en `web/src/team/infrastructure/in-memory-team.service.ts` per [contracts/team-session.md](./contracts/team-session.md) (depende de T080-T082, T039) — implementa un tercer puerto cruzado (`RosterReader`, `shared/tokens/roster-reader.token.ts`) para que `game` sepa si hay que advertir antes de cambiar de juego
- [X] T084 [P] [US2] Construir `TeamSlot` en `web/src/team/presentation/team-slot.component.ts`, con test unitario
- [X] T085 [P] [US2] Construir `FormSelectionModal` (FR-013) en `web/src/team/presentation/form-selection-modal.component.ts`, con test unitario
- [X] T086 [P] [US2] Construir `MoveSelectionSheet` (FR-014, muestra `damageClass`) en `web/src/team/presentation/move-selection-sheet.component.ts`, con test unitario
- [X] T087 [P] [US2] Construir `TeraTypePicker` en `web/src/team/presentation/tera-type-picker.component.ts`, con test unitario
- [X] T088 [US2] Construir `TeamBuilderTwoPaneLayout` (usa `ViewportService`/`Breakpoints` para compact/medium/expanded, FR-019, por proyección de contenido) en `web/src/team/presentation/team-builder-two-pane-layout.component.ts` (depende de T014, T072-T075, T084), con test unitario
- [X] T089 [US2] Construir `TeamBuilderPage` (compone slots + panel de Pokédex + formas/movimientos) en `web/src/team/presentation/team-builder.page.ts` (depende de T071, T083, T088), con test unitario. Requirió dos adiciones no previstas en plan.md: `PokedexBrowserComponent` nuevo (`pokedex/presentation/pokedex-browser.component.ts`, composición de búsqueda/filtro/toggle/grid con su propio `add` output) y un cuarto puerto cruzado (`PokedexDetailsReader`, `shared/tokens/pokedex-details-reader.token.ts`) — `team/presentation` no puede importar `pokedex/infrastructure` directamente per las reglas de `eslint.config.js`, así que la composición de UI se resuelve vía `presentation→presentation` y el detalle vía puerto, no vía acceso directo a la store de otro módulo.

### Integración de User Story 2

- [X] T090 [US2] Conectar la ruta `/equipo` y el flujo de confirmación al cambiar de juego con roster no vacío en `web/src/app/app.routes.ts` (depende de T089) — la confirmación (FR-016) se resolvió en `game/presentation` (único lugar donde se llama `selectGame`) usando el puerto cruzado `RosterReader`, con tests unitarios para los 3 casos (equipo vacío, cancelar, confirmar)
- [X] T091 [US2] Aplicar la pasada de accesibilidad WCAG 2.1 AA (`role="status"`/`aria-live` en loading/error, `role="dialog"`/`aria-modal` en los paneles de forma/movimientos, `alt` en sprites, `aria-label` en botones de ícono) a los componentes de `pokedex/presentation` y `team/presentation` (FR-024)
- [X] T092 [P] [US2] Test Playwright de extremo a extremo cubriendo los escenarios de aceptación de User Story 2 (buscar/filtrar, agregar hasta 6, rechazo del 7º, abrir selector de forma, quitar) + recarga de página confirmando FR-015, en `web/e2e/user-story-2.spec.ts` (depende de T090-T091) — **corrido contra un `ng serve` real y PokeAPI en vivo: 3/3 verde**

**Checkpoint**: ✅ User Story 1 y 2 completas y verificadas de punta a punta (140 tests unitarios + 6 e2e contra PokeAPI real) — el producto cubre todo el alcance de esta migración (spec.md).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validación final y limpieza cruzada — Flutter ya fue retirado en el Setup (T001); esta fase solo confirma que la migración quedó completa y sin regresiones.

- [X] T093 [P] Ejecutar el recorrido completo de [quickstart.md](./quickstart.md) (flujos manuales + `npm run test:e2e`) contra un build de `web/` — 6/6 e2e verdes contra `ng serve` real + PokeAPI en vivo (User Story 1 y 2)
- [X] T094 [P] Verificar que la regla de import-boundaries de ESLint (T006) efectivamente rechaza un import cruzado de infraestructura entre módulos (regresión de [quickstart.md](./quickstart.md) "Qué NO debería pasar") — **hallazgo crítico**: la regla nunca se había aplicado de verdad (`eslint-plugin-boundaries` necesita un resolver — `import/resolver: { typescript: {} }` — para convertir un import relativo en una ruta clasificable; sin él, todo import local quedaba "de tipo desconocido" y la regla se saltaba en silencio, verificado con `ESLINT_PLUGIN_BOUNDARIES_DEBUG=1`). Al arreglarlo aparecieron **violaciones reales** ya coladas en el código (`pokedex`/`team` importando infraestructura y casos de uso de `pokemon` directamente) — corregidas agregando dos puertos cruzados más (`POKEMON_REPOSITORY`, `MOVEPOOL_REPOSITORY`, mismo patrón de research.md Decisión 17) y llamando los métodos del puerto directamente en vez de los envoltorios de `application` de otro módulo. Reverificado con una violación deliberada: la regla ahora sí falla como debe. 140/140 tests y 6/6 e2e siguen verdes tras la corrección.
- [X] T095 [P] Barrido de todo `web/src` confirmando que ningún archivo usa `localStorage`/`indexedDB`/cookies (regresión de FR-015) — limpio
- [X] T096 [P] Verificar la instalabilidad PWA (manifest + service worker) contra un build de producción servido estáticamente, per [quickstart.md](./quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede arrancar de inmediato.
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA ambas User Stories.
- **User Story 1 (Phase 3)**: depende de Foundational. Sin dependencia de User Story 2.
- **User Story 2 (Phase 4)**: depende de Foundational. Usa `GameStore.activeGame` (T039, User Story 1) para saber qué juego está activo, así que en la práctica se implementa después de User Story 1, aunque su propia lógica de dominio/aplicación (`pokemon`/`pokedex`/`team`) es independiente y testeable por separado.
- **Polish (Phase 5)**: depende de que ambas User Stories estén completas.

### Dentro de cada módulo

- Tests antes que la implementación que verifican (Principio II) — no marcar una tarea de implementación completa hasta que su test correspondiente exista y haya fallado primero.
- Value objects/entidades antes que casos de uso.
- Casos de uso (aplicación) antes que adaptadores (infraestructura) que los usan como puerto.
- Infraestructura antes que los componentes de presentación que la consumen.
- Componentes de presentación antes del cableado de rutas/integración de la User Story.

### Parallel Opportunities

- Todas las tareas [P] de Setup (T004-T011) en paralelo.
- T014-T015 (Foundational) en paralelo.
- Dentro de User Story 1: T017-T020 (tests+value objects+puertos de `language`) en paralelo entre sí; T030-T034 (tests+value objects+puertos de `game`) en paralelo entre sí; los módulos `language` y `game` pueden avanzar en paralelo entre dos personas distintas una vez pasada la Fase 2.
- Dentro de User Story 2: `pokemon` (T048-T062) puede avanzar en paralelo con la parte de dominio de `pokedex` (T063-T066) y `team` (T076-T077, T079); `pokedex`/`team` infraestructura (T070-T071, T078-T083) depende de que `pokemon` (T054-T062) ya exponga sus puertos.

---

## Parallel Example: User Story 1

```bash
# Value objects y puertos de `language` y `game` en paralelo (tests primero):
Task: "Test unitario de igualdad de SupportedLanguage en web/src/language/domain/value-objects/supported-language.spec.ts"
Task: "Tests unitarios de igualdad de Generation, GameDlc y Game en web/src/game/domain/**/*.spec.ts"

# Componentes de presentación de `game` en paralelo:
Task: "Construir GameCard en web/src/game/presentation/game-card.component.ts"
Task: "Construir GameSearchBar en web/src/game/presentation/game-search-bar.component.ts"
Task: "Construir GenerationFilter en web/src/game/presentation/generation-filter.component.ts"
Task: "Construir DlcToggleList en web/src/game/presentation/dlc-toggle-list.component.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

Ambas historias son P1 (spec.md): User Story 1 sola es demostrable (idioma + selección de juego) pero **no** es el producto — User Story 2 es "el valor central del producto" (spec.md). El MVP real de BrewDex-Angular es Setup + Foundational + User Story 1 + User Story 2 juntas.

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueante)
3. Completar Fase 3: User Story 1 — **PARAR y VALIDAR** de forma independiente (T047)
4. Completar Fase 4: User Story 2 — **PARAR y VALIDAR** de forma independiente (T092)
5. Fase 5: Polish y validación final de quickstart.md (Flutter ya fue retirado en el Setup, T001)

### Incremental Delivery

1. Setup + Foundational → base lista.
2. User Story 1 → validar independientemente → demo interna (selector de idioma/juego funcionando).
3. User Story 2 → validar independientemente → demo interna (equipo completo funcionando) — MVP real alcanzado.
4. Polish → quickstart.md completo, accesibilidad y PWA verificadas (Flutter ya fue retirado desde el Setup).

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes.
- [US1]/[US2] mapea cada tarea a su User Story de spec.md para trazabilidad.
- Ninguna tarea de `application/`, `infrastructure/` o `presentation/` debe introducir lectura/escritura a `localStorage`/`indexedDB`/cookies (FR-015) — ver T095.
- Confirmar que cada test falla antes de implementar (Principio II) antes de marcar la tarea de implementación correspondiente como completa.
- Hacer commit después de cada tarea o grupo lógico.
- Parar en cada checkpoint para validar la User Story de forma independiente antes de seguir.
