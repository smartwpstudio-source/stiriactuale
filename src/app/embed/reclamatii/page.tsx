import type { Metadata } from "next";
import { EmbedHeight } from "@/components/calc/embed-height";
import { COMPLAINT_MODELS } from "@/lib/complaint-models";

// Lista modelelor de reclamații, ca widget pentru alte site-uri (iframe): fiecare
// model se deschide pe stiriactuale.info. noindex: e doar un widget.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function ComplaintsListEmbedPage() {
  return (
    <div className="mx-auto w-full max-w-[640px] bg-paper p-3 sm:p-4">
      <EmbedHeight slug="reclamatii" />
      <h1 className="font-serif text-xl text-ink sm:text-2xl">Modele de reclamații</h1>
      <p className="mt-1 text-sm text-sub">Completezi online, gratuit, și o trimiți instituției.</p>
      <ul className="mt-3 divide-y divide-line rounded border border-line bg-white">
        {COMPLAINT_MODELS.map((m) => (
          <li key={m.slug}>
            <a href={`/modele-reclamatii/${m.slug}/`} target="_blank" rel="noopener" className="block px-3 py-2 text-[0.95rem] text-ink hover:bg-paper hover:text-teal">
              {m.title} →
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-sub">
        <a href="/modele-reclamatii/" target="_blank" rel="noopener" className="underline">
          Știri Actuale — modele de reclamații și ghiduri
        </a>
      </p>
    </div>
  );
}
