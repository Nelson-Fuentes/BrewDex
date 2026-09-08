import { Injectable, computed, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';

import { Breakpoints, type ScreenSize } from './breakpoints';

/**
 * Única pieza de infraestructura consciente del navegador para el layout
 * responsive (contracts/responsive-layout.md) — envuelve
 * `BreakpointObserver` de Angular CDK y expone el `ScreenSize` resuelto
 * como signal, para que los componentes de `presentation/` de cualquier
 * módulo deriven su layout con
 * `computed(() => viewportService.screenSize())` sin volver a tocar
 * `window` directamente.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly widthSignal = signal(
    typeof window === 'undefined' ? Breakpoints.expanded : window.innerWidth,
  );

  /** Ancho de viewport actual, en píxeles CSS. */
  readonly width = this.widthSignal.asReadonly();

  /** El `ScreenSize` (`compact`/`medium`/`expanded`) del ancho actual. */
  readonly screenSize = computed<ScreenSize>(() => Breakpoints.resolve(this.widthSignal()));

  constructor(breakpointObserver: BreakpointObserver) {
    breakpointObserver
      .observe([
        `(max-width: ${Breakpoints.compact - 1}px)`,
        `(min-width: ${Breakpoints.compact}px) and (max-width: ${Breakpoints.expanded - 1}px)`,
        `(min-width: ${Breakpoints.expanded}px)`,
      ])
      .subscribe(() => {
        if (typeof window !== 'undefined') {
          this.widthSignal.set(window.innerWidth);
        }
      });
  }
}
