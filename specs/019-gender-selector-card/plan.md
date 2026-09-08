# Implementation Plan: Selector de Género en Tarjeta de Pokémon

**Branch**: `019-gender-selector-card` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-gender-selector-card/spec.md`

## Summary

Añade un selector de género a la tarjeta de detalle de Pokémon del equipo (`PokemonDetailModalComponent`, existente desde `018`, junto al toggle de shiny ya presente): un `mat-button-toggle-group` de ♂/♀ para especies de género dual (macho por defecto), y un indicador fijo (♂, ♀ o "—") para especies de un solo género o sin género. El género elegido persiste en `RosterEntry.gender` (campo ya modelado, sin uso hasta ahora) vía un nuevo `TeamStore.toggleGender`, espejo exacto de `toggleShiny`. La imagen mostrada — en la tarjeta y en el slot de la grilla de equipo — se resuelve combinando género y estado shiny sobre los 4 campos de sprite que `PokedexEntry` ya expone (`homeSpriteUrl`/`homeSpriteShinyUrl`/`homeSpriteFemaleUrl`/`homeSpriteShinyFemaleUrl`), sin necesidad de ningún dato ni dependencia nueva.

## Technical Context

**Language/Version**: TypeScript 5.x on Angular 18 (standalone components, signals; no `NgModule`) — unchanged from `017`/`018`

**Primary Dependencies**: Angular (`@angular/core`), Angular Material 3 (`MatButtonToggleModule` — ya parte del paquete `@angular/material` ya instalado, no un paquete nuevo), `@jsverse/transloco` (etiquetas accesibles del selector) — no se añade ninguna dependencia nueva

**Storage**: N/A — sin persistencia entre sesiones (FR-015 de `017`, sin cambio); el género elegido vive en memoria en `InMemoryTeamService.slots`, igual que el shiny, y se pierde al recargar la app o cambiar de juego

**Testing**: Jasmine + Karma (`ng test`) para tests de dominio/aplicación/infraestructura/presentación; Playwright (`npm run test:e2e`) para el flujo E2E de equipo existente, extendido

**Target Platform**: Mismo target que `017`/`018` (web de escritorio + móvil, PWA instalable); sin superficie de plataforma nueva

**Project Type**: web — SPA Angular única en `web/`, sin backend; sin cambio

**Performance Goals**: Sin objetivo de rendimiento propio — es una interacción síncrona local (cambiar una señal), no hay llamada de red nueva; SC-005 de spec.md (identificar y cambiar el género en menos de 2s) se cumple por construcción al no depender de I/O

**Constraints**: Sin dependencia nueva; todo el cambio se mantiene dentro de los módulos/capas existentes (`pokemon`, `team`) y su capa hexagonal ya establecida (dominio/aplicación/infraestructura/presentación)

**Scale/Scope**: Mismo alcance de catálogo que `017`/`018` (todas las especies con sus datos de género/sprite ya resueltos vía PokeAPI); esta feature solo cambia cómo se presentan y persisten esos datos, no su tamaño

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity & YAGNI**: PASS. Reutiliza patrones ya revisados en el código: `toggleGender` es un espejo literal de `toggleShiny`/`toggleMega` (`in-memory-team.service.ts`); `RosterEntry.gender`/`copyWith({ gender })` ya existían sin usar — se conectan, no se crean; la resolución de sprite generaliza el `?? ` que ya existe para shiny, sin dato nuevo; `MatButtonToggleModule` es un módulo del paquete Angular Material ya instalado (research.md Decisiones 2-5). No se introduce ninguna librería, servicio o capa de abstracción nueva.
- **II. Test-First Development**: `genderCapability`/`resolveDisplayGender` son lógica de negocio nueva y testeable (research.md Decisión 3) — `/speckit-tasks` DEBE secuenciar un test que falle antes de cada implementación correspondiente (`gender.spec.ts`, casos nuevos en `in-memory-team.service.spec.ts`, `pokemon-detail-modal.component.spec.ts`, `team-slot.component.spec.ts`; ver `quickstart.md` "Automated checks"). **PASS** (gate de proceso, exigido en fase de tasks/implementación).
- **III. Clear Contracts & Interfaces**: Los únicos contratos públicos nuevos son aditivos — `TeamStore.toggleGender` y los inputs/outputs `gender`/`genderChange` de `PokemonDetailModalComponent` — documentados en `contracts/team-gender-selector.md`. Ningún contrato existente (`PokedexEntry`, `RosterEntry`, `RosterReader`) cambia de forma. **PASS**.
- **IV. Code Quality & Review**: Sin cambio a este gate — ESLint/Prettier, revisión de PR, sin commits directos a la rama por defecto. **PASS**.
- **V. Observability & Versioning**: Sin punto de integración externo nuevo; no hay llamada de red nueva que loggear. **PASS**.
- **VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)**: PASS. `genderCapability`/`resolveDisplayGender` viven en `pokemon/domain/value-objects/gender.ts` (dominio puro, sin dependencias externas); `toggleGender` es un método de aplicación en `InMemoryTeamService` (`team/infrastructure`, ya expone `TeamStore`) que solo llama a `RosterEntry.copyWith` (dominio de `team`); `resolveSpriteUrl` es lógica de presentación pura dentro de `PokemonDetailModalComponent`/`TeamSlotComponent` (`team/presentation`), sin nueva dependencia de infraestructura. `team` sigue importando solo el tipo `Gender`/las funciones puras de `pokemon/domain`, el mismo cruce de módulo ya establecido que `RosterEntry` usa hoy para `Gender`/`PokemonType` — ningún módulo alcanza el `domain`/`infrastructure` de otro directamente.

No hay violaciones que registrar en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/019-gender-selector-card/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── team-gender-selector.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

SPA Angular existente en `web/` (de `017`/`018`), organizada por módulo y luego por capa (`domain/`, `application/`, `infrastructure/`, `presentation/`) — sin cambio estructural; esta feature solo edita/agrega archivos dentro de esa estructura:

```text
web/src/
├── pokemon/
│   └── domain/
│       └── value-objects/
│           ├── gender.ts             # US1/US2: NEW genderCapability(), resolveDisplayGender()
│           └── gender.spec.ts        # NEW — tests de las dos funciones puras
└── team/
    ├── infrastructure/
    │   ├── in-memory-team.service.ts        # US1: NEW toggleGender(slotIndex, gender)
    │   └── in-memory-team.service.spec.ts   # NEW caso de test para toggleGender
    └── presentation/
        ├── pokemon-detail-modal.component.ts        # US1/US2/US3/US4: selector ♂/♀, indicador fijo, resolveSpriteUrl()
        ├── pokemon-detail-modal.component.spec.ts    # nuevos casos
        ├── team-slot.component.ts                    # US3/US4: sprite del slot sensible al género guardado
        ├── team-slot.component.spec.ts               # nuevo caso
        └── team-builder.page.ts                      # US1: activeGender computed, onGenderChange()
```

**Structure Decision**: Sin cambio estructural al layout de módulos/capas existente de `web/`. Esta feature no agrega ningún archivo nuevo de componente/servicio — solo un archivo de dominio puro (`gender.ts`, ya existía con el tipo `Gender`; se le agregan dos funciones) y sus specs, editando en el lugar los tres archivos existentes que ya modelan la tarjeta de equipo (`pokemon-detail-modal.component.ts`, `team-slot.component.ts`, `team-builder.page.ts`) y el `TeamStore` (`in-memory-team.service.ts`), cada edición dentro del módulo ya responsable de esa parte, según el Constitution Check de arriba.

## Complexity Tracking

*Sin violaciones — tabla omitida per Constitution Check.*
