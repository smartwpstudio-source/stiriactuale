import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection } from "@/lib/content/queries";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Național",
  description: "Ultimele știri naționale din Republica Moldova.",
  alternates: { canonical: "/national/" },
};

export default function NationalPage() {
  const articles = getArticlesBySection("national");

  const jsonLd = breadcrumbJsonLd([
    { name: "Acasă", url: absoluteUrl("/") },
    { name: "Național", url: absoluteUrl("/national/") },
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Național" }]} />
      <h1 className="mt-2 font-serif text-2xl text-ink">Național</h1>
      <div className="mt-6">
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
