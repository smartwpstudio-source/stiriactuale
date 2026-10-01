import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "./breadcrumb";
import { ArticleCard } from "./article-card";
import { PlaceInfoBox } from "./place-info";
import { getPlaceInfo } from "@/lib/content/places";
import { SectionFilterChips } from "./section-filter-chips";
import { getHubCounts, listArticles } from "@/lib/content/queries";
import { countryLabel, raionLabel } from "@/lib/content/geo";
import { pagePath, type Hub } from "@/lib/content/hubs";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

// Hub gol -> noindex: zeci de pagini de raion fără conținut arată pentru
// Google ca "thin content" și trag în jos tot site-ul.
export async function hubMetadata(hub: Hub | null, page: number): Promise<Metadata> {
  if (!hub) return {};
  const [{ total }, place] = await Promise.all([
    listArticles(hub.filter, 1, 1),
    hub.place ? getPlaceInfo(hub.place.kind, hub.place.slug) : null,
  ]);
  return {
    title: page > 1 ? `${hub.title} — pagina ${page}` : hub.title,
    description: hub.description,
    alternates: { canonical: pagePath(hub, page) },
    // fără articole și fără informații utile = pagină goală pentru Google
    ...(total === 0 && !place && { robots: { index: false, follow: true } }),
  };
}

export async function HubPage({ hub, page }: { hub: Hub | null; page: number | null }) {
  if (!hub || !page) notFound();
  const [{ items, pages }, counts, place] = await Promise.all([
    listArticles(hub.filter, page),
    hub.chips ? getHubCounts() : null,
    hub.place && page === 1 ? getPlaceInfo(hub.place.kind, hub.place.slug) : null,
  ]);
  if (page > pages) notFound();

  // filtre doar pentru raioanele/țările cu articole (+ cel curent)
  const chips = hub.chips;
  const chipItems =
    chips &&
    counts &&
    [...new Set([...Object.keys(chips.kind === "raion" ? counts.localities : counts.countries), ...(chips.active ? [chips.active] : [])])]
      .map((slug) => ({ slug, label: chips.kind === "raion" ? raionLabel(slug) : countryLabel(slug) }))
      .sort((a, b) => a.label.localeCompare(b.label, "ro"));

  const jsonLd = breadcrumbJsonLd(
    hub.crumbs.map((c) => ({ name: c.label, url: absoluteUrl(c.href ?? hub.basePath) })),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumb items={hub.crumbs} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
        {hub.title}
        {page > 1 && <span className="text-sub"> — pagina {page}</span>}
      </h1>
      {chipItems && chipItems.length > 0 && (
        <SectionFilterChips basePath={chips!.basePath} items={chipItems} active={chips!.active} />
      )}
      {place && hub.place && <PlaceInfoBox info={place} name={hub.place.name} />}
      {items.length === 0 && <p className="mt-6 font-mono text-sm text-sub">Niciun articol publicat încă.</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
      {pages > 1 && (
        <nav aria-label="Paginare" className="mt-8 flex items-center justify-between font-mono text-sm">
          {page > 1 ? (
            <Link href={pagePath(hub, page - 1)} className="text-ink hover:text-teal">
              ← Mai noi
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sub">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={pagePath(hub, page + 1)} className="text-ink hover:text-teal">
              Mai vechi →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
