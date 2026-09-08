import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { SupportedLanguage } from '../domain/value-objects/supported-language';
import { flagEmojiForLanguage } from '../../shared/design-system/language-flag-emoji';

@Component({
  selector: 'app-language-option-tile',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="app-language-option-tile"
      [class.app-language-option-tile--selected]="selected()"
      [attr.aria-pressed]="selected()"
      (click)="select.emit()"
    >
      <span class="app-language-option-tile__flag">{{ flag() }}</span>
      <span class="app-language-option-tile__name">{{ language().displayName }}</span>
      <span class="app-language-option-tile__indicator" aria-hidden="true"></span>
    </button>
  `,
  styles: `
    .app-language-option-tile {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 1rem 1.25rem;
      border: 2px solid var(--mat-sys-outline-variant, #cac4d0);
      border-radius: var(--brewdex-corner-radius, 16px);
      background: var(--mat-sys-surface, #fff);
      cursor: pointer;
      text-align: left;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      position: relative;
    }
    .app-language-option-tile:hover,
    .app-language-option-tile:focus-visible {
      border-color: var(--mat-sys-primary, #673ab7);
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(103, 58, 183, 0.15);
    }
    .app-language-option-tile:active {
      transform: translateY(-1px);
    }
    .app-language-option-tile--selected {
      border-width: 2px;
      border-color: var(--mat-sys-primary, #673ab7);
      background: linear-gradient(135deg, var(--mat-sys-primary-container, #eaddff), var(--mat-sys-surface, #fff));
      box-shadow: 0 4px 16px rgba(103, 58, 183, 0.18);
    }
    .app-language-option-tile__flag {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      font-size: 1.75rem;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    .app-language-option-tile__name {
      flex: 1 1 auto;
      font-size: 1rem;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--mat-sys-on-surface, #1d1a22);
    }
    .app-language-option-tile__indicator {
      flex: 0 0 auto;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      border: 2px solid var(--mat-sys-outline, #79747e);
      box-sizing: border-box;
      transition: all 0.2s ease;
    }
    .app-language-option-tile--selected .app-language-option-tile__indicator {
      border-color: var(--mat-sys-primary, #673ab7);
      background: var(--mat-sys-primary, #673ab7);
      background-clip: content-box;
      padding: 3px;
    }
  `,
})
export class LanguageOptionTileComponent {
  readonly language = input.required<SupportedLanguage>();
  readonly selected = input(false);
  readonly select = output<void>();

  protected readonly flag = () => flagEmojiForLanguage(this.language().code);
}
