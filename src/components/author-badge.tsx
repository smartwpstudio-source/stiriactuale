import Image from "next/image";
import Link from "next/link";
import { AUTHORS, authorPath } from "@/lib/content/analyses";

// Autorul analizei: poza (sau inițialele, până vine poza), numele, rolul.
export function AuthorBadge({ slug, date, size = "md" }: { slug: string; date?: string; size?: "sm" | "md" }) {
  const a = AUTHORS[slug];
  if (!a) return null;
  const px = size === "sm" ? 36 : 48;
  const initials = a.name.split(" ").map((w) => w[0]).join("");
  return (
    <Link prefetch={false} href={authorPath(slug)} className="flex items-center gap-3 hover:text-teal">
      {a.photo ? (
        <Image src={a.photo} alt={a.name} width={px} height={px} className="shrink-0 rounded-full object-cover" />
      ) : (
        <span style={{ width: px, height: px }} className="flex shrink-0 items-center justify-center rounded-full bg-ink font-serif text-white">
          {initials}
        </span>
      )}
      <span className="leading-tight">
        <span className="block font-medium text-ink">{a.name}</span>
        <span className="block font-mono text-xs text-sub">
          {a.role}
          {date && ` · ${new Date(`${date}T12:00:00Z`).toLocaleDateString("ro-MD", { day: "numeric", month: "long", year: "numeric" })}`}
        </span>
      </span>
    </Link>
  );
}
