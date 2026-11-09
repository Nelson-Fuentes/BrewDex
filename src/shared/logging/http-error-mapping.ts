import type { LoggingService } from './logging.service';

/**
 * Registra un error inesperado de un adaptador HTTP y lanza el *failure*
 * de dominio correspondiente en su lugar — el mismo patrón que cada
 * repositorio PokeAPI de la versión Flutter usaba con
 * `developer.log(...) ` seguido de `throw const XxxUnavailable();`
 * (contracts/pokemon.md, contracts/pokedex.md, contracts/game-catalog.md,
 * contracts/language-catalog.md). Centralizado acá para que los
 * adaptadores de infraestructura de cualquier módulo no dupliquen el
 * mismo `catch` (FR-017: mensaje claro + reintento se resuelve en la
 * presentación a partir de que esta función siempre termina lanzando).
 */
export function logAndRethrow<TFailure>(
  logging: LoggingService,
  context: string,
  error: unknown,
  toFailure: () => TFailure,
): never {
  logging.error(context, 'Fallo inesperado al consumir PokeAPI', error);
  throw toFailure();
}
