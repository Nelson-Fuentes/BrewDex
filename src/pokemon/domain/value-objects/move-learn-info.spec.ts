import { Move } from './move';
import { MoveLearnInfo } from './move-learn-info';
import { PokemonType } from './pokemon-type';

const normal = new PokemonType('normal', 'Normal');
const tackle = new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...');

describe('MoveLearnInfo', () => {
  it('agrupa un movimiento con su método de aprendizaje por nivel', () => {
    const info = new MoveLearnInfo(tackle, ['level'], 7);
    expect(info.move).toBe(tackle);
    expect(info.methods).toEqual(['level']);
    expect(info.levelLearnedAt).toBe(7);
  });

  it('permite más de un método a la vez para el mismo movimiento en el mismo juego', () => {
    const info = new MoveLearnInfo(tackle, ['level', 'tm'], 7);
    expect(info.methods).toEqual(['level', 'tm']);
  });

  it('levelLearnedAt es null cuando "level" no está entre los métodos', () => {
    const info = new MoveLearnInfo(tackle, ['tm'], null);
    expect(info.methods).toEqual(['tm']);
    expect(info.levelLearnedAt).toBeNull();
  });

  it('distingue tm de hm como métodos separados', () => {
    const info = new MoveLearnInfo(tackle, ['hm'], null);
    expect(info.methods).toEqual(['hm']);
  });
});
