import { SelectableForm } from './selectable-form';
import { PokemonType } from './pokemon-type';
import { PokemonStats } from './pokemon-stats';

const fire = new PokemonType('fire', 'Fire');
const stats = new PokemonStats(60, 60, 60, 60, 60, 60);

describe('SelectableForm', () => {
  it('es igual a otra instancia con el mismo varietyId', () => {
    const a = new SelectableForm('rotom-heat', 'Heat Rotom', null, null, null, null, null, 'template', null, fire, null, stats);
    const b = new SelectableForm('rotom-heat', 'Rotom Calor', null, null, null, null, null, 'template', null, fire, null, stats);
    expect(a.equals(b)).toBeTrue();
  });
});
