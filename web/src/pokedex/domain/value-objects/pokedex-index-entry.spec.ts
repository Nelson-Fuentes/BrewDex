import { PokedexIndexEntry } from './pokedex-index-entry';

describe('PokedexIndexEntry', () => {
  it('es igual a otra instancia con el mismo pokemonId', () => {
    const a = new PokedexIndexEntry('bulbasaur', 1, { kind: 'regional' });
    const b = new PokedexIndexEntry('bulbasaur', 99, { kind: 'national' });
    expect(a.equals(b)).toBeTrue();
  });
});
