/**
 * Locale config: available locales match existing translation files (messages/{code}.json).
 * Add a locale here only when the corresponding messages/{code}.json exists.
 */

export const defaultLocale = "pl" as const;

/** Cookie name for persisting locale choice across sessions (read in middleware, set on switch). */
export const localeCookieName = "NEXT_LOCALE";

export type LocaleCode = "pl" | "cn" | "ru" | "vn" | "en";

/** Country code for country-flag-icons (ISO 3166-1 alpha-2). Used for flag icon in header. */
export type FlagCountryCode = "PL" | "CN" | "RU" | "VN" | "GB";

/** Locales that have a corresponding messages/{code}.json file. */
export const availableLocales: {
  code: LocaleCode;
  label: string;
  shortLabel: string;
  flagCode: FlagCountryCode;
}[] = [
  { code: "pl", label: "Polski", shortLabel: "PL", flagCode: "PL" },
  { code: "cn", label: "中文", shortLabel: "CN", flagCode: "CN" },
  { code: "ru", label: "Русский", shortLabel: "RU", flagCode: "RU" },
  { code: "vn", label: "Tiếng Việt", shortLabel: "VN", flagCode: "VN" },
  { code: "en", label: "English", shortLabel: "EN", flagCode: "GB" },
];

export const localeCodes: LocaleCode[] = availableLocales.map((l) => l.code);

export function isLocale(code: string): code is LocaleCode {
  return localeCodes.includes(code as LocaleCode);
}
