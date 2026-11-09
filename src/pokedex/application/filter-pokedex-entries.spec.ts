import { filterPokedexEntries } from './filter-pokedex-entries';
import { PokedexFilterCriteria } from '../domain/value-objects/pokedex-filter-criteria';
import { PokedexEntry } from '../../pokemon/domain/entities/pokedex-entry';
import { SelectableForm } from '../../pokemon/domain/value-objects/selectable-form';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';
import { PokemonStats } from '../../pokemon/domain/value-objects/pokemon-stats';
import { Generation } from '../../game/domain/value-objects/generation';

const stats = new PokemonStats(45, 49, 49, 65, 65, 45);
const grass = new PokemonType('grass', 'Grass');
const fire = new PokemonType('fire', 'Fire');
const normal = new PokemonType('normal', 'Normal');
const generationI = new Generation('generation-i', 'I');
const generationIV = new Generation('generation-iv', 'IV');
const NO_DLC = new Set<string>();

function entry(
  pokemonId: string,
  displayName: string,
  typePrimary = grass,
  generation = generationI,
  selectableForms: readonly SelectableForm[] = [],
): PokedexEntry {
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
    selectableForms,
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

function form(varietyId: string, typePrimary: PokemonType, requiresDlcId: string | null): SelectableForm {
  return new SelectableForm(varietyId, varietyId, null, null, null, null, null, 'template', requiresDlcId, typePrimary, null, stats);
}

describe('filterPokedexEntries', () => {
  const entries = [entry('bulbasaur', 'Bulbasaur'), entry('charmander', 'Charmander', fire), entry('turtwig', 'Turtwig', grass, generationIV)];

  it('sin filtro devuelve todas las entradas', () => {
    expect(filterPokedexEntries(entries, new PokedexFilterCriteria(), NO_DLC)).toEqual(entries);
  });

  it('filtra por texto de búsqueda, case-insensitive', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('char'), NO_DLC);
    expect(result.map((e) => e.pokemonId)).toEqual(['charmander']);
  });

  it('filtra por tipo', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('', fire), NO_DLC);
    expect(result.map((e) => e.pokemonId)).toEqual(['charmander']);
  });

  it('filtra por generación', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('', null, generationIV), NO_DLC);
    expect(result.map((e) => e.pokemonId)).toEqual(['turtwig']);
  });

  it('combina búsqueda + tipo + generación', () => {
    const result = filterPokedexEntries(entries, new PokedexFilterCriteria('bulba', grass, generationI), NO_DLC);
    expect(result.map((e) => e.pokemonId)).toEqual(['bulbasaur']);
  });

  // Bug fix (2026-09-10): Tauros en Escarlata/Púrpura resuelve su variedad principal a la
  // raza Paldeana (no Normal); Tauros-Kanto (Normal puro) solo existe como SelectableForm
  // con requiresDlcId = 'the-indigo-disk' — filtrar por "Normal" debe encontrar la entrada
  // igual, siempre que ese DLC esté activo.
  describe('tipo de una forma seleccionable por DLC (bug Tauros/Disco Índigo)', () => {
    const tauros = entry('tauros', 'Tauros', fire, generationI, [form('tauros-kanto', normal, 'the-indigo-disk')]);
    const entriesWithTauros = [tauros, entry('charmander', 'Charmander', fire)];

    it('NO aparece en el filtro de tipo de la forma alternativa si el DLC que la desbloquea no está activo', () => {
      const result = filterPokedexEntries(entriesWithTauros, new PokedexFilterCriteria('', normal), NO_DLC);
      expect(result.map((e) => e.pokemonId)).toEqual([]);
    });

    it('SÍ aparece en el filtro de tipo de la forma alternativa cuando el DLC que la desbloquea está activo', () => {
      const result = filterPokedexEntries(entriesWithTauros, new PokedexFilterCriteria('', normal), new Set(['the-indigo-disk']));
      expect(result.map((e) => e.pokemonId)).toEqual(['tauros']);
    });

    it('sigue apareciendo en el filtro de tipo de su variedad principal (fire), con o sin el DLC activo', () => {
      const withDlc = filterPokedexEntries(entriesWithTauros, new PokedexFilterCriteria('', fire), new Set(['the-indigo-disk']));
      const withoutDlc = filterPokedexEntries(entriesWithTauros, new PokedexFilterCriteria('', fire), NO_DLC);
      expect(withDlc.map((e) => e.pokemonId)).toEqual(['tauros', 'charmander']);
      expect(withoutDlc.map((e) => e.pokemonId)).toEqual(['tauros', 'charmander']);
    });

    it('un tipo que no tiene ni la variedad principal ni ninguna forma seleccionable no hace match', () => {
      const result = filterPokedexEntries(entriesWithTauros, new PokedexFilterCriteria('', grass), new Set(['the-indigo-disk']));
      expect(result.map((e) => e.pokemonId)).toEqual([]);
    });
  });
});
