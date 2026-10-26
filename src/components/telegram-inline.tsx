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
      className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-[#229ed9] px-3 py-2 font-sans text-sm font-medium text-white hover:bg-[#1e8bc0]"
    >
      <IconBrandTelegram size={18} stroke={1.75} aria-hidden />
      Știrile importante, pe Telegram
    </a>
  );
}
