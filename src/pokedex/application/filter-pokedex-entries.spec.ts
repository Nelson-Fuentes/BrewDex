import { filterPokedexEntries } from './filter-pokedex-entries';
import { PokedexFilterCriteria } from '../domain/value-objects/pokedex-filter-criteria';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';

const stats = new PokemonStats(45, 49, 49, 65, 65, 45);
const grass = new PokemonType('grass', 'Grass');
const fire = new PokemonType('fire', 'Fire');
const generationI = new Generation('generation-i', 'I');
const generationIV = new Generation('generation-iv', 'IV');

function entry(pokemonId: string, displayName: string, typePrimary = grass, generation = generationI): PokedexEntry {
  return new PokedexEntry(
    pokemonId,
    displayName,
    1,
    null,
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
    typePrimary,
    null,
    generation,
    { kind: 'regional' },
    stats,
  );
}

describe('filterPokedexEntries', () => {
  const entries = [entry('bulbasaur', 'Bulbasaur'), entry('charmander', 'Charmander', fire), entry('turtwig', 'Turtwig', grass, generationIV)];

  it('sin filtro devuelve todas las entradas', () => {
    expect(filterPokedexEntries(entries, new PokedexFilterCriteria())).toEqual(entries);
  });

  it('filtra por texto de búsqueda, case-insensitive', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('char'));
    expect(result.map((e) => e.pokemonId)).toEqual(['charmander']);
  });

  it('filtra por tipo', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('', fire));
    expect(result.map((e) => e.pokemonId)).toEqual(['charmander']);
  });

  it('filtra por generación', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('', null, generationIV));
    expect(result.map((e) => e.pokemonId)).toEqual(['turtwig']);
  });

  it('combina búsqueda + tipo + generación', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('bulba', grass, generationI));
    expect(result.map((e) => e.pokemonId)).toEqual(['bulbasaur']);
  });
});
