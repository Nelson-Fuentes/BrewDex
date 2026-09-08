# Contrato: `BrewDexTheme`

**Tipo**: Contrato de UI interno (API de widget/tema Flutter consumida
por `MaterialApp` y por toda pantalla de presentación).

**Ubicación**: `lib/shared/design_system/theme/brew_dex_theme.dart`

## Propósito

Punto único de verdad para los estilos visuales de toda la aplicación
(FR-001, FR-007). Ninguna pantalla o widget de presentación debe
declarar sus propios colores, tipografía o formas fuera de este
contrato.

## Superficie pública

| Miembro | Tipo | Descripción |
|---------|------|-------------|
| `BrewDexTheme.light` | `ThemeData` (getter estático) | Tema Material 3 claro, `useMaterial3: true`, `ColorScheme.fromSeed` sobre el color semilla de marca de BrewDex. |
| `BrewDexTheme.dark` | `ThemeData` (getter estático) | Equivalente oscuro de `light`, mismos tokens de tipografía/forma. |

## Consumidores

- `main.dart` (`MaterialApp(theme: BrewDexTheme.light, darkTheme:
  BrewDexTheme.dark, themeMode: ThemeMode.system)`).
- Cualquier widget de presentación que necesite un color/estilo lee el
  `Theme.of(context)` resultante — no debe importar `Colors.*` ni
  definir `TextStyle`/`ColorScheme` propios.

## Garantías

- `light` y `dark` exponen exactamente los mismos roles de `ColorScheme`
  y la misma escala de `TextTheme` — solo cambia `brightness` y los
  valores de color, nunca la estructura.
- Cambiar el color semilla o la escala tipográfica se hace en un único
  lugar (este archivo) y se propaga a toda la app.

## No incluido en este contrato

- Selección manual de tema (ver `research.md` Decisión 3) — fuera de
  alcance de esta iteración.
- Breakpoints/disposición responsive — ver `responsive_layout.md` y
  `adaptive_scaffold.md`.
