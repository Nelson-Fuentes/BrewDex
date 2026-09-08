# Fase 0 – Investigación: Sistema de Diseño Material Web-First y Responsive

**Feature**: `002-material-design-ui` | **Fecha**: 2026-08-22

Todos los aspectos del Technical Context quedaron resueltos con defaults
razonables a partir del código ya existente (BrewDex es un único paquete
Flutter, Android + Web, sin backend) y de la especificación. No quedan
marcadores `NEEDS CLARIFICATION`. Este documento registra las decisiones
técnicas y su justificación.

## Decisión 1: Theming vía Material 3 nativo de Flutter (sin paquete nuevo)

- **Decisión**: Construir el sistema de temas (claro/oscuro) usando las
  APIs de Material 3 ya incluidas en el SDK de Flutter (`useMaterial3:
  true`, `ColorScheme.fromSeed`, `ThemeData.light/dark`), centralizadas
  en un único punto (`BrewDexTheme`) en lugar de adoptar un paquete de
  design system de terceros.
- **Justificación**: `pubspec.yaml` ya declara `uses-material-design:
  true` y el proyecto usa `ThemeData(colorScheme: ColorScheme.fromSeed(...))`
  en `main.dart`. El SDK ya provee todo lo necesario (tokens de color,
  tipografía, forma, elevación) sin dependencia adicional — Principio I
  (Simplicidad y YAGNI) exige justificar cualquier dependencia nueva y
  aquí no hay una necesidad concreta que el SDK no cubra.
- **Alternativas consideradas**: paquetes de theming/design-system de
  terceros — rechazados por no aportar una necesidad concreta sobre lo
  que Material 3 nativo ya resuelve.

## Decisión 2: Utilidad de breakpoints propia y framework-free

- **Decisión**: Implementar el mapeo ancho-de-viewport → variante de
  disposición (`ScreenSize`: compact/medium/expanded) como una utilidad
  Dart plana (sin imports de Flutter), con umbrales alineados a la guía
  adaptativa de Material 3: compacto <600dp, mediano 600–839dp, expandido
  ≥840dp.
- **Justificación**: El requisito es un mapeo simple ancho→variante
  (FR-005); una utilidad propia es testeable con pruebas unitarias
  puras, sin necesidad de montar un árbol de widgets (alineado al
  espíritu de testabilidad del Principio II), y evita añadir un paquete
  externo para una necesidad tan acotada (Principio I).
- **Alternativas consideradas**: `responsive_framework` (auto-escalado,
  más opinado, dependencia adicional) y `flutter_screenutil` (resuelve
  escalado por densidad de píxeles, un problema distinto al de cambiar
  de variante de layout) — ambos rechazados por no estar justificados
  por una necesidad concreta que la utilidad propia no resuelva.

## Decisión 3: Tema sigue el brillo del sistema (`ThemeMode.system`), sin selector manual

- **Decisión**: La app usa `ThemeMode.system` para alternar entre tema
  claro y oscuro, sin ofrecer un selector manual en esta iteración.
- **Justificación**: La especificación (FR-007) solo exige que existan
  variantes clara y oscura siguiendo las convenciones de Material; no
  pide un control manual. Seguir el brillo del sistema es el
  comportamiento por defecto recomendado por Material y no requiere
  persistencia nueva — mantiene el alcance mínimo (Principio I). Un
  selector manual podría añadirse como feature propio si se solicita.
- **Alternativas consideradas**: selector manual persistido reutilizando
  `shared_preferences` (ya una dependencia del proyecto) — postergado
  por falta de un requisito concreto que lo exija todavía.

## Decisión 4: Cascarón de navegación adaptativo compartido (`AdaptiveScaffold`)

- **Decisión**: Un único widget compartido decide, según el
  `ScreenSize` actual, si mostrar un patrón de navegación de escritorio
  (barra superior únicamente, dado que hoy la app es de una sola
  pantalla, con capacidad de extenderse a un nav rail cuando exista más
  de una sección) o un patrón mobile (barra superior + contenido
  apilado verticalmente, área táctil ampliada).
- **Justificación**: Satisface FR-002/FR-003/FR-005 (disposición
  principal web, disposición adaptada mobile, reflow por breakpoints)
  sin duplicar lógica de layout por pantalla; es el mismo componente
  compartido que consumirá tanto la pantalla ya existente
  (`game_selection`) como cualquier pantalla futura.
- **Alternativas consideradas**: layout adaptativo definido de forma
  independiente en cada pantalla — rechazado porque duplicaría lógica
  en cuanto exista una segunda pantalla, y rompería la consistencia que
  pide la Historia de Usuario 1.

## Decisión 5: Alcance incluye rediseñar `game_selection` ya existente

- **Decisión**: Este feature actualiza en el mismo alcance tanto la
  base del sistema de diseño (tema, breakpoints, `AdaptiveScaffold`)
  como la pantalla y widgets ya existentes de `game_selection`
  (`game_selection_page.dart`, `game_card.dart`, `game_search_bar.dart`,
  `generation_filter.dart`, `dlc_toggle_list.dart`) para que consuman
  ese sistema.
- **Justificación**: Confirmado explícitamente por el usuario como
  respuesta a la clarificación de FR-009 durante `/speckit-specify`.
- **Alternativas consideradas**: alcance limitado solo a la base para
  features futuros — descartado por la respuesta explícita del usuario.

## Decisión 6: Sin capa de dominio/puertos nueva para este feature

- **Decisión**: El sistema de diseño (tema, breakpoints, cascarón
  adaptativo) vive enteramente como utilidades compartidas y widgets de
  presentación (`lib/shared/design_system/`); no se crea un nuevo
  bounded context con `domain/`/`application/`/puertos.
- **Justificación**: El Principio VI (Hexagonal/Clean/DDD) exige aislar
  el dominio de infraestructura externa vía puertos y adaptadores; este
  feature no introduce ninguna dependencia externa (red, almacenamiento,
  APIs de terceros) que deba abstraerse detrás de un puerto — es
  configuración/presentación pura sobre el SDK de Flutter que la propia
  app ya usa en su capa de presentación. La única lógica no trivial
  (mapeo ancho→variante) se mantiene igualmente framework-free y
  unit-testeable, preservando el espíritu de testabilidad sin forzar
  puertos donde no hay nada que sustituir.
- **Alternativas consideradas**: modelar `Theme`/`Breakpoint` como un
  bounded context DDD completo con puertos — rechazado por
  sobre-ingeniería (Principio I): no existe una implementación
  alternativa intercambiable que un puerto necesite abstraer.

**Salida**: Todas las decisiones técnicas están resueltas; no quedan
`NEEDS CLARIFICATION` pendientes para la Fase 1.
