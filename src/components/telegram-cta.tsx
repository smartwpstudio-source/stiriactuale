import { IconBrandTelegram } from "@tabler/icons-react";
import { TELEGRAM_URL } from "@/lib/site-info";

// Abonarea la canalul de Telegram, în culorile Telegram (cererea proprietarului:
// să fie recunoscut dintr-o privire și să atragă atenția). Sub butoanele de
// share — pentru cine vrea să revină, nu pentru cine tocmai a citit; ordinea
// share -> Telegram nu se inversează, cf. sistem-design-ui.md secțiunea 5.
// Gradientul e în style inline: modificatorii de culoare Tailwind nu se
// aplicau consecvent în dev (Turbopack).
export function TelegramCta() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-5 flex flex-col gap-4 rounded-xl p-5 text-white shadow-md transition-shadow hover:shadow-lg sm:flex-row sm:items-center"
      style={{ background: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)" }}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
        <IconBrandTelegram size={28} stroke={1.75} aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-sans text-lg font-semibold leading-snug">Știrile importante, direct pe Telegram</span>
        <span className="mt-1 block font-sans text-sm text-white/90">
          Abonează-te la canalul Reporter News: ce s-a întâmplat azi în Moldova, imediat ce apare. Gratuit, te
          dezabonezi oricând.
        </span>
      </span>
      <span className="shrink-0 self-start rounded-full bg-white px-5 py-2.5 text-center font-sans text-sm font-semibold text-[#229ED9] transition-transform group-hover:scale-105 sm:self-center">
        Abonează-te
      </span>
    </a>
  );
}
