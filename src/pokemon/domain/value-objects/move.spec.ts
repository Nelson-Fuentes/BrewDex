import { Move } from './move';
import { PokemonType } from './pokemon-type';

const normal = new PokemonType('normal', 'Normal');

describe('Move', () => {
  it('es igual a otra instancia con el mismo id', () => {
    const a = new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...');
    const b = new Move('tackle', 'Placaje', normal, 'physical', 35, 40, '...');
    expect(a.equals(b)).toBeTrue();
  });

  it('permite power null para un movimiento de estado', () => {
    const move = new Move('growl', 'Growl', normal, 'status', 40, null, '...');
    expect(move.power).toBeNull();
    expect(move.damageClass).toBe('status');
  });

  it('acepta las tres damageClass, incluida la regla histórica Gen. I-III (physical/special por tipo)', () => {
    const physical = new Move('scratch', 'Scratch', normal, 'physical', 35, 40, '...');
    const special = new Move('ember', 'Ember', new PokemonType('fire', 'Fire'), 'special', 25, 40, '...');
    expect(physical.damageClass).toBe('physical');
    expect(special.damageClass).toBe('special');
  });

  it('accuracy es null por defecto (compatibilidad con construcciones existentes) y aceptable explícito', () => {
    const withoutAccuracy = new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...');
    expect(withoutAccuracy.accuracy).toBeNull();

    const withAccuracy = new Move('tackle', 'Tackle', normal, 'physical', 35, 40, '...', 100);
    expect(withAccuracy.accuracy).toBe(100);
  });

  it('accuracy null representa un movimiento que nunca falla, no un sentinela de "sin datos"', () => {
    const alwaysHits = new Move('swords-dance', 'Swords Dance', normal, 'status', 20, null, '...', null);
    expect(alwaysHits.accuracy).toBeNull();
  });
});
