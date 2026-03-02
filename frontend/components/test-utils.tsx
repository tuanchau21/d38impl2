import React from "react";
import { NextIntlClientProvider } from "next-intl";

const defaultMessages = {
  common: {
    noImage: "No image",
    noImages: "No images",
    perBox: "per box",
    promoted: "Promoted",
    viewDetails: "View details",
  },
};

export function IntlWrapper({
  children,
  messages = defaultMessages,
  locale = "en",
}: {
  children: React.ReactNode;
  messages?: Record<string, Record<string, string>>;
  locale?: string;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
