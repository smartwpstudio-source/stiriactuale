import Link from "next/link";
import { IconSearch } from "@tabler/icons-react";
import { NavLinks } from "./nav-links";

export function Header() {
  return (
    <header className="bg-ink text-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-2xl italic">
          Stiri actuale
        </Link>
        <NavLinks className="hidden gap-5 font-sans text-sm sm:flex" itemClassName="" />
        <Link href="/cautare/" aria-label="Căutare" className="text-paper hover:text-amber">
          <IconSearch size={18} stroke={1.75} />
        </Link>
      </div>
      <NavLinks
        className="flex gap-4 overflow-x-auto px-4 pb-3 font-sans text-sm sm:hidden"
        itemClassName="whitespace-nowrap"
      />
    </header>
  );
}
