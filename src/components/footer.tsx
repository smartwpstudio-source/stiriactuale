import Link from "next/link";
import { SECTION_LABELS } from "@/lib/content/geo";
import { TELEGRAM_URL } from "@/lib/site-info";

const INFO = [
  { href: "/despre/", label: "Despre noi" },
  { href: "/politica-editoriala/", label: "Politica editorială" },
  { href: "/confidentialitate/", label: "Confidențialitate" },
  { href: "/contact/", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-paper">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
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
          <a href={TELEGRAM_URL} className="hover:text-amber">
            Telegram
          </a>
          <Link href="/cautare/" className="hover:text-amber">
            Căutare
          </Link>
        </div>
      </div>
      <p className="mx-auto max-w-5xl px-4 pb-6 font-mono text-xs text-paper/70">
        © {new Date().getFullYear()} Stiri actuale · Știri redactate cu ajutorul inteligenței artificiale, verificate de
        un editor.
      </p>
    </footer>
  );
}
