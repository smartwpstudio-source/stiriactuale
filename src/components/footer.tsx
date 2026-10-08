import Link from "next/link";
import { SECTION_LABELS } from "@/lib/content/geo";
import { IconBrandFacebook, IconBrandTelegram } from "@tabler/icons-react";
import { FACEBOOK_URL, TELEGRAM_URL } from "@/lib/site-info";
import { PrivacySettingsLink } from "./privacy-settings-link";
import { GooglePreferred } from "./google-preferred";

// secțiunile din meniu care nu sunt în SECTION_LABELS
const MORE = [
  { href: "/video/", label: "Video" },
  { href: "/analiza/", label: "Analiză" },
  { href: "/impact/", label: "Ce te afectează" },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-base sm:grid-cols-3 lg:px-8">
        <nav aria-label="Secțiuni" className="flex flex-col gap-2">
          {Object.entries(SECTION_LABELS).map(([slug, label]) => (
            <Link key={slug} href={`/${slug}/`} className="hover:text-amber">
              {label}
            </Link>
          ))}
          {MORE.map((i) => (
            <Link key={i.href} href={i.href} className="hover:text-amber">
              {i.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Informații" className="flex flex-col gap-2">
          <Link href="/despre/" className="hover:text-amber">
            Despre noi
          </Link>
          <Link href="/politica-editoriala/" className="hover:text-amber">
            Politica editorială
          </Link>
          <Link href="/confidentialitate/" className="hover:text-amber">
            Confidențialitate
          </Link>
          {/* butonul de consimțământ AdSense (GDPR) — trebuie să existe permanent */}
          <PrivacySettingsLink />
          <Link href="/contact/" className="hover:text-amber">
            Contact
          </Link>
          <Link href="/publicitate/" className="hover:text-amber">
            Publicitate
          </Link>
          <Link href="/cautare/" className="hover:text-amber">
            Căutare
          </Link>
        </nav>
        <div className="flex flex-col gap-2">
          <Link href="/ghiduri/" className="hover:text-amber">
            Ghiduri practice
          </Link>
          <Link href="/calculatoare/" className="hover:text-amber">
            Calculatoare
          </Link>
          <Link href="/modele-reclamatii/" className="hover:text-amber">
            Modele de reclamații
          </Link>
          <Link href="/calendar-crestin-ortodox/" className="hover:text-amber">
            Calendar ortodox
          </Link>
          <Link href="/azi-in-istorie/" className="hover:text-amber">
            Azi în istorie
          </Link>
          <div className="mt-2 flex gap-3">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener" aria-label="Telegram" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#229ED9] text-white hover:opacity-85">
              <IconBrandTelegram size={24} stroke={1.75} aria-hidden />
            </a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-85">
              <IconBrandFacebook size={24} stroke={1.75} aria-hidden />
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-6 lg:px-8">
        <GooglePreferred />
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-6 font-mono text-xs text-paper/70 lg:px-8">
        © {new Date().getFullYear()} Stiri actuale · Știri reale, din surse publice indicate la fiecare articol.
      </p>
    </footer>
  );
}
