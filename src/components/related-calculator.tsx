import Link from "next/link";
import { IconCalculator } from "@tabler/icons-react";

// „Calculator util” sub știre (related-calculator.ts) — la fel ca „Ghid util”.
export function RelatedCalculator({ calc }: { calc: { slug: string; title: string; description: string } }) {
  return (
    <Link
      href={`/calculatoare/${calc.slug}/`}
      className="mt-6 flex items-start gap-3 rounded-lg border border-amber-ink/40 bg-white p-4 hover:border-amber-ink"
    >
      <IconCalculator size={24} stroke={1.75} className="mt-0.5 shrink-0 text-amber-ink" aria-hidden />
      <span>
        <span className="block font-mono text-xs uppercase tracking-wide text-amber-ink">Calculator util</span>
        <span className="mt-1 block font-medium leading-snug text-ink">{calc.title}</span>
        <span className="mt-1 block text-sm text-sub">{calc.description}</span>
      </span>
    </Link>
  );
}
