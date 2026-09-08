# Contrato: `Breakpoints` y `ResponsiveLayout`

**Tipo**: Contrato de UI interno (utilidad framework-free +
widget Flutter consumidos por toda pantalla de presentación).

**Ubicación**:
`lib/shared/design_system/layout/breakpoints.dart` (puro Dart) y
`lib/shared/design_system/layout/responsive_layout.dart` (widget).

## Propósito

Único punto de verdad para decidir qué variante de disposición
(`ScreenSize.compact` / `.medium` / `.expanded`) corresponde a un ancho
de viewport dado (FR-002, FR-003, FR-005), y para construir el árbol de
widgets correcto según esa variante sin duplicar la lógica de umbral en
cada pantalla.

## Superficie pública — `Breakpoints` (puro Dart, sin imports de Flutter)

| Miembro | Tipo | Descripción |
|---------|------|-------------|
| `Breakpoints.resolve(double width)` | `ScreenSize` | Función pura y total: todo ancho no negativo produce exactamente un `ScreenSize` (ver `data-model.md`). |
| `ScreenSize` | `enum { compact, medium, expanded }` | Las tres variantes de disposición soportadas. |

**Garantía de testabilidad**: `Breakpoints.resolve` se puede probar con
pruebas unitarias puras (sin `WidgetTester`, sin montar un árbol de
widgets), cubriendo los valores límite (599/600/839/840, ver
`data-model.md`).

## Superficie pública — `ResponsiveLayout` (widget)

| Miembro | Tipo | Descripción |
|---------|------|-------------|
| `ResponsiveLayout({required WidgetBuilder mobile, WidgetBuilder? medium, required WidgetBuilder web})` | `Widget` | Usa `Breakpoints.resolve` sobre el ancho actual (`MediaQuery`/`LayoutBuilder`) y construye `mobile` para `compact`, `web` para `expanded`, y `medium` para `medium` (con fallback a `mobile` si no se provee `medium`, ver Historia de Usuario 3). |

## Consumidores

- `game_selection_page.dart` y cualquier pantalla futura que necesite
  una disposición distinta entre mobile y web.
- Internamente, `AdaptiveScaffold` (ver `adaptive_scaffold.md`) construye
  su propio patrón de navegación sobre esta misma utilidad.

## Garantías

- Ningún widget de presentación implementa su propia lógica de umbral de
  ancho — todos delegan en `Breakpoints.resolve`/`ResponsiveLayout`, de
  modo que cambiar un umbral se hace en un único lugar.
- La reconstrucción ante cambio de ancho (redimensionar ventana, rotar
  dispositivo) es reactiva: no requiere reiniciar la pantalla ni perder
  estado de la pantalla (Historia de Usuario 3, Casos Límite).
