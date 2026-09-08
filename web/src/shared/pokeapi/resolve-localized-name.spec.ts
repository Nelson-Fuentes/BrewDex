import { resolveLocalizedName } from './resolve-localized-name';

interface NameEntry {
  language: { name: string };
  name: string;
}

const entries: NameEntry[] = [
  { language: { name: 'en' }, name: 'Bulbasaur' },
  { language: { name: 'es' }, name: 'Bulbasaur' },
  { language: { name: 'fr' }, name: 'Bulbizarre' },
];

describe('resolveLocalizedName', () => {
  it('devuelve el texto en el idioma activo cuando existe', () => {
    expect(resolveLocalizedName(entries, 'fr', (e) => e.name)).toBe('Bulbizarre');
  });

  it('cae a inglés cuando el idioma activo no tiene traducción (FR-018)', () => {
    expect(resolveLocalizedName(entries, 'ja', (e) => e.name)).toBe('Bulbasaur');
  });

  it('devuelve null cuando ni el idioma activo ni el inglés tienen entrada', () => {
    const noEnglish: NameEntry[] = [{ language: { name: 'fr' }, name: 'Bulbizarre' }];
    expect(resolveLocalizedName(noEnglish, 'ja', (e) => e.name)).toBeNull();
  });
});
