import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { defaultLocale, isLocale, type LocaleCode } from "@/lib/i18n";
import { getMessages } from "@/lib/loadMessages";

/** Header set by middleware with the resolved locale for this request. */
const LOCALE_HEADER = "x-next-intl-locale";

export default getRequestConfig(async () => {
  const headersList = await headers();
  const requested = headersList.get(LOCALE_HEADER);
  const locale = (requested && isLocale(requested) ? requested : defaultLocale) as LocaleCode;
  const messages = getMessages(locale);

  return {
    locale,
    messages,
  };
});
