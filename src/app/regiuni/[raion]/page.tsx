import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionFilterChips } from "@/components/section-filter-chips";
import { ArticleRow } from "@/components/article-row";
import { getArticlesBySection } from "@/lib/content/queries";
import { RAION_NAMES, raionLabel } from "@/lib/content/geo";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

// Universul de raioane e fix și cunoscut (nu depinde de conținut/DB) — poate
// fi pre-generat la build. Articolele din interior se reîmprospătează la
// fiecare revalidare, indiferent dacă raionul are 0 sau N articole azi.
export function generateStaticParams() {
  return Object.keys(RAION_NAMES).map((raion) => ({ raion }));
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
  if (!(raion in RAION_NAMES)) notFound();

  const articles = await getArticlesBySection("regiuni", { locality: raion });
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
        items={Object.keys(RAION_NAMES).map((slug) => ({ slug, label: raionLabel(slug) }))}
        active={raion}
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
