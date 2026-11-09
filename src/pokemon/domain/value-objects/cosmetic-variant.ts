/**
 * Una entrada de la lista de formas cosméticas de una variedad, cuando
 * tiene más de un miembro (p. ej. uno de los 20 patrones de Vivillon).
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class CosmeticVariant {
  constructor(
    /** Nombre de forma de PokeAPI, p. ej. `"vivillon-meadow"`. */
    readonly formId: string,
    /** Localizado, fallback inglés. */
    readonly displayName: string,
    readonly spriteUrl: string | null,
    /** La entrada con `isDefault: true` es con la que arranca un slot
     *  recién agregado — nunca una elección al azar. */
    readonly isDefault: boolean,
  ) {}

  equals(other: CosmeticVariant): boolean {
    return this.formId === other.formId;
  }
}
