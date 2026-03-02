/**
 * Locale config: available locales match existing translation files (messages/{code}.json).
 * Add a locale here only when the corresponding messages/{code}.json exists.
 */

export const defaultLocale = "en" as const;

export type LocaleCode = "en" | "de";

/** Locales that have a corresponding messages/{code}.json file. */
export const availableLocales: { code: LocaleCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export const localeCodes: LocaleCode[] = availableLocales.map((l) => l.code);

export function isLocale(code: string): code is LocaleCode {
  return localeCodes.includes(code as LocaleCode);
}
