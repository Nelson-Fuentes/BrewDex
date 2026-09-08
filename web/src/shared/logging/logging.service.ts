import { Injectable } from '@angular/core';

/**
 * Punto único de logging estructurado de BrewDex (Constitución Principio
 * V, Observabilidad) — el equivalente de `dart:developer.log` en la
 * versión Flutter. Ningún adaptador de infraestructura debe llamar
 * `console.*` directamente; todos pasan por este servicio para que el
 * formato (contexto + error) sea consistente en toda la app.
 */
@Injectable({ providedIn: 'root' })
export class LoggingService {
  /** Un fallo esperado y manejado (p. ej. PokeAPI no disponible). */
  warn(context: string, message: string, error?: unknown): void {
    console.warn(`[BrewDex] ${context}: ${message}`, error ?? '');
  }

  /** Un fallo inesperado que de todos modos se recuperó con un fallback. */
  error(context: string, message: string, error?: unknown): void {
    console.error(`[BrewDex] ${context}: ${message}`, error ?? '');
  }
}
