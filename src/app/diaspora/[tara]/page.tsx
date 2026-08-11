import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionFilterChips } from "@/components/section-filter-chips";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection, getCountriesWithArticles } from "@/lib/content/queries";
import { countryLabel } from "@/lib/content/geo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getCountriesWithArticles().map((tara) => ({ tara }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tara: string }>;
}): Promise<Metadata> {
  const { tara } = await params;
  const label = countryLabel(tara);
  return {
    title: `Diaspora — ${label}`,
    description: `Ultimele știri despre moldovenii din ${label}.`,
    alternates: { canonical: `/diaspora/${tara}/` },
  };
}

export default async function DiasporaTaraPage({
  params,
}: {
  params: Promise<{ tara: string }>;
}) {
  const { tara } = await params;
  const countries = getCountriesWithArticles();
  if (!countries.includes(tara)) notFound();

  const articles = getArticlesBySection("diaspora", { country: tara });
  const label = countryLabel(tara);

  const jsonLd = breadcrumbJsonLd([
    { name: "Acasă", url: absoluteUrl("/") },
    { name: "Diaspora", url: absoluteUrl("/diaspora/") },
    { name: label, url: absoluteUrl(`/diaspora/${tara}/`) },
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
          { label: "Diaspora", href: "/diaspora" },
          { label },
        ]}
      />
      <h1 className="mt-2 font-serif text-2xl text-ink">Diaspora — {label}</h1>
      <SectionFilterChips
        basePath="/diaspora"
        items={countries.map((slug) => ({ slug, label: countryLabel(slug) }))}
        active={tara}
      />
      <div className="mt-6">
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
