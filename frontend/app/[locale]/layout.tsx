import { use } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { isLocale, type LocaleCode } from "@/lib/i18n";
import { getMessages } from "@/lib/loadMessages";

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = use(params);
  if (!isLocale(locale)) {
    notFound();
  }
  const messages = getMessages(locale as LocaleCode);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header locale={locale as LocaleCode} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale as LocaleCode} />
    </NextIntlClientProvider>
  );
}
