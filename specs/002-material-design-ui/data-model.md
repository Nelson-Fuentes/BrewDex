# Fase 1 – Modelo de Datos: Sistema de Diseño Material Web-First y Responsive

**Feature**: `002-material-design-ui` | **Fecha**: 2026-08-22

Este feature no introduce entidades de negocio persistentes ni nuevo
almacenamiento: la persistencia existente de `game_selection` (juego
seleccionado, vía `shared_preferences`) no cambia. Las "Entidades Clave"
descritas en `spec.md` (Tema, Punto de Quiebre) son objetos de
configuración/política, derivados en cada render y sin estado propio que
persistir. Se documentan aquí como tal.

## Tema (`BrewDexTheme` / `ThemeVariant`)

Conjunto consistente de decisiones de diseño visual aplicado en toda la
app. No es una entidad con identidad ni ciclo de vida — es un valor
calculado una vez por variante (claro/oscuro) y consumido por lectura.

| Atributo | Descripción |
|----------|-------------|
| `brightness` | `light` o `dark` — cuál de las dos variantes es. |
| `colorScheme` | Roles de color de Material 3 (primary, secondary, tertiary, surface, error, etc.) derivados de un color semilla único, para que ambas variantes compartan identidad de marca. |
| `textTheme` | Escala tipográfica de Material 3 (display/headline/title/body/label) aplicada de forma uniforme. |
| `shape` | Tokens de forma/radio de esquina compartidos por los componentes (tarjetas, botones, campos). |

**Reglas de validación**:
- Debe existir exactamente una variante `light` y una `dark` — ninguna
  pantalla debe definir colores o tipografía fuera de `BrewDexTheme`
  (FR-001, FR-007).
- La variante activa se resuelve por el brillo del sistema operativo
  (`ThemeMode.system`, ver `research.md` Decisión 3) — no se persiste
  una preferencia propia en esta iteración.

**Transiciones de estado**: Ninguna — la variante activa se recalcula en
cada frame a partir de `MediaQuery.platformBrightnessOf`; no hay un
ciclo de vida propio que rastrear.

## Punto de Quiebre (`ScreenSize` / `Breakpoints`)

Umbral de ancho de viewport que determina qué variante de disposición
(móvil o web) se muestra para una pantalla dada.

| Atributo | Descripción |
|----------|-------------|
| `ScreenSize` (enum) | `compact` (móvil), `medium` (intermedio/tablet), `expanded` (web/escritorio). |
| Umbral `compact` | ancho de viewport < 600dp. |
| Umbral `medium` | 600dp ≤ ancho < 840dp. |
| Umbral `expanded` | ancho ≥ 840dp. |

**Reglas de validación**:
- El mapeo ancho→`ScreenSize` es una función pura y total: todo ancho de
  viewport no negativo produce exactamente un `ScreenSize` (FR-005).
- Los tres tramos son contiguos y no se solapan; los límites (600, 840)
  están alineados a la guía adaptativa de Material 3 (ver
  `research.md` Decisión 2).

**Transiciones de estado**: Ninguna con estado propio — `ScreenSize` se
recalcula en cada cambio de tamaño de viewport (redimensionar ventana,
rotar dispositivo) a partir del ancho actual; es un valor derivado, no
algo que se guarda.

## Relación entre ambos

`AdaptiveScaffold` (ver `contracts/adaptive_scaffold.md`) consume
`ScreenSize` para elegir el patrón de navegación/disposición, mientras
que `BrewDexTheme` provee los estilos visuales compartidos —ambos ejes
son independientes entre sí: cualquier `ScreenSize` puede combinarse con
cualquier variante de `BrewDexTheme`.
