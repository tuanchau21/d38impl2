import { use } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { isLocale } from "@/lib/i18n";

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
  return (
    <>
      <Header locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
