import { SupportedLanguage } from './supported-language';

describe('SupportedLanguage', () => {
  it('es igual a otra instancia con el mismo code, sin importar displayName', () => {
    const a = new SupportedLanguage('es', 'Español');
    const b = new SupportedLanguage('es', 'Spanish');

    expect(a.equals(b)).toBeTrue();
  });

  it('no es igual a una instancia con distinto code', () => {
    const es = new SupportedLanguage('es', 'Español');
    const en = new SupportedLanguage('en', 'English');

    expect(es.equals(en)).toBeFalse();
  });

  it('rechaza un code vacío', () => {
    expect(() => new SupportedLanguage('', 'Español')).toThrowError();
  });

  it('rechaza un displayName vacío', () => {
    expect(() => new SupportedLanguage('es', '')).toThrowError();
  });
});
