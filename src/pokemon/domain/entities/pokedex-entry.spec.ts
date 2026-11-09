import { PokedexEntry } from './pokedex-entry';
import { PokemonType } from '../value-objects/pokemon-type';
import { PokemonStats } from '../value-objects/pokemon-stats';
import { Generation } from '../../../game/domain/value-objects/generation';

const normal = new PokemonType('normal', 'Normal');
const stats = new PokemonStats(45, 49, 49, 65, 65, 45);
const generationI = new Generation('generation-i', 'I');

function buildEntry(pokedexNumber = 1): PokedexEntry {
  return new PokedexEntry(
    'bulbasaur',
    'Bulbasaur',
    pokedexNumber,
    'sprite.png',
    null,
    null,
    null,
    null,
    -1,
    false,
    [],
    null,
    null,
    [],
    normal,
    null,
    generationI,
    { kind: 'regional' },
    stats,
  );
}

describe('PokedexEntry', () => {
  it('es igual a otra instancia con el mismo pokemonId', () => {
    expect(buildEntry().equals(buildEntry())).toBeTrue();
  });

  it('permite pokedexNumber 0 como valor legítimo (no un sentinela)', () => {
    expect(() => buildEntry(0)).not.toThrow();
  });

  it('rechaza un pokedexNumber negativo', () => {
    expect(() => buildEntry(-1)).toThrowError();
  });
});
