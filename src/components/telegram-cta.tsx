import { IconBrandTelegram } from "@tabler/icons-react";
import { TELEGRAM_URL } from "@/lib/site-info";

// Mai vizibil decât share buttons (fundal + bordură amber), sub ele — pentru
// cine vrea să revină, nu pentru cine tocmai a citit. Ordinea share -> Telegram
// nu se inversează, cf. sistem-design-ui.md secțiunea 5.
export function TelegramCta() {
  // Fundal via style inline, nu clasă Tailwind: modificatorii de opacitate pe
  // culori (ex. bg-amber/[0.08]) nu se aplicau consecvent în acest mediu de
  // dev (Turbopack) — valoarea exactă cerută (rgba(201,141,46,.08)) aplicată
  // direct evită problema, fără să depindă de o rezolvare de cascadă CSS.
  return (
    <div
      className="mt-4 flex items-center justify-between gap-4 rounded border border-amber p-4"
      style={{ backgroundColor: "rgba(201,141,46,.08)" }}
    >
      <div className="flex items-center gap-3">
        <IconBrandTelegram size={22} stroke={1.75} className="shrink-0 text-amber-ink" />
        <p className="font-sans text-sm text-ink">
          Fii primul care află — abonează-te la canalul Reporter News
        </p>
      </div>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded border border-amber px-3 py-1.5 font-mono text-xs text-amber-ink hover:bg-amber hover:text-paper"
      >
        Abonează-te
      </a>
    </div>
  );
}
