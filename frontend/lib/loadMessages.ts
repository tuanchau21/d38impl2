import type { LocaleCode } from "@/lib/i18n";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";
import cn from "@/messages/cn.json";
import ru from "@/messages/ru.json";
import vn from "@/messages/vn.json";

const messages: Record<LocaleCode, typeof en> = { en, pl, cn, ru, vn };

export function getMessages(locale: LocaleCode): typeof en {
  return messages[locale] ?? en;
}
