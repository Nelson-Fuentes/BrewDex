# Quickstart de Validación: Sistema de Diseño Material Web-First y Responsive

**Feature**: `002-material-design-ui`

Esta guía valida de extremo a extremo que el sistema de diseño Material
(tema + responsive + rediseño de `game_selection`) funciona, sin incluir
código de implementación — ver `data-model.md` y `contracts/` para el
detalle de cada pieza.

## Prerrequisitos

- Flutter SDK (la versión ya fijada en `.metadata`/`pubspec.yaml`) y
  `flutter pub get` ejecutado.
- Un navegador Chrome disponible para el target Web.
- Un emulador/dispositivo Android disponible para el target mobile (o
  usar la ventana de Chrome redimensionada como sustituto rápido, ver
  Escenario 3).

## Escenario 1 — Consistencia visual en web (Historia de Usuario 1)

1. `flutter run -d chrome` y maximizar la ventana del navegador.
2. Recorrer la pantalla de selección de juego (búsqueda, filtro por
   generación, tarjetas de juego, lista de DLC).
3. **Resultado esperado**: colores, tipografía, espaciado y estilo de
   componentes (botones, tarjetas, chips) son consistentes en toda la
   pantalla y provienen de `BrewDexTheme` (ver
   `contracts/brew_dex_theme.md`) — sin estilos definidos de forma
   aislada en los widgets.

## Escenario 2 — Funcionalidad completa en mobile (Historia de Usuario 2)

1. `flutter run -d <android-emulator-id>` (o Chrome con DevTools en modo
   dispositivo móvil, ancho ≈375px).
2. Completar el flujo de selección de juego de principio a fin: buscar
   un juego, filtrar por generación, seleccionar uno.
3. **Resultado esperado**: cada acción disponible en el Escenario 1 está
   presente y es funcional; ningún control requiere desplazamiento
   horizontal ni queda cortado; las áreas táctiles son cómodas de tocar.

## Escenario 3 — Transición fluida entre tamaños (Historia de Usuario 3)

1. `flutter run -d chrome`.
2. Con la app corriendo, redimensionar la ventana del navegador
   progresivamente desde un ancho de escritorio (>840px) hasta un ancho
   móvil (<600px), pasando por el rango intermedio (600–839px).
3. **Resultado esperado**: en los umbrales definidos en
   `data-model.md`/`contracts/responsive_layout.md` (600dp, 840dp) la
   disposición cambia de variante sin elementos superpuestos ni
   cortados en ningún punto intermedio; no aparecen errores de overflow
   en la consola de Flutter.

## Verificación automatizada

- `flutter test test/shared/design_system/` — pruebas unitarias puras
  de `Breakpoints.resolve` en los valores límite (599/600/839/840) y
  aserciones de `BrewDexTheme.light`/`.dark`.
- `flutter test test/presentation/game_selection/` — pruebas de widget
  actualizadas que verifican que `game_selection_page.dart` renderiza la
  variante `compact` en un ancho angosto y la variante `expanded` en un
  ancho amplio.
- `flutter test integration_test/` (o `flutter drive`) — el flujo
  existente `game_selection_flow_test.dart`, ejecutado en ambos anchos
  representativos (mobile y web), sigue completándose sin errores.

## Resultados de accesibilidad (T029)

- **Contraste de color**: verificado automáticamente en
  `test/shared/design_system/theme/brew_dex_theme_contrast_test.dart`,
  que calcula la razón de contraste WCAG 2.1 sobre los pares de roles
  (`primary`/`onPrimary`, `surface`/`onSurface`, `error`/`onError`,
  `secondaryContainer`/`onSecondaryContainer`) de `BrewDexTheme.light` y
  `.dark`. Los 8 casos cumplen el mínimo AA (≥4.5:1) — resultado
  esperado, ya que `ColorScheme.fromSeed` de Material 3 garantiza
  contraste AA entre cada rol y su contraparte "on" por construcción.
- **Navegación por teclado/foco en web**: no se introdujo ningún
  `FocusNode` ni orden de foco personalizado — todos los controles
  (`TextField`, `ChoiceChip`, `FilterChip`, `ElevatedButton`, `GameCard`
  vía `InkWell`/`Material`) son los widgets Material estándar de
  Flutter, que participan en el `FocusTraversalGroup` por defecto que
  `MaterialApp` ya provee. No se detectaron regresiones de foco al
  introducir `AdaptiveScaffold`/`BrewDexTheme` (verificación manual
  recomendada con Tab/Shift+Tab en `flutter run -d chrome` antes de
  release, ya que este entorno de ejecución de la tarea no tiene acceso
  a un navegador interactivo).
- **Tamaño de áreas táctiles**: verificado automáticamente en
  `test/presentation/game_selection/game_selection_touch_target_test.dart`
  (≥44dp en el campo de búsqueda, chips de filtro/DLC y el botón
  principal a ancho compacto).

## Criterio de aceptación de la guía

Los tres escenarios manuales pasan y las tres verificaciones
automatizadas pasan en verde, sin advertencias de overflow en consola,
antes de considerar el feature listo para `/speckit-tasks` →
`/speckit-implement`.

## Notas de ejecución (T031/T032)

- **`flutter analyze`** y **`flutter test`** (73 pruebas, incluyendo las
  4 suites de `test/shared/design_system/` y las 6 nuevas suites de
  `test/presentation/game_selection/`) se ejecutaron en el entorno de
  implementación: 0 issues, 73/73 en verde.
- **Los 3 escenarios manuales de esta guía y `integration_test/`
  NO se pudieron ejecutar en el entorno donde se implementó este
  feature**: no había un target de escritorio Linux configurado, `flutter
  test`/`flutter drive` sobre `integration_test/` rechaza Chrome
  explícitamente ("Web devices are not supported for integration tests
  yet."), y no había un dispositivo/emulador Android ya iniciado.
  `integration_test/game_selection_flow_test.dart` sí se actualizó con
  los nuevos casos de las Historias 2 y 3 (ancho mobile de extremo a
  extremo; barrido de anchos sin overflow) y pasa `flutter analyze`,
  pero requiere ejecutarse con `flutter test integration_test/ -d
  <chrome-no-soportado|android|linux-configurado>` en un entorno con
  navegador/emulador real antes de darlo por validado.
- **Hallazgo real corregido durante la implementación** (no una
  suposición): al validar Historia 2 en un viewport de 320×720 con un
  juego con DLC activo, `GameSelectionPage` producía un
  `RenderFlex overflowed` real de 2.8px causado por el contenido interno
  de `GameCard` (icono + logo + etiqueta de generación) en una celda de
  grilla angosta. Se corrigió envolviendo ese contenido en `FittedBox`
  (game_card.dart) y convirtiendo el resto de la pantalla de un `Column`
  rígido con `Expanded` a una única región desplazable
  (`SingleChildScrollView`) en `game_selection_page.dart`.
- **Cuestión pre-existente detectada, no introducida por este feature**:
  `GameCard`'s `_LogoText` renderiza el título dos veces superpuesto
  (trazo + relleno) para el efecto de logo — por lo que `find.text(...)`
  siempre encuentra 2 coincidencias por tarjeta. Las pruebas nuevas de
  este feature usan un `Finder` dedicado sobre el propio `GameCard` para
  evitar la ambigüedad; los tests ya existentes de `001-select-game`
  (incluido `integration_test/game_selection_flow_test.dart` original)
  no se modificaron, ya que corregirlos está fuera del alcance de
  `002-material-design-ui`.
