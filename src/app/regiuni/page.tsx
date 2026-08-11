import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionFilterChips } from "@/components/section-filter-chips";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection, getRaioaneWithArticles } from "@/lib/content/queries";
import { raionLabel } from "@/lib/content/geo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Regiuni",
  description: "Ultimele știri din regiunile și raioanele Republicii Moldova.",
  alternates: { canonical: "/regiuni/" },
};

export default function RegiuniPage() {
  const articles = getArticlesBySection("regiuni");
  const raioane = getRaioaneWithArticles().map((slug) => ({ slug, label: raionLabel(slug) }));

  const jsonLd = breadcrumbJsonLd([
    { name: "Acasă", url: absoluteUrl("/") },
    { name: "Regiuni", url: absoluteUrl("/regiuni/") },
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Regiuni" }]} />
      <h1 className="mt-2 font-serif text-2xl text-ink">Regiuni</h1>
      <SectionFilterChips basePath="/regiuni" items={raioane} />
      <div className="mt-6">
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
