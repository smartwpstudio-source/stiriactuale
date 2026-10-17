"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { NAV } from "./nav-links";

// Meniul pe mobil: buton "hamburger" care deschide secțiunile pe verticală —
// rândul derulant pe orizontală ascundea "Ghiduri" în afara ecranului.
export function MobileMenu() {
  const pathname = usePathname();
  // deschis doar pe pagina pe care a fost deschis — se închide singur la
  // navigare (client-side), fără efect
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpenOn(open ? null : pathname)}
        aria-label={open ? "Închide meniul" : "Deschide meniul"}
        aria-expanded={open}
        aria-controls="meniu-mobil"
        className="flex h-10 w-10 items-center justify-center rounded text-paper hover:text-amber"
      >
        {open ? <IconX size={26} stroke={1.75} /> : <IconMenu2 size={26} stroke={1.75} />}
      </button>
      {open && (
        <nav id="meniu-mobil" className="absolute inset-x-0 top-full z-50 border-t border-white/10 bg-ink shadow-lg">
          <ul className="mx-auto max-w-7xl px-4 py-2">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link prefetch={false}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block border-b border-white/10 py-3 font-sans text-lg font-medium ${active ? "text-amber" : "text-paper"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link prefetch={false} href="/cautare/" className="block py-3 font-sans text-lg font-medium text-paper">
                Căutare
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
