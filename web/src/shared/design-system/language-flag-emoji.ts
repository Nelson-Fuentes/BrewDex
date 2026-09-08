/**
 * Emoji de bandera por código de idioma de PokeAPI — puramente
 * decorativo, tabla hand-maintained (PokeAPI no expone un emoji de
 * bandera). Un código sin entrada cae a un emoji genérico de globo en
 * vez de romper el render.
 */
const FLAG_EMOJI_BY_LANGUAGE_CODE: Readonly<Record<string, string>> = {
  en: '🇺🇸',
  es: '🇪🇸',
  ja: '🇯🇵',
  'ja-Hrkt': '🇯🇵',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  ko: '🇰🇷',
  'zh-Hans': '🇨🇳',
  'zh-Hant': '🇹🇼',
};

const DEFAULT_FLAG_EMOJI = '🌐';

export function flagEmojiForLanguage(languageCode: string): string {
  return FLAG_EMOJI_BY_LANGUAGE_CODE[languageCode] ?? DEFAULT_FLAG_EMOJI;
}
