import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionFilterChips } from "@/components/section-filter-chips";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection } from "@/lib/content/queries";
import { COUNTRY_NAMES, countryLabel } from "@/lib/content/geo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Diaspora",
  description: "Ultimele știri despre moldovenii din diaspora.",
  alternates: { canonical: "/diaspora/" },
};

export default async function DiasporaPage() {
  const articles = await getArticlesBySection("diaspora");
  const countries = Object.keys(COUNTRY_NAMES).map((slug) => ({
    slug,
    label: countryLabel(slug),
  }));

  const jsonLd = breadcrumbJsonLd([
    { name: "Acasă", url: absoluteUrl("/") },
    { name: "Diaspora", url: absoluteUrl("/diaspora/") },
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Diaspora" }]} />
      <h1 className="mt-2 font-serif text-2xl text-ink">Diaspora</h1>
      <SectionFilterChips basePath="/diaspora" items={countries} />
      <div className="mt-6">
        {articles.length === 0 && (
          <p className="font-mono text-sm text-sub">Niciun articol publicat încă.</p>
        )}
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
