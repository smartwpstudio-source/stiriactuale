import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionFilterChips } from "@/components/section-filter-chips";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection } from "@/lib/content/queries";
import { COUNTRY_NAMES, countryLabel } from "@/lib/content/geo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

export function generateStaticParams() {
  return Object.keys(COUNTRY_NAMES).map((tara) => ({ tara }));
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
  if (!(tara in COUNTRY_NAMES)) notFound();

  const articles = await getArticlesBySection("diaspora", { country: tara });
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
        items={Object.keys(COUNTRY_NAMES).map((slug) => ({ slug, label: countryLabel(slug) }))}
        active={tara}
      />
      <div className="mt-6">
        {articles.length === 0 && (
          <p className="font-mono text-sm text-sub">Niciun articol publicat încă din {label}.</p>
        )}
        {articles.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
