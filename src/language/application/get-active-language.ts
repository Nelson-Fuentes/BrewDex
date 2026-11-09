import type { SupportedLanguage } from '../domain/value-objects/supported-language';
import type { DeviceLocaleProvider } from '../domain/ports/device-locale-provider';

/** Idioma usado cuando el del dispositivo no está en el catálogo soportado. */
export const DEFAULT_LANGUAGE_CODE = 'en';

/**
 * Caso de uso: resolver el idioma activo con el que arranca la sesión
 * (FR-003) — el del dispositivo/navegador si está soportado, si no
 * {@link DEFAULT_LANGUAGE_CODE}. No hay preferencia persistida que
 * consultar primero (FR-015): cada carga de la app repite esta misma
 * resolución.
 */
export function getActiveLanguage(
  deviceLocaleProvider: DeviceLocaleProvider,
  supportedLanguages: readonly SupportedLanguage[],
): string {
  const deviceLanguageCode = deviceLocaleProvider.currentDeviceLanguageCode();
  const isDeviceLanguageSupported = supportedLanguages.some(
    (language) => language.code === deviceLanguageCode,
  );
  return isDeviceLanguageSupported ? deviceLanguageCode : DEFAULT_LANGUAGE_CODE;
}
