import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionFilterChips } from "@/components/section-filter-chips";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection, getCountriesWithArticles } from "@/lib/content/queries";
import { countryLabel } from "@/lib/content/geo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Diaspora",
  description: "Ultimele știri despre moldovenii din diaspora.",
  alternates: { canonical: "/diaspora/" },
};

export default function DiasporaPage() {
  const articles = getArticlesBySection("diaspora");
  const countries = getCountriesWithArticles().map((slug) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Diaspora" }]} />
      <h1 className="mt-2 font-serif text-2xl text-ink">Diaspora</h1>
      <SectionFilterChips basePath="/diaspora" items={countries} />
      <div className="mt-6">
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
