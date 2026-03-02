/**
 * Locale config: available locales match existing translation files (messages/{code}.json).
 * Add a locale here only when the corresponding messages/{code}.json exists.
 */

export const defaultLocale = "en" as const;

export type LocaleCode = "en" | "de";

/** Country code for country-flag-icons (ISO 3166-1 alpha-2). Used for flag icon in header. */
export type FlagCountryCode = "GB" | "DE";

/** Locales that have a corresponding messages/{code}.json file. */
export const availableLocales: {
  code: LocaleCode;
  label: string;
  shortLabel: string;
  flagCode: FlagCountryCode;
}[] = [
  { code: "en", label: "English", shortLabel: "EN", flagCode: "GB" },
  { code: "de", label: "Deutsch", shortLabel: "DE", flagCode: "DE" },
];

export const localeCodes: LocaleCode[] = availableLocales.map((l) => l.code);

export function isLocale(code: string): code is LocaleCode {
  return localeCodes.includes(code as LocaleCode);
}
