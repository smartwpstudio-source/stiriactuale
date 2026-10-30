import Link from "next/link";
import { IconBrandTelegram, IconSearch } from "@tabler/icons-react";
import { TELEGRAM_URL } from "@/lib/site-info";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import { Logo } from "./logo";

export function Header() {
  return (
    <header className="relative bg-ink text-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 lg:px-8 lg:py-5">
        <div className="flex flex-col items-start gap-1">
          <Logo />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-amber">Știri cu soluții</span>
        </div>
        <NavLinks className="hidden gap-7 font-sans text-base font-medium lg:flex" itemClassName="" />
        <div className="flex items-center gap-2">
          {/* știrile, ghidurile și calculatoarele în rusă (/ru/) */}
          <Link prefetch={false} href="/ru/" lang="ru" aria-label="Новости на русском" className="px-1 font-mono text-sm font-medium text-paper hover:text-amber">
            RU
          </Link>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Canalul de Telegram" className="text-paper hover:text-amber">
            <IconBrandTelegram size={22} stroke={1.75} />
          </a>
          <Link prefetch={false} href="/cautare/" aria-label="Căutare" className="text-paper hover:text-amber">
            <IconSearch size={22} stroke={1.75} />
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
