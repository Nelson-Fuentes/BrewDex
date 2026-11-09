import type { PokemonType } from './pokemon-type';

/**
 * La clase de daño de un movimiento. Desde la 4ª generación es un dato
 * propio del movimiento en el juego; en Generación I-III no existía como
 * tal — se derivaba del tipo del movimiento, y los movimientos que hoy
 * son `'status'` no pertenecían a ninguna clase en esas tres primeras
 * generaciones (ver data-model.md para la tabla tipo→clase y su
 * atribución a WikiDex).
 */
export type DamageClass = 'physical' | 'special' | 'status';

/**
 * Un movimiento que un Pokémon puede usar en combate.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class Move {
  constructor(
    /** Nombre de PokeAPI — identidad e igualdad. */
    readonly id: string,
    /** Localizado, fallback inglés. */
    readonly displayName: string,
    /** Tipo propio del movimiento — independiente del Pokémon que lo usa. */
    readonly type: PokemonType,
    readonly damageClass: DamageClass,
    /** PP base. */
    readonly pp: number,
    /** `null` para un movimiento de clase `'status'` — nunca `0` como
     *  sentinela. */
    readonly power: number | null,
    /** Texto de sabor/efecto, localizado con fallback inglés. */
    readonly description: string,
    /** Precisión (0-100). `null` cuando el movimiento nunca falla (p. ej.
     *  Swords Dance, Aurora Veil) — igual que PokeAPI, nunca un sentinela
     *  como `0` o `100`. Opcional por compatibilidad con construcciones
     *  existentes que no lo pasan. */
    readonly accuracy: number | null = null,
  ) {}

  /** Igualdad por `id` únicamente, igual que {@link SelectableForm}. */
  equals(other: Move): boolean {
    return this.id === other.id;
  }
}
