import Link from "next/link";
import { analysisPath, type Analysis } from "@/lib/content/analyses";
import { AuthorBadge } from "./author-badge";

// Cardul unei analize în liste: eticheta, titlul, teza, autorul — distinct de știri.
export function AnalysisCard({ a }: { a: Analysis }) {
  return (
    <article className="rounded-lg border-l-4 border-ink bg-white p-5">
      <span className="inline-block rounded bg-ink px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-white">Analiză</span>
      <Link href={analysisPath(a)} className="group block">
        <h3 className="mt-2 font-serif text-xl leading-snug text-ink group-hover:text-teal sm:text-2xl">{a.title}</h3>
        <p className="mt-2 text-[0.95rem] italic text-sub">{a.thesis}</p>
      </Link>
      <div className="mt-4">
        <AuthorBadge slug={a.author} date={a.published} size="sm" />
      </div>
    </article>
  );
}
