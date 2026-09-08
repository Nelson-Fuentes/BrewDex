/**
 * Las seis estadísticas base de combate de una forma de Pokémon — PS,
 * Ataque, Defensa, Ataque Especial, Defensa Especial y Velocidad — en su
 * valor base (nivel 1, sin IVs/EVs) tal como PokeAPI las publica.
 *
 * Value object de dominio puro: sin imports de Angular/HTTP (Constitución
 * Principio VI).
 */
export class PokemonStats {
  constructor(
    readonly hp: number,
    readonly attack: number,
    readonly defense: number,
    readonly specialAttack: number,
    readonly specialDefense: number,
    readonly speed: number,
  ) {
    for (const [name, value] of Object.entries({
      hp,
      attack,
      defense,
      specialAttack,
      specialDefense,
      speed,
    })) {
      if (value < 0) {
        throw new Error(`PokemonStats.${name} must not be negative`);
      }
    }
  }
}
