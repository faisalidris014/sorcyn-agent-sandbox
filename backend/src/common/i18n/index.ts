import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type SupportedLocale = 'en' | 'es' | 'zh' | 'ar' | 'fr' | 'pt' | 'hi' | 'vi' | 'ko' | 'ja';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'es', 'zh', 'ar', 'fr', 'pt', 'hi', 'vi', 'ko', 'ja'];

function loadLocale(locale: string): Record<string, string> {
  try {
    const filePath = join(__dirname, 'locales', `${locale}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

const locales: Record<SupportedLocale, Record<string, string>> = {} as any;
for (const locale of SUPPORTED_LOCALES) {
  locales[locale] = loadLocale(locale);
}

/**
 * Translate a key with optional parameter interpolation.
 * Falls back to English, then returns the key itself if not found.
 */
export function t(
  key: string,
  locale: SupportedLocale = 'en',
  params?: Record<string, string | number>,
): string {
  const messages = locales[locale] ?? locales.en;
  let message = messages[key] ?? locales.en[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    }
  }

  return message;
}

/**
 * Parse the Accept-Language header and return the best supported locale.
 */
export function parseAcceptLanguage(header?: string): SupportedLocale {
  if (!header) return 'en';

  const preferred = header
    .split(',')
    .map((part) => {
      const [lang, qStr] = part.trim().split(';');
      const q = qStr ? parseFloat(qStr.replace('q=', '')) : 1.0;
      return { lang: lang.trim().toLowerCase().substring(0, 2), q };
    })
    .sort((a, b) => b.q - a.q)
    .find((entry) => SUPPORTED_LOCALES.includes(entry.lang as SupportedLocale));

  return (preferred?.lang as SupportedLocale) ?? 'en';
}

/**
 * Check if a locale code is supported.
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
