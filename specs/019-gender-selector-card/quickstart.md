# Quickstart: Validating the Gender Selector

## Prerequisites

```bash
cd web
npm install   # if not already done
```

No environment variables or backend needed — same setup as `017`/`018`, the app talks to the public PokeAPI directly from the browser.

## Run the app

```bash
npm start   # ng serve, http://localhost:4200
```

## Manual validation per user story

### US1 — Elegir género en un Pokémon de género dual

1. Selecciona un juego y agrega al equipo una especie de género dual (p. ej. Pikachu, Charizard — cualquiera sin `gender_rate` de -1, 0 u 8).
2. Haz clic en el slot ocupado para abrir la tarjeta de detalle. Confirma que aparece un selector con los íconos ♂/♀ y que ♂ está marcado (FR-002, FR-003).
   - SC-005: alternar el selector es una actualización local de una señal (`gender`/`genderChange`), sin ninguna llamada de red — se cumple "en menos de 2 segundos" por construcción, no hace falta cronometrarlo.
3. Toca el ícono ♀. Confirma que la selección cambia visualmente a hembra (FR-007).
4. Toca el ícono ♂. Confirma que vuelve a macho.

### US2 — Tarjeta sin selector para género único o sin género

1. Agrega al equipo una especie exclusivamente macho (p. ej. Tauros, `gender_rate` 0). Abre su tarjeta: confirma que se muestra solo el ícono ♂ fijo, sin poder tocarlo para cambiar (FR-004).
2. Agrega una especie exclusivamente hembra (p. ej. Chansey, `gender_rate` 8). Confirma el ícono ♀ fijo (FR-005).
3. Agrega una especie sin género (p. ej. Magnemite, `gender_rate` -1). Confirma el indicador "—" fijo, sin selector (FR-006).

### US3 — La imagen refleja el género seleccionado

1. Agrega al equipo una especie con diferencia visual conocida por género (p. ej. Pyroar, Frillish — `has_gender_differences` true). Abre su tarjeta con macho seleccionado; anota la imagen mostrada.
2. Cambia el selector a hembra. Confirma que la imagen cambia a la forma hembra (FR-008).
3. Repite con una especie de género dual sin diferencia visual conocida (p. ej. Pikachu). Cambia el selector y confirma que la imagen **no** cambia (FR-009).

### US4 — La imagen respeta el modo shiny al cambiar de género

1. Con la especie con diferencia visual por género de US3 abierta y el toggle de shiny **activado**, cambia el género. Confirma que la imagen mostrada es la variante shiny del nuevo género (FR-010).
2. Desactiva el toggle de shiny sin cambiar el género. Confirma que la imagen pasa a la variante no shiny del género actual (FR-012).
3. Con shiny desactivado, cambia el género. Confirma que la imagen es la variante no shiny del nuevo género (FR-011).

### Persistencia (spec.md Clarifications, 2026-09-07)

1. En un Pokémon de género dual, cambia el género a hembra. Cierra la tarjeta (botón de cerrar) y vuelve a abrirla haciendo clic en el mismo slot. Confirma que el selector sigue mostrando hembra (FR-013).
2. Confirma que la imagen del slot en la grilla de equipo también refleja hembra (no solo la tarjeta).
3. Agrega un segundo Pokémon de género dual distinto; confirma que abre con macho por defecto (no arrastra el género elegido para el primero) (FR-014).

## Automated checks

- Unit tests (Jasmine/Karma, `npm test` en `web/`):
  - `pokemon/domain/value-objects/gender.spec.ts` (nuevo) — `genderCapability`/`resolveDisplayGender` para los 4 casos de `genderRate` (-1, 0, 8, 1-7) × género guardado nulo/no nulo.
  - `team/infrastructure/in-memory-team.service.spec.ts` — nuevo caso para `toggleGender` (mirror de los de `toggleShiny`).
  - `team/presentation/pokemon-detail-modal.component.spec.ts` — nuevos casos: toggle visible solo si `dual`, indicador fijo en los otros 3 casos, `genderChange` se emite, la imagen resuelve las 4 combinaciones género × shiny.
  - `team/presentation/team-slot.component.spec.ts` — nuevo caso: el sprite del slot sigue al género guardado.
- E2E (Playwright, `npm run test:e2e` en `web/`): extender el flujo de equipo existente con un paso que abre la tarjeta de un Pokémon de género dual, alterna el selector, y verifica la imagen (US1/US3).
