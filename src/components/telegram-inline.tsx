import { IconBrandTelegram } from "@tabler/icons-react";
import { TELEGRAM_URL } from "@/lib/site-info";

// Rândul scurt de abonare de la începutul articolului (2026-10-20): blocul mare
// TelegramCta de la final îl vedeau doar cei care citeau până la capăt.
export function TelegramInline() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-sans text-sm font-medium text-white"
      style={{ background: "#229ED9" }}
    >
      <IconBrandTelegram size={18} stroke={1.75} aria-hidden />
      Știrile importante, pe Telegram
    </a>
  );
}
