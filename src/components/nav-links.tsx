"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/regiuni/", label: "Regiuni" },
  { href: "/national/", label: "Național" },
  { href: "/international/", label: "Lumea" },
  { href: "/diaspora/", label: "Diaspora" },
  { href: "/util/", label: "Util" },
  { href: "/video/", label: "Video" },
  { href: "/ghiduri/", label: "Ghiduri" },
  { href: "/calculatoare/", label: "Calculatoare" },
];

// Secțiunea curentă subliniată în amber — orientare pe articol și pe hub.
export function NavLinks({ className, itemClassName }: { className: string; itemClassName: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link prefetch={false}
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${itemClassName} hover:text-amber ${active ? "text-amber underline decoration-2 underline-offset-8" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
