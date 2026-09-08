import { PokedexFilterCriteria } from './pokedex-filter-criteria';
import { PokemonType } from '../../../pokemon/domain/value-objects/pokemon-type';

describe('PokedexFilterCriteria', () => {
  it('isEmpty es true sin ningún filtro activo', () => {
    expect(new PokedexFilterCriteria().isEmpty).toBeTrue();
  });

  it('isEmpty es false cuando hay texto de búsqueda', () => {
    expect(new PokedexFilterCriteria('char').isEmpty).toBeFalse();
  });

  it('withType/withSearchText/withGeneration devuelven una nueva instancia inmutable', () => {
    const original = new PokedexFilterCriteria();
    const withType = original.withType(new PokemonType('fire', 'Fire'));

    expect(withType.type?.id).toBe('fire');
    expect(original.type).toBeNull();
  });
});
