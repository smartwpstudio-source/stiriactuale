import Link from "next/link";
import { SECTION_LABELS } from "@/lib/content/geo";
import { TELEGRAM_URL } from "@/lib/site-info";
import { PrivacySettingsLink } from "./privacy-settings-link";

const INFO = [
  { href: "/despre/", label: "Despre noi" },
  { href: "/politica-editoriala/", label: "Politica editorială" },
  { href: "/confidentialitate/", label: "Confidențialitate" },
  { href: "/contact/", label: "Contact" },
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
        </nav>
        <nav aria-label="Informații" className="flex flex-col gap-2">
          {INFO.map((i) => (
            <Link key={i.href} href={i.href} className="hover:text-amber">
              {i.label}
            </Link>
          ))}
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
          <Link href="/publicitate/" className="hover:text-amber">
            Publicitate
          </Link>
          <a href={TELEGRAM_URL} className="hover:text-amber">
            Telegram
          </a>
          <Link href="/cautare/" className="hover:text-amber">
            Căutare
          </Link>
          <PrivacySettingsLink />
        </div>
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-6 font-mono text-xs text-paper/70 lg:px-8">
        © {new Date().getFullYear()} Stiri actuale · Știri reale, din surse publice indicate la fiecare articol.
      </p>
    </footer>
  );
}
