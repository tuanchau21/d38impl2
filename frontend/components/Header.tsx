"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import * as FlagIcons from "country-flag-icons/react/3x2";
import { availableLocales, type LocaleCode, type FlagCountryCode } from "@/lib/i18n";

interface HeaderProps {
  locale: LocaleCode;
}

export function Header({ locale }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: LocaleCode) => {
    if (newLocale === locale) return;
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const rest = segments.slice(1).join("/");
    const newPath = rest ? `/${newLocale}/${rest}` : `/${newLocale}`;
    router.push(newPath);
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
        <Link
          href={`/${locale}`}
          className="font-semibold text-lg text-gray-900 dark:text-white shrink-0"
        >
          Bulk Shoe Shop
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6 flex-1 justify-end flex-wrap">
          <Link
            href={`/${locale}/catalog`}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Categories
          </Link>
          <Link
            href={`/${locale}/promotions`}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Promotions
          </Link>
          <Link
            href={`/${locale}/admin`}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Admin
          </Link>
          {/* Placeholders for future: Account, Cart — disabled in v1 */}
          <span className="text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed" title="Coming later">
            Account
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-sm cursor-not-allowed" title="Coming later">
            Cart
          </span>
          {/* Language selector: short code + flag icon (country-flag-icons) per translation file */}
          <div className="flex items-center gap-1" role="group" aria-label="Language">
            {availableLocales.map((l) => {
              const FlagComponent = FlagIcons[l.flagCode as keyof typeof FlagIcons] as
                | React.ComponentType<{ className?: string; title?: string }>
                | undefined;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => switchLocale(l.code)}
                  aria-current={l.code === locale ? "true" : undefined}
                  aria-label={`Switch to ${l.label}`}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-sm ${
                    l.code === locale
                      ? "font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  {FlagComponent != null && (
                    <FlagComponent
                      className="w-5 h-[calc(10/3*1rem)] shrink-0"
                      title={l.label}
                      aria-hidden
                    />
                  )}
                  <span>{l.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
