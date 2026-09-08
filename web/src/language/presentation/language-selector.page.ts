import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@jsverse/transloco';

import { InMemoryActiveLanguageService } from '../infrastructure/in-memory-active-language.service';
import { LanguageOptionTileComponent } from './language-option-tile.component';

/**
 * User Story 1 (spec.md), primer paso: selector de idioma con
 * preselección razonable (FR-003) y cambio inmediato al elegir otro
 * (FR-003). Entry-point adapter delgado — toda la lógica vive en
 * {@link InMemoryActiveLanguageService} (Constitución Principio VI).
 *
 * `019`: grilla de 2 columnas de tarjetas (en vez de una lista vertical),
 * cada opción con largo acotado y margen visible entre ellas (FR-001).
 */
@Component({
  selector: 'app-language-selector-page',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, TranslocoModule, LanguageOptionTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-page-container app-language-page">
      <h1 class="app-brand-title">{{ 'language.title' | transloco }}</h1>
      <p class="app-page-subtitle">BrewDex — Team Builder</p>

      @switch (languageService.status()) {
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
            <button mat-stroked-button type="button" (click)="languageService.load()">
              {{ 'common.retry' | transloco }}
            </button>
          </div>
        }
        @case ('ready') {
          <div class="app-language-grid">
            @for (language of languageService.supportedLanguages(); track language.code) {
              <app-language-option-tile
                [language]="language"
                [selected]="language.code === languageService.activeLanguageCode()"
                (select)="onSelectLanguage(language.code)"
              />
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .app-language-page {
      padding-top: 2rem;
      animation: appFadeIn 0.3s ease-out;
    }
    .app-centered-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem 2rem;
    }
    .app-language-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem;
      max-width: 640px;
      margin: 1rem auto 0;
      padding: 0 0.5rem;
    }
    @media (max-width: 480px) {
      .app-language-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LanguageSelectorPage {
  protected readonly languageService = inject(InMemoryActiveLanguageService);
  private readonly router = inject(Router);

  /** FR-002: elegir un idioma navega directo — sin botón "Continuar". */
  onSelectLanguage(code: string): void {
    this.languageService.selectLanguage(code);
    void this.router.navigateByUrl('/juego');
  }
}
