import { filterMovepool } from './move-filter';
import { Move } from '../../pokemon/domain/value-objects/move';
import { MoveLearnInfo } from '../../pokemon/domain/value-objects/move-learn-info';
import { PokemonType } from '../../pokemon/domain/value-objects/pokemon-type';

const normal = new PokemonType('normal', 'Normal');
const fire = new PokemonType('fire', 'Fire');

const tackle = new MoveLearnInfo(new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...'), ['level'], 1);
const growl = new MoveLearnInfo(new Move('growl', 'Growl', normal, 'status', 40, null, '...'), ['level'], 3);
const ember = new MoveLearnInfo(new Move('ember', 'Ember', fire, 'special', 25, 40, '...'), ['tm'], null);

const movepool = [tackle, growl, ember];

describe('filterMovepool', () => {
  it('sin ningún filtro activo, devuelve el movepool completo sin cambios', () => {
    expect(filterMovepool(movepool, {})).toEqual(movepool);
  });

  it('filtra por clase de daño', () => {
    expect(filterMovepool(movepool, { damageClass: 'physical' })).toEqual([tackle]);
  });

  it('filtra por tipo', () => {
    expect(filterMovepool(movepool, { type: 'fire' })).toEqual([ember]);
  });

  it('filtra por método de aprendizaje', () => {
    expect(filterMovepool(movepool, { learnMethod: 'tm' })).toEqual([ember]);
  });

  it('combina clase + tipo en conjunción (AND)', () => {
    expect(filterMovepool(movepool, { damageClass: 'special', type: 'fire' })).toEqual([ember]);
    expect(filterMovepool(movepool, { damageClass: 'physical', type: 'fire' })).toEqual([]);
  });

  it('una combinación sin resultados devuelve []', () => {
    expect(filterMovepool(movepool, { learnMethod: 'egg' })).toEqual([]);
  });

  it('no muta el movepool recibido', () => {
    const copy = [...movepool];
    filterMovepool(movepool, { damageClass: 'physical' });
    expect(movepool).toEqual(copy);
  });

  it('busca por nombre, case-insensitive', () => {
    expect(filterMovepool(movepool, { searchText: 'tack' })).toEqual([tackle]);
    expect(filterMovepool(movepool, { searchText: 'TACK' })).toEqual([tackle]);
  });

  it('busca también por descripción', () => {
    const withDescription = [
      new MoveLearnInfo(new Move('will-o-wisp', 'Will-O-Wisp', fire, 'status', 15, null, 'Inflige quemadura.'), ['level'], 5),
    ];
    expect(filterMovepool(withDescription, { searchText: 'quemadura' })).toEqual(withDescription);
  });

  it('texto vacío o solo espacios equivale a ausente', () => {
    expect(filterMovepool(movepool, { searchText: '' })).toEqual(movepool);
    expect(filterMovepool(movepool, { searchText: '   ' })).toEqual(movepool);
  });

  it('combina búsqueda de texto con los demás filtros (AND)', () => {
    expect(filterMovepool(movepool, { searchText: 'e', type: 'fire' })).toEqual([ember]);
    expect(filterMovepool(movepool, { searchText: 'zzz' })).toEqual([]);
  });
});
