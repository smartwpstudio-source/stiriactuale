import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ArticleRow } from "@/components/article-row";
import { listArticles } from "@/lib/content/queries";
import { IconBook2, IconCalculator } from "@tabler/icons-react";
import { availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";
import { calcPath, calcText } from "@/components/calc/i18n";
import { getGuides } from "@/lib/content/guides";
import { matchTools, searchTerms } from "@/lib/search/tools";

// Rezultatele de căutare nu se indexează (conținut duplicat, infinit de URL-uri).
export const metadata: Metadata = {
  title: "Căutare",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: PageProps<"/cautare">) {
  const { q, pagina } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(pagina) || 1);
  const result = query.length >= 2 ? await listArticles({ q: query, includeArchived: true }, page) : null;
  // calculatoarele și ghidurile potrivite, deasupra știrilor (doar pe prima pagină)
  const terms = page === 1 ? searchTerms(query) : [];
  const calcs = terms.length ? matchTools(availableCalculators(await getCalcParams()).map((c) => calcText(c, "ro")), terms, 6) : [];
  const guides = terms.length ? matchTools(await getGuides(), terms, 8) : [];
  const pageHref = (p: number) => `/cautare/?q=${encodeURIComponent(query)}${p > 1 ? `&pagina=${p}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">Căutare</h1>
      <Form action="/cautare/" className="mt-4 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="ex. Cahul, prețuri, pensii"
          aria-label="Caută în știri"
          autoFocus={!query}
          className="flex-1 rounded border border-line bg-white px-3 py-2 text-ink"
        />
        <button className="rounded bg-ink px-4 py-2 text-paper">Caută</button>
      </Form>

      {(calcs.length > 0 || guides.length > 0) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {calcs.length > 0 && (
            <section>
              <h2 className="font-mono text-xs uppercase tracking-wide text-teal">Calculatoare</h2>
              <ul className="mt-2 space-y-2">
                {calcs.map((c) => (
                  <li key={c.slug}>
                    <Link prefetch={false} href={calcPath(c.slug, "ro")} className="flex items-start gap-2 rounded border border-line bg-white p-3 hover:border-teal">
                      <IconCalculator size={20} stroke={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                      <span className="font-medium leading-snug text-ink">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {guides.length > 0 && (
            <section>
              <h2 className="font-mono text-xs uppercase tracking-wide text-teal">Ghiduri</h2>
              <ul className="mt-2 space-y-2">
                {guides.map((g) => (
                  <li key={g.slug}>
                    <Link prefetch={false} href={`/ghiduri/${g.slug}/`} className="flex items-start gap-2 rounded border border-line bg-white p-3 hover:border-teal">
                      <IconBook2 size={20} stroke={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                      <span className="font-medium leading-snug text-ink">{g.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <p className="font-mono text-xs text-sub">
            {result.total} {result.total === 1 ? "știre găsită" : "știri găsite"}
          </p>
          {result.items.map((a) => (
            <ArticleRow key={a.slug} article={a} />
          ))}
          {result.pages > 1 && (
            <nav aria-label="Paginare" className="mt-8 flex justify-between font-mono text-sm">
              {page > 1 ? <Link prefetch={false} href={pageHref(page - 1)}>← Înapoi</Link> : <span />}
              <span className="text-sub">
                {page} / {result.pages}
              </span>
              {page < result.pages ? <Link prefetch={false} href={pageHref(page + 1)}>Mai departe →</Link> : <span />}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
