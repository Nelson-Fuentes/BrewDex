import { flagEmojiForLanguage } from './language-flag-emoji';

describe('flagEmojiForLanguage', () => {
  it('devuelve la bandera conocida para un código soportado', () => {
    expect(flagEmojiForLanguage('es')).toBe('🇪🇸');
    expect(flagEmojiForLanguage('en')).toBe('🇺🇸');
  });

  it('cae a un emoji genérico para un código desconocido', () => {
    expect(flagEmojiForLanguage('zz')).toBe('🌐');
  });
});
