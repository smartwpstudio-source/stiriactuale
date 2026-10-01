import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ArticleRow } from "@/components/article-row";
import { listArticles } from "@/lib/content/queries";

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
  const pageHref = (p: number) => `/cautare/?q=${encodeURIComponent(query)}${p > 1 ? `&pagina=${p}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="font-serif text-2xl text-ink">Căutare</h1>
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

      {result && (
        <div className="mt-6">
          <p className="font-mono text-xs text-sub">
            {result.total} {result.total === 1 ? "rezultat" : "rezultate"}
          </p>
          {result.items.map((a) => (
            <ArticleRow key={a.slug} article={a} />
          ))}
          {result.pages > 1 && (
            <nav aria-label="Paginare" className="mt-8 flex justify-between font-mono text-sm">
              {page > 1 ? <Link href={pageHref(page - 1)}>← Înapoi</Link> : <span />}
              <span className="text-sub">
                {page} / {result.pages}
              </span>
              {page < result.pages ? <Link href={pageHref(page + 1)}>Mai departe →</Link> : <span />}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
