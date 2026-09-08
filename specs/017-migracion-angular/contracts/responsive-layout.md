# Contract: layout responsive

## `ScreenSize` y `resolveScreenSize` (dominio/diseño puro)

```ts
export type ScreenSize = 'compact' | 'medium' | 'expanded';

export abstract class Breakpoints {
  /** Por debajo de este ancho aplica 'compact'. */
  static readonly compact = 600;
  /** Por debajo de este ancho (y desde `compact`) aplica 'medium'; desde
   *  este ancho en adelante aplica 'expanded'. */
  static readonly expanded = 840;

  /** Mapeo puro y total de un ancho de viewport no negativo a la
   *  variante ScreenSize correspondiente — única fuente de verdad para
   *  estos umbrales (FR-019); ningún componente debe hardcodear su
   *  propio chequeo de ancho. */
  static resolve(width: number): ScreenSize {
    if (width < Breakpoints.compact) return 'compact';
    if (width < Breakpoints.expanded) return 'medium';
    return 'expanded';
  }
}
```

Vive en `web/src/shared/design-system/breakpoints.ts` — la única pieza de `shared/` que cada módulo puede importar libremente sin romper el Principio VI (es diseño puro, no dominio de negocio de ningún módulo). Sin imports de Angular, unit-testable con Karma/Jasmine sin levantar ningún componente (igual que `breakpoints.dart`).

## `ViewportService` (infraestructura — única pieza consciente del navegador)

```ts
export interface ViewportService {
  /** Ancho de viewport actual como signal, alimentado por
   *  `@angular/cdk/layout` BreakpointObserver (o `window.resize` como
   *  fallback). Los componentes derivan su ScreenSize con
   *  `computed(() => Breakpoints.resolve(viewportService.width()))`. */
  readonly width: Signal<number>;
}
```

## Layouts que consumen `ScreenSize`

- **`compact`/`medium`**: columna única, apilada y scrolleable (selector de juego, Pokédex + slots del constructor de equipo uno sobre otro) — combina `presentation/` de `game`, `pokedex` y `team`.
- **`expanded`**: panel de dos columnas — slots del equipo (`team/presentation/`) a la izquierda, Pokédex (`pokedex/presentation/`, búsqueda/filtros/grid) a la derecha, cada uno con su propio scroll independiente (FR-019, mismo comportamiento que `TeamBuilderTwoPaneLayout` en Flutter).

Ningún dato de negocio (Pokédex, roster, catálogo de juegos) depende de `ScreenSize` — es una decisión exclusivamente de presentación, consumida por los componentes de `<módulo>/presentation/**` de cualquier módulo a través del signal `computed`, nunca por su propio `application/**` ni `domain/**`.
