/**
 * Describe qué conjunto de datos de Pokédex está activo — qué Pokémon se
 * obtienen/muestran y qué numeración usan.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class PokedexView {
  constructor(
    /** Reemplaza la lista/numeración regional por la nacional cuando el
     *  juego es elegible (ver `isNationalDexEligible`, ignorado si no). */
    readonly useNationalDex = false,
    /** Ids de DLC del juego activos, cuyos Pokémon se mezclan en la lista base. */
    readonly activeDlcIds: ReadonlySet<string> = new Set(),
  ) {}

  withNationalDex(useNationalDex: boolean): PokedexView {
    return new PokedexView(useNationalDex, this.activeDlcIds);
  }

  withActiveDlcIds(activeDlcIds: ReadonlySet<string>): PokedexView {
    return new PokedexView(this.useNationalDex, activeDlcIds);
  }
}
