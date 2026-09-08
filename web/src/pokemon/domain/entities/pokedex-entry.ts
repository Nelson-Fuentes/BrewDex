import type { Generation } from '../../../game/domain/value-objects/generation';
import type { PokedexEntrySource } from '../../../pokedex/domain/value-objects/pokedex-entry-source';
import type { PokemonType } from '../value-objects/pokemon-type';
import type { PokemonStats } from '../value-objects/pokemon-stats';
import type { SelectableForm } from '../value-objects/selectable-form';
import type { CosmeticVariant } from '../value-objects/cosmetic-variant';

/**
 * Un Pokémon tal como aplica a un juego y a la vista de Pokédex activos.
 *
 * Entidad de dominio pura: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class PokedexEntry {
  constructor(
    /** Identidad de especie — identidad/igualdad. */
    readonly pokemonId: string,
    /** Localizado, fallback inglés. */
    readonly displayName: string,
    /** Regional o nacional según la vista activa; `0` es un valor
     *  legítimo (no un sentinela). */
    readonly pokedexNumber: number,
    /** Sprite de grid; `null` → placeholder en presentación. */
    readonly spriteUrl: string | null,
    /** Solo para el slot de equipo ya lleno, nunca para el grid. */
    readonly homeSpriteUrl: string | null,
    readonly homeSpriteShinyUrl: string | null,
    readonly homeSpriteFemaleUrl: string | null,
    readonly homeSpriteShinyFemaleUrl: string | null,
    /** `-1` = sin datos de género. */
    readonly genderRate: number,
    readonly hasGenderDifferences: boolean,
    /** Formas tipo `'template'` ofrecidas en el modal. */
    readonly selectableForms: readonly SelectableForm[],
    /** Botones dedicados, excluidos del modal. */
    readonly megaForm: SelectableForm | null,
    readonly gigamaxForm: SelectableForm | null,
    readonly cosmeticVariants: readonly CosmeticVariant[],
    readonly typePrimary: PokemonType,
    readonly typeSecondary: PokemonType | null,
    /** Usado por el filtro de generación (FR-009). */
    readonly introducedGeneration: Generation,
    readonly sourceTag: PokedexEntrySource,
    readonly baseStats: PokemonStats,
  ) {
    if (!pokemonId) {
      throw new Error('PokedexEntry.pokemonId must not be empty');
    }
    if (!displayName) {
      throw new Error('PokedexEntry.displayName must not be empty');
    }
    if (pokedexNumber < 0) {
      throw new Error('PokedexEntry.pokedexNumber must not be negative');
    }
  }

  /** Igualdad por `pokemonId` únicamente. */
  equals(other: PokedexEntry): boolean {
    return this.pokemonId === other.pokemonId;
  }
}
