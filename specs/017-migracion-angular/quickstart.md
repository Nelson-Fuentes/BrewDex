# Quickstart: validar la migración a Angular

Guía para levantar la app y comprobar de punta a punta las dos User Stories P1 de [spec.md](./spec.md) (idioma+juego, y construcción de equipo). No repite el detalle de arquitectura — ver [plan.md](./plan.md), [data-model.md](./data-model.md) y [contracts/](./contracts/).

## Prerrequisitos

- Node.js LTS (≥20) y npm.
- Conexión a internet (la app consume `https://pokeapi.co/api/v2/` en vivo — no hay backend propio ni datos de prueba embebidos).
- Sin variables de entorno ni credenciales: PokeAPI es pública y no requiere API key.

## Levantar el proyecto

```bash
cd web
npm install
npm start            # ng serve — http://localhost:4200
```

## Validar User Story 1 — Elegir idioma y juego al entrar

1. Abrir `http://localhost:4200` en una pestaña nueva (o en incógnito, para partir sin ningún estado previo — no debería importar, ya que la app no persiste nada, FR-015).
2. **Comprobar**: aparece el selector de idioma con una preselección razonable (idioma del navegador si está soportado, si no el default) — spec.md User Story 1, escenario 1.
3. Elegir un idioma distinto al preseleccionado. **Comprobar**: toda la interfaz visible cambia a ese idioma de inmediato, sin recargar la página.
4. Avanzar al selector de juego. Buscar por nombre y filtrar por generación. **Comprobar**: la lista se acota a lo que coincide con ambos criterios combinados.
5. Elegir un juego con DLC conocido (p. ej. Espada/Escudo). **Comprobar**: aparecen sus expansiones como opciones activables (no como juegos aparte); activar una y verificar que queda reflejada en la vista de Pokédex que se abre después (User Story 2).

**Resultado esperado**: los cuatro escenarios de aceptación de User Story 1 (spec.md) pasan sin recargar la página entre pasos.

## Validar User Story 2 — Construir un equipo de hasta 6 Pokémon

Continuando desde el juego elegido arriba:

1. En la Pokédex, buscar por nombre y luego filtrar por tipo. **Comprobar**: la lista muestra solo lo que cumple ambos filtros a la vez.
2. Agregar una entrada al equipo. **Comprobar**: ocupa el primer slot vacío; se aplica automáticamente un moveset por defecto (visible al abrir el slot).
3. Repetir hasta llenar los 6 slots, luego intentar agregar un séptimo Pokémon. **Comprobar**: el sistema lo impide y explica por qué (FR-011).
4. Elegir un Pokémon con formas o variantes conocidas (p. ej. Rotom, o un Pokémon con variante regional en el juego elegido). **Comprobar**: el selector de forma ofrece las variantes válidas para ese juego.
5. Abrir la selección de movimientos de un slot y reemplazar uno del moveset por defecto por otro válido. **Comprobar**: el cambio se refleja de inmediato en ese slot.
6. Quitar un Pokémon de un slot. **Comprobar**: el slot vuelve a estar vacío y disponible para un nuevo Pokémon.
7. Recargar la página (F5). **Comprobar** (FR-015): la app vuelve al estado inicial — sin idioma, juego, DLC ni equipo previos — igual que la primera vez que se abrió.

**Resultado esperado**: los seis escenarios de aceptación de User Story 2 (spec.md) pasan, y el paso 7 confirma que no hay persistencia de ningún tipo.

## Validar accesibilidad y soporte responsive (FR-019, FR-024, SC-007)

```bash
npm run test:e2e      # Playwright — recorre User Story 1 y 2 en Chromium/Firefox/WebKit
                       # e incluye la auditoría @axe-core/playwright contra WCAG 2.1 AA
```

Manualmente: redimensionar la ventana del navegador (o usar las herramientas de dispositivo) cruzando los 600px y 840px de ancho (ver [contracts/responsive-layout.md](./contracts/responsive-layout.md)) y confirmar que el layout pasa de columna única apilada a panel de dos columnas sin perder acceso a ninguna función.

## Validar instalabilidad (PWA, FR-023, SC-006)

```bash
npm run build          # ng build — genera dist/ con el service worker (ngsw) habilitado
npx http-server dist/web/browser -p 8080   # el service worker solo se activa servido, no en `ng serve`
```

Abrir `http://localhost:8080` en Chrome/Edge de escritorio o Android: debe ofrecerse la opción "Instalar app" (ícono en la barra de direcciones, o menú del navegador). Instalarla y confirmar que abre en su propia ventana, con su propio ícono — sin necesitar conexión offline (Assumptions: el funcionamiento sin conexión queda fuera de alcance).

## Qué NO debería pasar (regresiones a vigilar)

- **Cualquier escritura a `localStorage`/`indexedDB`/cookies** desde el `application/` o `infrastructure/` de cualquier módulo — viola FR-015. Un test unitario en `TeamStore`/`PokedexStore`/`GameStore`/`LanguageStore` debe fallar si se introduce alguna.
- **`ngsw-config.json` con un `dataGroups` para PokeAPI** — reintroduciría caché de datos entre sesiones, en tensión con FR-015 y con la Decisión 6 de [research.md](./research.md).
- **Un `import` de `@angular/*` dentro del `domain/` de cualquier módulo** — viola la Constitución Principio VI; debe fallar el lint (`angular-eslint` + una regla de import boundaries, p. ej. `eslint-plugin-boundaries`) antes de llegar a review.
- **Un módulo importando el `infrastructure/` o `presentation/` interno de otro módulo directamente** (en vez de un puerto de `contracts/`) — viola la organización por slices de [research.md](./research.md) Decisión 11; la misma regla de import boundaries del punto anterior debe bloquearlo (p. ej. `pokedex` solo puede depender del `PokemonRepository` de `pokemon`, nunca de `PokeApiPokemonRepositoryService` directamente).
