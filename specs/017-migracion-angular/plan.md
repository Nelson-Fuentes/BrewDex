# Implementation Plan: Migración de BrewDex a Angular

**Branch**: `017-migracion-angular` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-migracion-angular/spec.md`

## Summary

Reconstruir BrewDex como una aplicación web Angular de una sola página (SPA), instalable como PWA, que cubre — dentro de una única sesión de navegador, sin persistencia — los tres flujos vigentes: selección de idioma, selección de juego/generación con DLCs, y construcción de un equipo de hasta 6 Pokémon (Pokédex filtrable, formas/variantes cosméticas, movimientos con moveset por defecto). Consume PokeAPI directamente desde el navegador (sin backend propio), reproduciendo 1:1 las reglas de negocio ya validadas en Flutter (mapas de forma regional, DLC, elegibilidad de Pokédex nacional, Mega/Gigamax por juego) y la arquitectura por capas dominio/aplicación/infraestructura/presentación exigida por la Constitución, traducida a componentes standalone de Angular con signals para el estado (sin NgRx: no se justifica su complejidad para 3 bounded contexts de este tamaño — Principio I). El análisis de cobertura de tipos queda fuera de esta migración (ver spec.md, Assumptions).

## Technical Context

**Language/Version**: TypeScript 5.x sobre Angular 18 (standalone components, signals; sin `NgModule`)

**Primary Dependencies**: Angular (`@angular/core`, `@angular/common/http`, `@angular/router`, `@angular/service-worker`), Angular Material 3 (theming + componentes accesibles), `@jsverse/transloco` (i18n en tiempo de ejecución), Angular CDK (`BreakpointObserver`, `a11y`)

**Storage**: N/A — sin persistencia de ningún tipo (FR-015); todo el estado vive en memoria durante la sesión del navegador

**Testing**: Jasmine + Karma (`ng test`, unitario — dominio/aplicación/infraestructura/presentación) y Playwright + `@axe-core/playwright` (flujos extremo a extremo de las User Stories 1 y 2, y auditoría automatizada de accesibilidad para SC-007)

**Target Platform**: Navegador web moderno (Chrome/Edge/Firefox/Safari, últimas versiones, escritorio y móvil), instalable como PWA vía `@angular/pwa`; sin apps nativas ni backend propio (PokeAPI se consume directamente desde el cliente)

**Project Type**: web — proyecto frontend único (Angular SPA); no hay "backend" propio en este repo porque PokeAPI ya es el backend externo consumido directamente

**Performance Goals**: primera pantalla interactiva en <3 s en banda ancha típica; navegación entre selector de idioma → selector de juego → constructor de equipo sin bloqueos perceptibles (alineado con SC-001, "primer Pokémon agregado en <2 min")

**Constraints**: WCAG 2.1 AA (FR-024); sin funcionamiento offline (Assumptions); sin persistencia de ningún dato entre sesiones (FR-015); debe funcionar sin backend propio, solo PokeAPI + assets estáticos

**Scale/Scope**: catálogo de ~9 generaciones y varias decenas de juegos (con DLCs); Pokédex por juego de hasta ~1000+ entradas (Pokédex nacional); uso mono-usuario, completamente client-side — sin preocupaciones de escalado de servidor propio

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity & YAGNI**: PASS. Se descarta NgRx (y cualquier store library) a favor de servicios Angular con signals — la complejidad de un store centralizado no está justificada por 3 bounded contexts de tamaño moderado sin persistencia que sincronizar. Se descarta SSR (no hay requisito de SEO/backend). Ver research.md Decisión 2.
- **II. Test-First Development**: PASS (proceso, no gate de diseño). Karma/Jasmine para lógica de dominio/aplicación (tests antes de implementación) y Playwright para las dos User Stories P1; cada corrección de bug futura deberá incluir su test de regresión, igual que en el proyecto Flutter.
- **III. Clear Contracts & Interfaces**: PASS. Cada módulo (`language`, `game`, `pokemon`, `pokedex`, `team`) expone sus puertos como interfaces TypeScript documentadas en `contracts/`, igual que los `abstract class` de Dart que reemplazan — ver data-model.md y contracts/.
- **IV. Code Quality & Review**: PASS (proceso). ESLint + `angular-eslint` + Prettier como lint automatizado; PRs revisados antes de merge; sin commits directos a la rama por defecto.
- **V. Observability & Versioning**: PASS. Un `LoggingService` de infraestructura centraliza los `console.error`/`console.warn` estructurados (mensaje + contexto) para los mismos puntos donde Flutter usa `dart:developer.log` (fallas de PokeAPI); `package.json` sigue SemVer.
- **VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)**: PASS. División **por módulo primero, por capa después** (`<módulo>/domain/`, `<módulo>/application/`, `<módulo>/infrastructure/`, `<módulo>/presentation/` — ver Project Structure): cada módulo (`language`, `game`, `pokemon`, `pokedex`, `team`) es su propio slice vertical completo. Dentro de cada módulo, la regla de dependencia de Clean Architecture sigue vigente sin excepción: `domain/` es TypeScript puro sin imports de Angular/HTTP ni de otro módulo salvo un puerto explícito de otro módulo; `application/` solo depende del `domain/` de su propio módulo y de los puertos que declara (propios o de otro módulo, nunca de la infraestructura de otro módulo directamente); `infrastructure/` implementa esos puertos y es la única capa que conoce PokeAPI/`HttpClient`/i18n; `presentation/` son componentes standalone delgados que delegan toda regla de negocio a `application/`. Cruces entre módulos (p. ej. `team` reconciliando su roster contra `game`, o `pokedex`/`team` leyendo detalle de Pokémon del módulo `pokemon`) pasan siempre por un puerto documentado en `contracts/`, nunca importando el `domain`/`infrastructure` interno de otro módulo directamente.

Sin violaciones que justificar — no se requiere la tabla de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/017-migracion-angular/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── language-catalog.md
│   ├── game-catalog.md
│   ├── pokemon.md
│   ├── movepool.md
│   ├── pokedex.md
│   ├── team-session.md
│   └── responsive-layout.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Proyecto Angular único (sin backend propio — PokeAPI es el único servicio externo). Se sustituye por completo el árbol `lib/` de Flutter; el nuevo árbol vive en `web/` en la raíz del repo.

La organización interna es **por módulo primero, por capa después** (vertical slice): un directorio por módulo de negocio (`language`, `game`, `pokemon`, `pokedex`, `team`), y dentro de cada uno las cuatro capas de siempre (`domain/`, `application/`, `infrastructure/`, `presentation/`). Los antiguos bounded contexts de Flutter se reparten así:

| Módulo nuevo | Contenido (viene de `lib/**/team_builder` salvo donde se indica) |
|---|---|
| `language` | Todo `lib/**/language_selection` — sin cambios de alcance. |
| `game` | Todo `lib/**/game_selection` — sin cambios de alcance. |
| `pokemon` | Datos y reglas a nivel de especie/forma: `PokedexEntry`, `PokemonType`, `PokemonStats`, `Move`, `Gender`, `SelectableForm`, `CosmeticVariant`; el puerto `PokemonRepository` (resolución de detalle, ex `PokedexRepository.fetchPokedexDetails`) y `MovepoolRepository`. |
| `pokedex` | Búsqueda/filtrado/navegación de un Pokédex ya indexado: `PokedexView`, `PokedexFilterCriteria`, `PokedexIndexEntry`, `PokedexEntrySource`; el puerto `PokedexIndexRepository` (ex `PokedexRepository.fetchPokedexIndex`), el toggle de Pokédex nacional y de DLC. |
| `team` | Construcción del equipo: `RosterEntry`, `MAX_TEAM_SIZE`, agregar/quitar/customizar un slot; el puerto `RosterValidityChecker` (declarado aquí, implementado usando `pokemon`). |

Ver [[data-model.md]] y [[research.md]] Decisión 11 para el detalle de por qué `PokedexRepository` se separa en dos puertos (`PokemonRepository` + `PokedexIndexRepository`) al pasar a esta organización por módulos.

```text
web/
├── src/
│   ├── language/
│   │   ├── domain/                      # value-objects/supported-language.ts
│   │   │                                 # ports/supported-language-catalog.ts, device-locale-provider.ts, active-language-reader.ts
│   │   ├── application/                 # get-supported-languages.ts, get-active-language.ts, select-language.ts
│   │   ├── infrastructure/              # pokeapi-supported-language-catalog.service.ts,
│   │   │                                 # browser-device-locale-provider.service.ts, in-memory-active-language.service.ts
│   │   └── presentation/                # language-selector.page.ts, language-option-tile.component.ts
│   ├── game/
│   │   ├── domain/                      # entities/game.ts, team-building-session.ts
│   │   │                                 # value-objects/generation.ts, game-dlc.ts
│   │   │                                 # ports/game-catalog-repository.ts, roster-validity-checker.ts (consumido; ver `team`)
│   │   ├── application/                 # get-game-catalog.ts, select-game.ts
│   │   ├── infrastructure/              # pokeapi-game-catalog-repository.service.ts, in-memory-selected-game.service.ts
│   │   └── presentation/                # game.page.ts, game-card.component.ts,
│   │                                     # game-search-bar.component.ts, generation-filter.component.ts,
│   │                                     # dlc-toggle-list.component.ts (movido acá desde `pokedex`, ver tasks.md T043 —
│   │                                     #   User Story 1 necesita poder activar DLC sin depender del módulo `pokedex`)
│   ├── pokemon/
│   │   ├── domain/                      # entities/pokedex-entry.ts
│   │   │                                 # value-objects/pokemon-type.ts, pokemon-stats.ts, move.ts, gender.ts,
│   │   │                                 #   selectable-form.ts, cosmetic-variant.ts
│   │   │                                 # ports/pokemon-repository.ts, movepool-repository.ts
│   │   ├── application/                 # get-pokemon-details.ts, get-movepool.ts, get-default-moveset.ts
│   │   └── infrastructure/              # pokeapi-pokemon-repository.service.ts, pokeapi-movepool-repository.service.ts
│   │                                     # (sin presentation/ propio — sus tipos se consumen desde `pokedex` y `team`)
│   ├── pokedex/
│   │   ├── domain/                      # value-objects/pokedex-view.ts, pokedex-filter-criteria.ts,
│   │   │                                 #   pokedex-index-entry.ts, pokedex-entry-source.ts
│   │   │                                 # ports/pokedex-index-repository.ts
│   │   ├── application/                 # get-pokedex-index.ts, filter-pokedex-entries.ts
│   │   ├── infrastructure/              # pokeapi-pokedex-index-repository.service.ts
│   │   └── presentation/                # pokedex-search-bar.component.ts, pokedex-type-filter.component.ts,
│   │                                     # pokedex-entry-card.component.ts, national-dex-toggle.component.ts,
│   │                                     # pokedex-browser.component.ts (compone los 4 anteriores + InMemoryPokedexService;
│   │                                     #   añadido durante implementación para que `team` pueda componerlo por
│   │                                     #   presentation→presentation en vez de importar `pokedex/infrastructure`)
│   ├── team/
│   │   ├── domain/                      # value-objects/roster-entry.ts, team-size.ts
│   │   │                                 # ports/roster-validity-checker.ts (implementación; declarado en `game`)
│   │   ├── application/                 # add-pokemon-to-team.ts, remove-pokemon-from-team.ts
│   │   ├── infrastructure/              # pokedex-roster-validity-checker.service.ts (usa `pokemon`)
│   │   └── presentation/                # team.page.ts, team-slot.component.ts,
│   │                                     # form-selection-modal.component.ts, move-selection-sheet.component.ts,
│   │                                     # tera-type-picker.component.ts
│   ├── shared/                          # el único código que cualquier módulo puede importar directamente
│   │   ├── design-system/               # breakpoints.ts (puro), theme (Angular Material M3), type-icons, palette
│   │   ├── i18n/                        # en.json, es.json, fr.json, de.json, it.json, ja.json, ko.json, zh.json
│   │   └── logging/                     # logging.service.ts, http-error-mapping.ts
│   ├── app.config.ts                    # providers raíz (HttpClient, transloco, service worker)
│   ├── app.routes.ts                    # /idioma → /juego → /equipo (carga cada módulo de forma perezosa)
│   └── main.ts
├── public/
│   ├── manifest.webmanifest             # PWA — nombre, íconos, colores (instalable, FR-023)
│   └── icons/
├── ngsw-config.json                     # Angular service worker: solo assetGroups (app shell); sin dataGroups
│                                         # para PokeAPI ni para estado — no debe introducir persistencia (FR-015)
├── e2e/                                 # Playwright — flujos User Story 1 y 2, auditoría axe-core (SC-007)
├── angular.json
├── package.json
├── tsconfig.json
└── .eslintrc.json                       # incluye una regla de import boundaries (p. ej. eslint-plugin-boundaries)
                                          # que impide que `domain/` o `application/` de un módulo importen
                                          # `infrastructure/`/`presentation/` de otro módulo (Principio VI)
```

**Structure Decision**: Proyecto único (`web/`), sin división backend/frontend — PokeAPI ya es el "backend" y se consume directamente vía `HttpClient` desde la capa de infraestructura, igual que hoy hace el paquete `http` de Dart. Dentro de `web/src/`, la organización es **por módulo (slice vertical) primero, por capa después** — cinco módulos de negocio (`language`, `game`, `pokemon`, `pokedex`, `team`) más `shared/`, cada uno con sus propias `domain/application/infrastructure/presentation`, en vez de las cuatro carpetas de capa a nivel raíz que agrupaban los bounded contexts por dentro. Esto satisface igual el Principio VI (la regla de dependencia se aplica ahora *dentro* de cada módulo) y además hace que cada módulo sea localizable, revisable y —a futuro— extraíble como unidad propia, sin tener que tocar cuatro carpetas de nivel superior distintas para trabajar una sola funcionalidad.

### Retiro de la versión Flutter

FR-021 (spec.md) exige que la versión Flutter quede descartada desde ahora, no solo "al completar" la migración. Por decisión explícita del usuario, esto se ejecuta como la **primera tarea del plan** (T001 en tasks.md), antes incluso de crear el proyecto Angular — no al final:

- Se elimina del repositorio todo lo específico de Flutter: `lib/`, `test/`, `integration_test/`, `android/`, `ios/` (y cualquier otra carpeta de plataforma nativa presente), `pubspec.yaml`, `pubspec.lock`, `analysis_options.yaml`, `l10n.yaml`, `devtools_options.yaml`, `.metadata`, `.flutter-plugins-dependencies`, `brewdex.iml`, y cualquier artefacto de build (`build/`) que exista en el repo.
- Esta eliminación se hace **antes** de inicializar el workspace Angular (Fase Setup) — el repositorio queda sin una app funcional durante toda la migración, hasta que las User Stories 1 y 2 estén implementadas y validadas vía [quickstart.md](./quickstart.md). Es una compensación deliberada: empezar de cero de inmediato, a cambio de no mantener dos implementaciones coexistiendo ni un período de validación cruzada.
- El README se actualiza en la misma fase (justo después de borrar Flutter) para describir el nuevo flujo (`npm start` sobre `web/`), en vez de dejarlo con instrucciones de un código que ya no existe.

## Complexity Tracking

*Sin violaciones de la Constitución que justificar — tabla omitida.*
