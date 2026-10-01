import Link from "next/link";
import { IconSearch } from "@tabler/icons-react";
import { NavLinks } from "./nav-links";

export function Header() {
  return (
    <header className="bg-ink text-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 lg:px-8 lg:py-5">
        <Link href="/" className="font-serif text-2xl italic sm:text-3xl">
          Stiri actuale
        </Link>
        <NavLinks className="hidden gap-7 font-sans text-base font-medium sm:flex" itemClassName="" />
        <Link href="/cautare/" aria-label="Căutare" className="text-paper hover:text-amber">
          <IconSearch size={22} stroke={1.75} />
        </Link>
      </div>
      <NavLinks
        className="flex gap-5 overflow-x-auto px-4 pb-3 font-sans text-base font-medium sm:hidden"
        itemClassName="whitespace-nowrap"
      />
    </header>
  );
}
