import Link from "next/link";

// Titlu de bloc pe prima pagină: linie groasă deasupra, link "vezi toate".
export function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between border-t-2 border-ink pt-2">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {href && (
        <Link prefetch={false} href={href} className="font-mono text-sm text-sub hover:text-amber-ink">
          vezi toate →
        </Link>
      )}
    </div>
  );
}
