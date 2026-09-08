import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import { InMemoryActiveLanguageService } from '../language/infrastructure/in-memory-active-language.service';

/**
 * Raíz de composición (fuera de las reglas de import-boundaries, ver
 * eslint.config.js) — el único lugar que sincroniza el idioma activo de
 * `language` (FR-003) con el idioma de renderizado de Transloco, para que
 * cualquier página de cualquier módulo reciba las traducciones correctas
 * sin que cada una repita esta lógica.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly languageService = inject(InMemoryActiveLanguageService);
  private readonly transloco = inject(TranslocoService);

  constructor() {
    effect(() => {
      this.transloco.setActiveLang(this.languageService.activeLanguageCode());
    });
  }
}
