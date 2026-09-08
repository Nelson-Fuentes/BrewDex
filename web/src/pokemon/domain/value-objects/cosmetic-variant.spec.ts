import { CosmeticVariant } from './cosmetic-variant';

describe('CosmeticVariant', () => {
  it('es igual a otra instancia con el mismo formId', () => {
    const a = new CosmeticVariant('vivillon-meadow', 'Meadow Pattern', null, true);
    const b = new CosmeticVariant('vivillon-meadow', 'Patrón Pradera', null, false);
    expect(a.equals(b)).toBeTrue();
  });
});
