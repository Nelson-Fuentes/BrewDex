import { Routes } from '@angular/router';

/**
 * Flujo de BrewDex (spec.md User Story 1 y 2): idioma → juego → equipo.
 * Cada página se carga perezosa (`loadComponent`) para que cada módulo de
 * negocio siga siendo una unidad independiente (plan.md, research.md
 * Decisión 11).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'idioma' },
  {
    path: 'idioma',
    loadComponent: () =>
      import('../language/presentation/language-selector.page').then(
        (m) => m.LanguageSelectorPage,
      ),
  },
  {
    path: 'juego',
    loadComponent: () =>
      import('../game/presentation/game-selection.page').then((m) => m.GameSelectionPage),
  },
  {
    path: 'equipo',
    loadComponent: () =>
      import('../team/presentation/team-builder.page').then((m) => m.TeamBuilderPage),
  },
  { path: '**', redirectTo: 'idioma' },
];
