import type { PokemonType } from './pokemon-type';
import type { PokemonStats } from './pokemon-stats';

/** Si una {@link SelectableForm} es una forma tipo plantilla (ofrecida en
 *  el modal de formas), una Mega Evolución, o una forma Gigamax/Dinamax
 *  (ambas mostradas como botones dedicados, excluidas del modal). */
export type SelectableFormKind = 'template' | 'mega' | 'gigamax';

/**
 * Una forma tipo plantilla, Mega Evolución, o variedad Gigamax/Dinamax que
 * una especie puede adoptar, distinta de su variedad principal/regional
 * por defecto.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class SelectableForm {
  constructor(
    /** Nombre de variedad/Pokémon de PokeAPI — identidad de "qué forma". */
    readonly varietyId: string,
    /** Nombre de forma localizado, fallback inglés. */
    readonly displayName: string,
    /** Sprite específico del juego (mostrado en el selector/botones). */
    readonly gameSpriteUrl: string | null,
    /** Sprite estilo HOME — lo que el slot ya elegido renderiza. */
    readonly homeSpriteUrl: string | null,
    readonly homeSpriteShinyUrl: string | null,
    readonly homeSpriteFemaleUrl: string | null,
    readonly homeSpriteShinyFemaleUrl: string | null,
    readonly kind: SelectableFormKind,
    /** `null` si es de juego base; el DLC que la desbloquea si no. */
    readonly requiresDlcId: string | null,
    /** Tipo 1 propio de esta variedad — independiente del de la especie. */
    readonly typePrimary: PokemonType,
    readonly typeSecondary: PokemonType | null,
    /** Estadísticas base propias de esta variedad. */
    readonly baseStats: PokemonStats,
  ) {}

  /** Igualdad por `varietyId` únicamente. */
  equals(other: SelectableForm): boolean {
    return this.varietyId === other.varietyId;
  }
}
