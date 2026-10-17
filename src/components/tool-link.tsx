"use client";

import Link from "next/link";

// Butonul spre unealtă din blocul de impact: numără click-ul (aceeași rută ca
// afișările, fără cookie-uri), ca să vedem câți trec de la știre la unealtă.
export function ToolLink({ slug, href, className, children }: { slug: string; href: string; className: string; children: React.ReactNode }) {
  return (
    <Link prefetch={false}
      href={href}
      className={className}
      onClick={() => navigator.sendBeacon?.("/api/view/", JSON.stringify({ slug, impact: true }))}
    >
      {children}
    </Link>
  );
}
