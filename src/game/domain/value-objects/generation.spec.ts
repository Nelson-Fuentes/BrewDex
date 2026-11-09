import { Generation } from './generation';

describe('Generation', () => {
  it('es igual a otra instancia con el mismo id, sin importar label', () => {
    const a = new Generation('generation-i', 'Generation I');
    const b = new Generation('generation-i', 'Generación I');
    expect(a.equals(b)).toBeTrue();
  });

  it('no es igual a una instancia con distinto id', () => {
    const gen1 = new Generation('generation-i', 'Generation I');
    const gen2 = new Generation('generation-ii', 'Generation II');
    expect(gen1.equals(gen2)).toBeFalse();
  });
});
