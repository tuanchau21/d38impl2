import { use } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { isLocale, type LocaleCode } from "@/lib/i18n";
import { getMessages } from "@/lib/loadMessages";
import { getSettings } from "@/lib/api";
import { SITE_NAME } from "@/lib/site";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const messages = getMessages(locale as LocaleCode);
  let shopName = SITE_NAME;
  try {
    const settings = await getSettings();
    if (settings.shop_name?.trim()) shopName = settings.shop_name.trim();
  } catch {
    // use default SITE_NAME
  }
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header locale={locale as LocaleCode} shopName={shopName} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale as LocaleCode} />
    </NextIntlClientProvider>
  );
}
