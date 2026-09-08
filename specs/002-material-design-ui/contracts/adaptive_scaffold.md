# Contrato: `AdaptiveScaffold`

**Tipo**: Contrato de UI interno (widget Flutter compartido consumido
por toda pantalla de presentación).

**Ubicación**: `lib/shared/design_system/widgets/adaptive_scaffold.dart`

## Propósito

Cascarón de pantalla único que aplica el patrón de navegación/estructura
apropiado según el `ScreenSize` actual (FR-002, FR-003, FR-004), para
que ninguna pantalla reimplemente su propia variante de `Scaffold` para
mobile vs. web. Es el componente que consumen tanto la pantalla ya
existente (`game_selection`) como cualquier pantalla futura.

## Superficie pública

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `title` | `String` | Título mostrado en la barra superior en ambas variantes. |
| `body` | `Widget` | Contenido principal de la pantalla; se renderiza sin cambios de comportamiento entre variantes, solo cambia el contenedor alrededor. |
| `actions` | `List<Widget>?` | Acciones opcionales de la barra superior, visibles en ambas variantes. |

## Comportamiento por `ScreenSize`

| `ScreenSize` | Disposición aplicada |
|--------------|------------------------|
| `compact` (mobile) | `Scaffold` con `AppBar` estándar y `body` a ancho completo; controles con área táctil ampliada (FR-003, Historia 2). |
| `medium` (tablet/intermedio) | Igual que `compact`, con márgenes laterales adicionales para evitar contenido estirado de borde a borde. |
| `expanded` (web/escritorio) | `Scaffold` con `AppBar` y `body` acotado a un ancho máximo de contenido centrado (ver Casos Límite de `spec.md`: pantallas muy anchas no deben estirar el contenido de forma ilegible). |

## Consumidores

- `game_selection_page.dart` (reemplaza su `Scaffold`/`AppBar` actuales
  por `AdaptiveScaffold`).
- Cualquier pantalla futura que necesite el mismo cascarón consistente.

## Garantías

- Ninguna capacidad funcional disponible en `expanded` deja de estar
  disponible en `compact` (FR-004) — `AdaptiveScaffold` solo cambia
  disposición/contenedor, nunca oculta `body` ni `actions`.
- El cascarón usa `ResponsiveLayout`/`Breakpoints` internamente (ver
  `responsive_layout.md`) — no define su propia lógica de umbral.
