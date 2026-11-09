import { getActiveLanguage, DEFAULT_LANGUAGE_CODE } from './get-active-language';
import { SupportedLanguage } from '../domain/value-objects/supported-language';
import type { DeviceLocaleProvider } from '../domain/ports/device-locale-provider';

function providerFor(code: string): DeviceLocaleProvider {
  return { currentDeviceLanguageCode: () => code };
}

const supported = [new SupportedLanguage('en', 'English'), new SupportedLanguage('es', 'Español')];

describe('getActiveLanguage', () => {
  it('usa el idioma del dispositivo cuando está soportado', () => {
    expect(getActiveLanguage(providerFor('es'), supported)).toBe('es');
  });

  it('cae al idioma por defecto cuando el del dispositivo no está soportado', () => {
    expect(getActiveLanguage(providerFor('ru'), supported)).toBe(DEFAULT_LANGUAGE_CODE);
  });
});
