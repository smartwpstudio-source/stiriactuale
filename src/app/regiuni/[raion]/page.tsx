import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionFilterChips } from "@/components/section-filter-chips";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection, getRaioaneWithArticles } from "@/lib/content/queries";
import { raionLabel } from "@/lib/content/geo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getRaioaneWithArticles().map((raion) => ({ raion }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raion: string }>;
}): Promise<Metadata> {
  const { raion } = await params;
  const label = raionLabel(raion);
  return {
    title: `Regiuni — ${label}`,
    description: `Ultimele știri din raionul ${label}.`,
    alternates: { canonical: `/regiuni/${raion}/` },
  };
}

export default async function RaionPage({
  params,
}: {
  params: Promise<{ raion: string }>;
}) {
  const { raion } = await params;
  const raioane = getRaioaneWithArticles();
  if (!raioane.includes(raion)) notFound();

  const articles = getArticlesBySection("regiuni", { locality: raion });
  const label = raionLabel(raion);

  const jsonLd = breadcrumbJsonLd([
    { name: "Acasă", url: absoluteUrl("/") },
    { name: "Regiuni", url: absoluteUrl("/regiuni/") },
    { name: label, url: absoluteUrl(`/regiuni/${raion}/`) },
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb
        items={[
          { label: "Acasă", href: "/" },
          { label: "Regiuni", href: "/regiuni" },
          { label },
        ]}
      />
      <h1 className="mt-2 font-serif text-2xl text-ink">Regiuni — {label}</h1>
      <SectionFilterChips
        basePath="/regiuni"
        items={raioane.map((slug) => ({ slug, label: raionLabel(slug) }))}
        active={raion}
      />
      <div className="mt-6">
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
