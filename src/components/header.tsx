import Link from "next/link";
import { IconSearch } from "@tabler/icons-react";

const NAV = [
  { href: "/regiuni", label: "Regiuni" },
  { href: "/national", label: "Național" },
  { href: "/international", label: "Internațional" },
  { href: "/diaspora", label: "Diaspora" },
];

export function Header() {
  return (
    <header className="bg-ink text-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-2xl italic">
          Stiri actuale
        </Link>
        <nav className="hidden gap-5 font-sans text-sm sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-amber">
              {item.label}
            </Link>
          ))}
        </nav>
        <button type="button" aria-label="Căutare" className="text-paper hover:text-amber">
          <IconSearch size={18} stroke={1.75} />
        </button>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-4 pb-3 font-sans text-sm sm:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-amber">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
