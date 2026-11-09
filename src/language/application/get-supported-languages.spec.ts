import { getSupportedLanguages } from './get-supported-languages';
import { SupportedLanguage } from '../domain/value-objects/supported-language';
import type { SupportedLanguageCatalog } from '../domain/ports/supported-language-catalog';

describe('getSupportedLanguages', () => {
  it('delega en el catálogo y devuelve su resultado', async () => {
    const expected = [new SupportedLanguage('en', 'English')];
    const catalog: SupportedLanguageCatalog = {
      fetchSupportedLanguages: () => Promise.resolve(expected),
    };

    await expectAsync(getSupportedLanguages(catalog)).toBeResolvedTo(expected);
  });

  it('propaga el rechazo del catálogo (p. ej. LanguageCatalogUnavailable)', async () => {
    const failure = new Error('unavailable');
    const catalog: SupportedLanguageCatalog = {
      fetchSupportedLanguages: () => Promise.reject(failure),
    };

    await expectAsync(getSupportedLanguages(catalog)).toBeRejectedWith(failure);
  });
});
