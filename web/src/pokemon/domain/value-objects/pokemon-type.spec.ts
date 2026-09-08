import { PokemonType } from './pokemon-type';

describe('PokemonType', () => {
  it('es igual a otra instancia con el mismo id, sin importar label', () => {
    const a = new PokemonType('rock', 'Rock', 10);
    const b = new PokemonType('rock', 'Roca', 10);
    expect(a.equals(b)).toBeTrue();
  });

  it('numericId por defecto es 0', () => {
    expect(new PokemonType('rock', 'Rock').numericId).toBe(0);
  });
});
