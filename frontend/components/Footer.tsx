import Link from "next/link";
import { useTranslations } from "next-intl";
import type { LocaleCode } from "@/lib/i18n";

interface FooterProps {
  locale: LocaleCode;
}

export function Footer({ locale }: FooterProps) {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>{tFooter("copyright")}</span>
        <Link
          href={`/${locale}/admin`}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {tNav("admin")}
        </Link>
      </div>
    </footer>
  );
}
