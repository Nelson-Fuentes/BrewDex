import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@jsverse/transloco';

import { InMemoryGameService } from '../infrastructure/in-memory-game.service';
import { GameCardComponent } from './game-card.component';
import { GameSearchBarComponent } from './game-search-bar.component';
import { GenerationFilterComponent } from './generation-filter.component';
import type { Game } from '../domain/entities/game';

/**
 * User Story 1 (spec.md), segundo paso: catálogo de juegos filtrable por
 * nombre/generación (FR-004). Entry-point adapter delgado — el filtrado en
 * cliente vive acá (no requiere una nueva llamada HTTP) pero toda la
 * selección/estado de sesión vive en {@link InMemoryGameService}
 * (Constitución Principio VI). Elegir una tarjeta navega de inmediato
 * (FR-004, `018`) — por eso los toggles de DLC (FR-009, `018`) ya NO viven
 * acá: no hay ventana de tiempo para interactuar con ellos antes de
 * navegar. Viven en la pantalla de Pokédex (`pokedex/presentation/
 * pokedex-browser.component.ts`), la única vía de FR-009's "alongside the
 * game's main/regional Pokedex section".
 */
@Component({
  selector: 'app-game-selection-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoModule,
    GameCardComponent,
    GameSearchBarComponent,
    GenerationFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-page-header">
      <button
        data-testid="back-button"
        mat-icon-button
        type="button"
        class="app-back-btn"
        [attr.aria-label]="'common.back' | transloco"
        (click)="goBack()"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="app-brand-title">{{ 'game.title' | transloco }}</h1>
    </div>

    <div class="app-page-container app-game-page">
      @switch (gameService.status()) {
        @case ('loading') {
          <div class="app-centered-state" role="status" aria-live="polite">
            <mat-spinner diameter="40" />
            <p>{{ 'common.loading' | transloco }}</p>
          </div>
        }
        @case ('error') {
          <div class="app-centered-state" role="status" aria-live="polite">
            <p>{{ 'common.errorTitle' | transloco }}</p>
            <p>{{ 'common.errorBody' | transloco }}</p>
            <button mat-stroked-button type="button" (click)="gameService.load()">
              {{ 'common.retry' | transloco }}
            </button>
          </div>
        }
        @case ('ready') {
          <div class="app-filters">
            <app-game-search-bar [searchText]="searchText()" (searchTextChange)="searchText.set($event)" />
            <app-generation-filter
              [generations]="availableGenerations()"
              [selectedGenerationId]="selectedGenerationId()"
              (generationIdChange)="selectedGenerationId.set($event)"
            />
          </div>

          @if (filteredGames().length === 0) {
            <div class="app-empty-results">
              <mat-icon>search_off</mat-icon>
              <p>{{ 'game.noResults' | transloco }}</p>
            </div>
          } @else {
            <div class="app-game-grid">
              @for (game of filteredGames(); track game.id) {
                <app-game-card
                  [game]="game"
                  [selected]="game.id === gameService.activeGame()?.id"
                  (select)="onSelectGame(game)"
                />
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: `
    .app-game-page {
      animation: appFadeIn 0.3s ease-out;
    }
    .app-page-header {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      max-width: var(--brewdex-page-max-width, 1000px);
      margin: 0 auto;
      padding: 1rem 1rem 0;
    }
    .app-back-btn {
      position: absolute;
      left: 1rem;
    }
    .app-centered-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem 2rem;
    }
    .app-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0 1.5rem;
    }
    .app-empty-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 3rem 1rem;
      opacity: 0.7;
    }
    .app-empty-results mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
    }
    .app-game-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
      padding-bottom: 2rem;
    }
  `,
})
export class GameSelectionPage {
  protected readonly gameService = inject(InMemoryGameService);
  private readonly router = inject(Router);

  protected readonly searchText = signal('');
  protected readonly selectedGenerationId = signal<string | null>(null);

  protected readonly availableGenerations = computed(() => {
    const byId = new Map(this.gameService.catalog().map((game) => [game.generation.id, game.generation]));
    return [...byId.values()];
  });

  protected readonly filteredGames = computed<Game[]>(() => {
    const search = this.searchText().trim().toLowerCase();
    const generationId = this.selectedGenerationId();
    return this.gameService
      .catalog()
      .filter((game) => !search || game.displayName.toLowerCase().includes(search))
      .filter((game) => !generationId || game.generation.id === generationId);
  });

  /** FR-005: vuelve al paso anterior del flujo de onboarding. */
  goBack(): void {
    void this.router.navigateByUrl('/idioma');
  }

  /** FR-004: elegir una tarjeta navega directo — sin botón "Seleccionar".
   *  Un cambio de juego descarta el equipo en curso por defecto, sin
   *  pedir confirmación (spec `019`) — `GameStore`/`TeamStore` ya se
   *  encargan de vaciar el roster cuando el juego activo cambia (ver
   *  in-memory-team.service.ts, FR-016). Reelegir el juego YA activo no
   *  vuelve a llamar `selectGame` (evita resetear los DLC activos sin
   *  necesidad) pero SÍ navega — volver atrás y elegir el mismo juego
   *  debe seguir dejando entrar (spec `019`). */
  onSelectGame(game: Game): void {
    if (game.id !== this.gameService.activeGame()?.id) {
      this.gameService.selectGame(game);
    }
    void this.router.navigateByUrl('/equipo');
  }
}
