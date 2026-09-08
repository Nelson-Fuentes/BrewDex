import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import type { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';

/** Un tile del grid denso de la Pokédex (FR-008) — solo sprite + número,
 *  sin el chrome de una `mat-card` (research: grid de referencia).
 *  Puramente presentacional (Constitución Principio VI). */
@Component({
  selector: 'app-pokedex-entry-card',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="app-pokedex-tile"
      type="button"
      [attr.aria-label]="('pokedex.add' | transloco) + ': ' + entry().displayName"
      (click)="add.emit()"
    >
      <span class="app-pokedex-tile__number">#{{ entry().pokedexNumber }}</span>
      @if (entry().spriteUrl; as sprite) {
        <img [src]="sprite" [alt]="entry().displayName" width="64" height="64" loading="lazy" />
      } @else {
        <div class="app-pokedex-tile__placeholder" role="img" [attr.aria-label]="entry().displayName"></div>
      }
      <span class="app-pokedex-tile__name">{{ entry().displayName }}</span>
    </button>
  `,
  styles: `
    .app-pokedex-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      width: 100%;
      padding: 0.5rem 0.25rem 0.4rem;
      border: 1px solid var(--mat-sys-outline-variant, rgba(0, 0, 0, 0.08));
      border-radius: var(--brewdex-corner-radius, 16px);
      background: var(--mat-sys-surface, #fff);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .app-pokedex-tile:hover,
    .app-pokedex-tile:focus-visible {
      border-color: var(--mat-sys-primary, #673ab7);
      box-shadow: 0 6px 16px rgba(103, 58, 183, 0.18);
      transform: translateY(-3px);
    }
    .app-pokedex-tile:active {
      transform: translateY(-1px);
    }
    .app-pokedex-tile__number {
      font-size: 0.65rem;
      font-weight: 700;
      opacity: 0.55;
    }
    .app-pokedex-tile img {
      width: 64px;
      height: 64px;
      object-fit: contain;
      image-rendering: pixelated;
      transition: transform 0.2s ease;
    }
    .app-pokedex-tile:hover img {
      transform: scale(1.08);
    }
    .app-pokedex-tile__placeholder {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--mat-sys-surface-variant, #eee);
    }
    .app-pokedex-tile__name {
      font-size: 0.72rem;
      font-weight: 700;
      text-align: center;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--mat-sys-on-surface, #1d1a22);
    }
  `,
})
export class PokedexEntryCardComponent {
  readonly entry = input.required<PokedexEntry>();
  readonly add = output<void>();
}
