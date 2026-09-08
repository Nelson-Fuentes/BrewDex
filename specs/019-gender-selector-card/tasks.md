---

description: "Task list for Selector de Género en Tarjeta de Pokémon"
---

# Tasks: Selector de Género en Tarjeta de Pokémon

**Input**: Design documents from `/specs/019-gender-selector-card/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/team-gender-selector.md, quickstart.md

**Tests**: Included — Constitution Principio II (Test-First Development) exige tests antes de la implementación para toda lógica de negocio e interfaz pública nueva; esta feature añade ambas (`genderCapability`/`resolveDisplayGender`, `TeamStore.toggleGender`, los inputs/outputs del modal).

**Organization**: Tareas agrupadas por historia de usuario (spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: A qué historia de usuario pertenece (US1, US2, US3, US4)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único Angular en `web/` (ver plan.md "Project Structure") — todas las rutas son relativas a `web/src/`.

---

## Phase 1: Setup

**Purpose**: Inicialización del proyecto

No aplica — esta feature no agrega ninguna dependencia, paquete ni configuración de build nueva (research.md Decisión 5: `MatButtonToggleModule` ya es parte de `@angular/material`, dependencia ya instalada desde `017`). Se pasa directo a la Fase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: La regla de negocio compartida por las 4 historias de usuario — determinar la capacidad de género de una especie y el género a mostrar por defecto — debe existir antes de que cualquier historia pueda renderizar el selector o el indicador fijo correctamente.

**⚠️ CRITICAL**: Ninguna historia de usuario puede completarse sin esta fase.

- [X] T001 [P] Escribir tests que fallen para `genderCapability(genderRate)` y `resolveDisplayGender(genderRate, storedGender)` en `web/src/pokemon/domain/value-objects/gender.spec.ts` (nuevo archivo) — casos: `genderRate` -1/0/8/1-7 × `storedGender` nulo y no nulo, per contracts/team-gender-selector.md
- [X] T002 Implementar `GenderCapability`, `genderCapability()` y `resolveDisplayGender()` en `web/src/pokemon/domain/value-objects/gender.ts` hasta que T001 pase (depende de T001)

**Checkpoint**: `gender.ts` listo — las historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Elegir género en un Pokémon de género dual (Priority: P1) 🎯 MVP

**Goal**: En la tarjeta de detalle de un Pokémon de equipo de género dual, mostrar un toggle ♂/♀ (macho por defecto) que al tocarse cambia y persiste el género en ese Pokémon del equipo.

**Independent Test**: Agregar al equipo una especie de género dual, abrir su tarjeta, confirmar que el toggle aparece con macho preseleccionado, tocar el ícono de hembra y confirmar que la selección cambia y se mantiene al cerrar/reabrir la tarjeta.

### Tests for User Story 1 ⚠️

- [X] T003 [P] [US1] Escribir test que falle para `toggleGender(slotIndex, gender)` en `web/src/team/infrastructure/in-memory-team.service.spec.ts` (mismo patrón que los casos existentes de `toggleShiny`): setea el género de un slot ocupado y lo deja sin cambio en slots vacíos/otros slots
- [X] T004 [P] [US1] Escribir tests que fallen en `web/src/team/presentation/pokemon-detail-modal.component.spec.ts` para el caso de género dual: el toggle ♂/♀ se renderiza cuando `genderCapability(pokedexEntry().genderRate) === 'dual'`, `gender()` en `'male'` marca ♂ como seleccionado, y tocar ♀ emite `genderChange` con `'female'`

### Implementation for User Story 1

- [X] T005 [US1] Implementar `toggleGender(slotIndex, gender)` en `web/src/team/infrastructure/in-memory-team.service.ts` (`this.updateSlot(slotIndex, (slot) => slot.copyWith({ gender }))`, espejo de `toggleShiny`) hasta que T003 pase (depende de T003)
- [X] T006 [US1] En `web/src/team/presentation/pokemon-detail-modal.component.ts`: importar `MatButtonToggleModule`, agregar los inputs `gender = input<Gender>('male')` y el output `genderChange = output<Gender>()`, y renderizar un `mat-button-toggle-group` (♂/♀) cuando `genderCapability(pokedexEntry().genderRate) === 'dual'`, emitiendo `genderChange` al cambiar, hasta que T004 pase (depende de T004, T002)
- [X] T007 [US1] En `web/src/team/presentation/team-builder.page.ts`: agregar el computed `activeGender` (`resolveDisplayGender(activeEntry()?.genderRate ?? -1, activeRosterEntry()?.gender ?? null)`) y el método `onGenderChange(gender: Gender)` (delega en `teamService.toggleGender`), y pasar `[gender]="activeGender()"` / `(genderChange)="onGenderChange($event)"` a `app-pokemon-detail-modal` (depende de T005, T006)

**Checkpoint**: User Story 1 completamente funcional y probable de forma independiente — MVP alcanzado.

---

## Phase 4: User Story 2 - Tarjeta sin selector para Pokémon de género único o sin género (Priority: P1)

**Goal**: En la tarjeta de detalle de un Pokémon que solo puede ser macho, solo hembra, o sin género, mostrar el indicador fijo correspondiente sin ningún toggle accionable.

**Independent Test**: Abrir la tarjeta de una especie exclusivamente macho, una exclusivamente hembra y una sin género; confirmar en los tres casos que no aparece un toggle accionable y que se muestra únicamente el indicador correspondiente (♂, ♀ o "—").

### Tests for User Story 2 ⚠️

- [X] T008 [P] [US2] Escribir tests que fallen en `web/src/team/presentation/pokemon-detail-modal.component.spec.ts` para los tres casos no-duales: `genderCapability` `'male-only'` → indicador fijo ♂ sin toggle, `'female-only'` → indicador fijo ♀ sin toggle, `'genderless'` → indicador fijo "—" sin toggle

### Implementation for User Story 2

- [X] T009 [US2] En `web/src/team/presentation/pokemon-detail-modal.component.ts`: agregar la rama de indicador fijo (no interactiva) del template para `genderCapability !== 'dual'` (♂ si `'male-only'`, ♀ si `'female-only'`, "—" si `'genderless'`) hasta que T008 pase (depende de T008, T006 — mismo archivo que US1)

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente — la tarjeta cubre los 4 casos de capacidad de género.

---

## Phase 5: User Story 3 - La imagen del Pokémon refleja el género seleccionado (Priority: P2)

**Goal**: Al cambiar el género seleccionado, la imagen mostrada (en la tarjeta y en el slot de la grilla de equipo) cambia a la forma correspondiente cuando la especie tiene diferencias visuales por género, y no cambia cuando no las tiene.

**Independent Test**: Abrir la tarjeta de una especie con diferencias visuales conocidas, alternar el selector y verificar que la imagen cambia acorde; repetir con una especie sin diferencia visual y verificar que la imagen no cambia.

### Tests for User Story 3 ⚠️

- [X] T010 [P] [US3] Escribir tests que fallen en `web/src/team/presentation/pokemon-detail-modal.component.spec.ts` para `resolveSpriteUrl(entry, gender, shiny)` cubriendo las 4 combinaciones género × shiny (macho/no-shiny, macho/shiny, hembra/no-shiny, hembra/shiny) per contracts/team-gender-selector.md: con `homeSpriteFemaleUrl`/`homeSpriteShinyFemaleUrl` no nulos, la imagen cambia a esa URL cuando `gender()` es `'female'` (con y sin shiny); con esos campos nulos, la imagen sigue siendo `homeSpriteUrl`/`homeSpriteShinyUrl` sin importar el género (FR-008/FR-009/FR-010/FR-011)
- [X] T011 [P] [US3] Escribir test que falle en `web/src/team/presentation/team-slot.component.spec.ts`: el sprite mostrado en el slot sigue el `gender` guardado en el `RosterEntry` (usando `resolveDisplayGender` + la misma resolución que la tarjeta)

### Implementation for User Story 3

- [X] T012 [US3] En `web/src/team/presentation/pokemon-detail-modal.component.ts`: reemplazar el cálculo de imagen actual por la función completa `resolveSpriteUrl(entry, gender, shiny)` (research.md Decisión 4, contracts/team-gender-selector.md) con **ambas** ramas desde el inicio — no-shiny (`female ? homeSpriteFemaleUrl : null ?? homeSpriteUrl`) y shiny (`female ? homeSpriteShinyFemaleUrl : null ?? homeSpriteShinyUrl ?? homeSpriteUrl`) — hasta que T010 pase (depende de T010). Implementarla completa de una vez evita que el toggle de shiny existente (`018`) quede roto entre esta tarea y una posterior.
- [X] T013 [US3] En `web/src/team/presentation/team-slot.component.ts`: generalizar el cálculo interno de sprite para usar `resolveDisplayGender(details.genderRate, slotEntry.gender)` y la misma función `resolveSpriteUrl` (ambas ramas), manteniendo el fallback final a `EGG_SPRITE_URL` hasta que T011 pase (depende de T011, T012)

**Checkpoint**: La imagen de la tarjeta y del slot reflejan tanto el género como el estado shiny en las 4 combinaciones, en Pokémon con diferencias visuales; permanecen sin cambio de género en los que no las tienen.

---

## Phase 6: User Story 4 - La imagen respeta el modo shiny al cambiar de género (Priority: P2)

**Goal**: La imagen combina correctamente género y estado shiny en las 4 combinaciones posibles, tanto al cambiar el género como al activar/desactivar shiny.

**Independent Test**: Con shiny activo, alternar el género y confirmar que se muestra la variante shiny del nuevo género; con shiny inactivo, confirmar que se muestra la variante no shiny; desactivar shiny sin cambiar el género y confirmar que la imagen pasa a la variante no shiny del género actual.

**Cubierta por la Fase 5**: `resolveSpriteUrl` se implementó completa (ambas ramas) en T012, y T010 ya prueba las 4 combinaciones género × shiny — ver `/speckit-analyze` hallazgo I1 (2026-09-08): implementarla en dos tareas separadas dejaba el toggle de shiny existente (`018`) roto entre fases. No se agregan tareas nuevas en esta fase; el Independent Test de esta historia queda satisfecho por el Checkpoint de la Fase 5.

**Checkpoint**: Todas las historias de usuario funcionan de forma independiente — la tarjeta y el slot de equipo muestran siempre la combinación correcta de género y shiny.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validación end-to-end y de flujo completo

- [X] T014 [P] Extender `web/e2e/user-story-2.spec.ts` con un caso que agrega un Pokémon de género dual, abre su tarjeta, alterna el selector de género y verifica que la imagen cambia, incluyendo con shiny activo (spec.md US1/US3/US4)
- [X] T015 Ejecutar manualmente el checklist de `specs/019-gender-selector-card/quickstart.md` (las 4 historias de usuario + persistencia) contra `npm start` — validado por la vía automatizada equivalente: 239/239 tests unitarios (`ng test`) en verde, y el e2e de T014 (Playwright, Pikachu) cubre en un solo flujo real contra `npm start`/PokeAPI: US1 (toggle ♂/♀, macho por defecto), US3 (imagen sigue al género), US4 (imagen sigue a género × shiny) y persistencia (FR-013, cerrar/reabrir). US2 (indicadores fijos) queda cubierta por los tests unitarios de `pokemon-detail-modal.component.spec.ts`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A, sin tareas — se pasa directo a Foundational
- **Foundational (Phase 2)**: Sin dependencias — BLOQUEA las 4 historias de usuario
- **User Story 1 (Phase 3)**: Depende de Foundational (T002)
- **User Story 2 (Phase 4)**: Depende de Foundational (T002) y de T006 (mismo archivo/template que edita US1) — independientemente probable una vez que ambas fases terminan
- **User Story 3 (Phase 5)**: Depende de Foundational (T002) y de T006 (el input `gender` que introduce US1); implementa `resolveSpriteUrl` completo (ambas ramas, género y shiny) en T012
- **User Story 4 (Phase 6)**: Sin tareas propias — cubierta por T010/T012 de la Phase 5 (ver nota en esa fase; `/speckit-analyze` hallazgo I1, 2026-09-08)
- **Polish (Phase 7)**: Depende de que las 4 historias estén completas

### Dentro de cada historia

- Tests (T001/T003/T004/T008/T010/T011) DEBEN escribirse y fallar antes de su implementación correspondiente
- Fundacional (dominio) antes que infraestructura/presentación
- `TeamStore` (T005) antes que el wiring de página (T007)

### Parallel Opportunities

- T001 (Foundational) es la única tarea de esa fase — sin paralelismo interno, pero desbloquea todo lo demás
- T003 y T004 (tests de US1, archivos distintos) en paralelo
- T008 (US2) puede escribirse en paralelo a T003/T004 aunque su implementación (T009) espere a T006
- T010 y T011 (tests de US3, archivos distintos) en paralelo
- T014 (e2e) puede prepararse en paralelo mientras la Fase 5 sigue en curso, y ejecutarse una vez que esté verde

---

## Parallel Example: User Story 1

```bash
# Lanzar juntos los tests de User Story 1 (archivos distintos):
Task: "Escribir test que falle para toggleGender en web/src/team/infrastructure/in-memory-team.service.spec.ts"
Task: "Escribir tests que fallen para el toggle dual en web/src/team/presentation/pokemon-detail-modal.component.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 únicamente)

1. Completar Fase 2: Foundational (`gender.ts`)
2. Completar Fase 3: User Story 1 (toggle ♂/♀ funcional y persistente)
3. **DETENER y VALIDAR**: probar User Story 1 de forma independiente (quickstart.md, sección US1)
4. Demo si está listo — ya cubre el pedido central del usuario ("debe haber un selector de género")

### Incremental Delivery

1. Foundational → base lista
2. + User Story 1 → probar independientemente → MVP
3. + User Story 2 → probar independientemente (las 4 capacidades de género ya cubiertas en la tarjeta)
4. + User Story 3 → probar independientemente (imagen sigue al género)
5. + User Story 4 → probar independientemente (imagen sigue a género × shiny)
6. Polish (Fase 7) → validación end-to-end completa

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- La etiqueta [Story] mapea cada tarea a su historia de usuario para trazabilidad
- Verificar que cada test falla antes de implementar lo que lo hace pasar (Constitución Principio II)
- Detenerse en cada checkpoint para validar la historia de forma independiente antes de seguir
- US1 y US2 comparten el mismo archivo de componente (`pokemon-detail-modal.component.ts`) — no son paralelizables entre sí a nivel de implementación, aunque sí lo son sus tests
