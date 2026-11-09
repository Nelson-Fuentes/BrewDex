import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ViewportService } from '../../shared/design-system/viewport.service';

/**
 * El layout `compact`/`medium` (columna única apilada) vs. `expanded`
 * (panel de dos columnas) del constructor de equipo (FR-019,
 * contracts/responsive-layout.md) — reproduce
 * `TeamBuilderTwoPaneLayout` de la versión Flutter. Puramente
 * estructural: recibe el contenido de cada panel por proyección de
 * contenido (`ng-content`), sin conocer `TeamStore`/`PokedexStore`
 * (Constitución Principio VI).
 */
@Component({
  selector: 'app-team-builder-two-pane-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isExpanded()) {
      <div class="app-two-pane app-two-pane--expanded">
        <section class="app-two-pane__team"><ng-content select="[slot=team]" /></section>
        <section class="app-two-pane__pokedex"><ng-content select="[slot=pokedex]" /></section>
      </div>
    } @else {
      <div class="app-two-pane app-two-pane--stacked">
        <section><ng-content select="[slot=team]" /></section>
        <section><ng-content select="[slot=pokedex]" /></section>
      </div>
    }
  `,
  styles: `
    .app-two-pane--expanded {
      display: flex;
      align-items: stretch;
      height: 100%;
    }
    .app-two-pane__team,
    .app-two-pane__pokedex {
      flex: 1 1 0;
      overflow-y: auto;
    }
    .app-two-pane--stacked {
      display: flex;
      flex-direction: column;
    }
  `,
})
export class TeamBuilderTwoPaneLayoutComponent {
  private readonly viewport = inject(ViewportService);

  protected readonly isExpanded = computed(() => this.viewport.screenSize() === 'expanded');
}
