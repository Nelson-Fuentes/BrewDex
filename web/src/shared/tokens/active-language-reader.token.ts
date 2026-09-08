import { InjectionToken } from '@angular/core';

import type { ActiveLanguageReader } from '../../language/domain/ports/active-language-reader';

/**
 * Token de inyección para el único puerto cruzado entre módulos
 * (Constitución Principio VI — `ActiveLanguageReader` es el único tipo de
 * `language` que otro módulo puede depender). Vive en `shared/` porque
 * ningún módulo de negocio puede importar la `infrastructure` concreta de
 * otro directamente (`InMemoryActiveLanguageService`) — la raíz de
 * composición (`app.config.ts`) es quien liga este token a esa
 * implementación concreta; cualquier otro módulo solo ve el contrato.
 */
export const ACTIVE_LANGUAGE_READER = new InjectionToken<ActiveLanguageReader>('ActiveLanguageReader');
