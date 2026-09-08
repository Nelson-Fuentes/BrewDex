import type { Gender } from '../../../pokemon/domain/value-objects/gender';
import type { PokemonType } from '../../../pokemon/domain/value-objects/pokemon-type';

/** Las 4 posiciones fijas de movimientos de un slot — cada una un
 *  `Move.id` o `null` para una posición vacía. */
export type MoveSlots = readonly [string | null, string | null, string | null, string | null];

/**
 * El ocupante de un slot de equipo, con todo lo que la persona haya
 * personalizado — forma, género, variante cosmética, Mega/Gigamax,
 * variocolor (shiny) y moveset.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class RosterEntry {
  constructor(
    /** Identidad de especie — usada para validez y como clave de igualdad. */
    readonly pokemonId: string,
    /** Presente solo si se eligió una forma no principal (FR-013). */
    readonly formVarietyId: string | null = null,
    /** `null` solo transitoriamente, mientras se resuelve. */
    readonly gender: Gender | null = null,
    /** `null` = la variante cosmética por defecto. */
    readonly cosmeticVariantId: string | null = null,
    /** Mutuamente excluyente con `gigamaxActive` — impuesto por la capa
     *  de aplicación, no por este tipo. */
    readonly megaActive = false,
    readonly gigamaxActive = false,
    readonly isShiny = false,
    /** Solo Escarlata/Púrpura; fijado una vez al agregar, cambia solo por
     *  elección explícita. */
    readonly teraType: PokemonType | null = null,
    /** 4 posiciones fijas; nunca el mismo id no-nulo repetido — impuesto
     *  por la capa de aplicación. */
    readonly moveIds: MoveSlots = [null, null, null, null],
  ) {}

  equals(other: RosterEntry): boolean {
    return this.pokemonId === other.pokemonId;
  }

  copyWith(changes: {
    formVarietyId?: string | null;
    gender?: Gender | null;
    cosmeticVariantId?: string | null;
    megaActive?: boolean;
    gigamaxActive?: boolean;
    isShiny?: boolean;
    teraType?: PokemonType | null;
    moveIds?: MoveSlots;
  }): RosterEntry {
    return new RosterEntry(
      this.pokemonId,
      changes.formVarietyId !== undefined ? changes.formVarietyId : this.formVarietyId,
      changes.gender !== undefined ? changes.gender : this.gender,
      changes.cosmeticVariantId !== undefined ? changes.cosmeticVariantId : this.cosmeticVariantId,
      changes.megaActive !== undefined ? changes.megaActive : this.megaActive,
      changes.gigamaxActive !== undefined ? changes.gigamaxActive : this.gigamaxActive,
      changes.isShiny !== undefined ? changes.isShiny : this.isShiny,
      changes.teraType !== undefined ? changes.teraType : this.teraType,
      changes.moveIds !== undefined ? changes.moveIds : this.moveIds,
    );
  }
}
