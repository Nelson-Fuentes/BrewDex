import { BrowserDeviceLocaleProviderService } from './browser-device-locale-provider.service';

describe('BrowserDeviceLocaleProviderService', () => {
  let originalLanguage: string;

  beforeEach(() => {
    originalLanguage = navigator.language;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'language', { value: originalLanguage, configurable: true });
  });

  function withNavigatorLanguage(value: string) {
    Object.defineProperty(navigator, 'language', { value, configurable: true });
  }

  it('devuelve el subtag base para un locale regional (p. ej. "es-AR" -> "es")', () => {
    withNavigatorLanguage('es-AR');
    expect(new BrowserDeviceLocaleProviderService().currentDeviceLanguageCode()).toBe('es');
  });

  it('colapsa cualquier variante de chino a "zh"', () => {
    withNavigatorLanguage('zh-CN');
    expect(new BrowserDeviceLocaleProviderService().currentDeviceLanguageCode()).toBe('zh');
  });

  it('devuelve el código tal cual para un locale sin región', () => {
    withNavigatorLanguage('ja');
    expect(new BrowserDeviceLocaleProviderService().currentDeviceLanguageCode()).toBe('ja');
  });
});
