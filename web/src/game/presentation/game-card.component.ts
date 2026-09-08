import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

import type { Game } from '../domain/entities/game';
import { colorForGame } from '../../shared/design-system/pokemon-game-colors';

/** Una opción de juego en el grid del selector (FR-003, FR-004) — tarjeta
 *  clara con una insignia de generación de color propio por juego y un
 *  ícono de pokeball, no una `mat-card` genérica (estilo `020`, adaptado
 *  de la referencia visual aportada: insignias en vez de fondo a color
 *  completo). Puramente presentacional (Constitución Principio VI). */
@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [MatIconModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="app-game-card"
      type="button"
      [style.--card-accent-color]="cardColor()"
      [class.app-game-card--selected]="selected()"
      [attr.aria-pressed]="selected()"
      (click)="select.emit()"
    >
      <header class="app-game-card__header">
        <span class="app-game-card__generation" [style.background]="cardColor()">{{ game().generation.label }}</span>
        <mat-icon class="app-game-card__pokeball" aria-hidden="true">catching_pokemon</mat-icon>
      </header>
      <span class="app-game-card__title">{{ game().displayName }}</span>
      @if (selected()) {
        <span class="app-game-card__indicator" aria-hidden="true">
          <mat-icon>check</mat-icon>
        </span>
      }
    </button>
  `,
  styles: `
    .app-game-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.65rem;
      position: relative;
      width: 100%;
      min-height: 110px;
      padding: 1rem 1.15rem;
      border: 2px solid var(--mat-sys-outline-variant, #cac4d0);
      border-radius: var(--brewdex-corner-radius, 16px);
      cursor: pointer;
      color: var(--mat-sys-on-surface, #1d1a22);
      text-align: left;
      background: var(--mat-sys-surface, #fff);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .app-game-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--card-accent-color, var(--mat-sys-primary, #673ab7));
      opacity: 0.85;
      transition: height 0.2s ease;
    }
    .app-game-card:hover::before {
      height: 6px;
    }
    .app-game-card:hover,
    .app-game-card:focus-visible {
      border-color: var(--mat-sys-primary, #673ab7);
      transform: translateY(-4px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
    }
    .app-game-card--selected {
      border-width: 2px;
      border-color: var(--mat-sys-primary, #673ab7);
      background: linear-gradient(135deg, var(--mat-sys-primary-container, #eaddff), var(--mat-sys-surface, #fff));
      box-shadow: 0 6px 20px rgba(103, 58, 183, 0.16);
    }
    .app-game-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .app-game-card__generation {
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #fff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    .app-game-card__pokeball {
      opacity: 0.5;
      transition: opacity 0.2s ease, transform 0.3s ease;
    }
    .app-game-card:hover .app-game-card__pokeball {
      opacity: 0.9;
      transform: rotate(20deg);
    }
    .app-game-card__title {
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }
    .app-game-card__indicator {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--mat-sys-primary, #673ab7);
      color: #fff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .app-game-card__indicator mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
  `,
})
export class GameCardComponent {
  readonly game = input.required<Game>();
  readonly selected = input(false);
  readonly select = output<void>();

  protected readonly cardColor = () => colorForGame(this.game().id);
}
