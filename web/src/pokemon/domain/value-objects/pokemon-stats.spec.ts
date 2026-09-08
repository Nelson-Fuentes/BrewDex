import { PokemonStats } from './pokemon-stats';

describe('PokemonStats', () => {
  it('acepta estadísticas no negativas', () => {
    const stats = new PokemonStats(45, 49, 49, 65, 65, 45);
    expect(stats.hp).toBe(45);
    expect(stats.speed).toBe(45);
  });

  it('rechaza una estadística negativa', () => {
    expect(() => new PokemonStats(-1, 49, 49, 65, 65, 45)).toThrowError();
  });
});
