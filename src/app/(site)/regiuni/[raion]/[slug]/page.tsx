import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getArticleBySection } from "@/lib/content/queries";
import { raionLabel } from "@/lib/content/geo";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl, breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/seo";

export const revalidate = 300;

// Listă goală = nimic la build, fiecare URL se generează la prima vizită și
// apoi se servește din cache (ISR). Fără ea, ruta ar fi randată la FIECARE
// cerere, deși are `revalidate`.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raion: string; slug: string }>;
}): Promise<Metadata> {
  const { raion, slug } = await params;
  const article = await getArticleBySection("regiuni", slug, raion);
  if (!article) return {};

  const url = articleUrl(article);
  return {
    title: article.title,
    description: article.lead,
    alternates: { canonical: url },
    // arhivă preluată de la altă redacție — nu se indexează (conținut duplicat)
    ...(article.archived && { robots: { index: false, follow: true } }),
    openGraph: { title: article.title, description: article.lead, type: "article", url },
  };
}

export default async function RegiuniArticlePage({
  params,
}: {
  params: Promise<{ raion: string; slug: string }>;
}) {
  const { raion, slug } = await params;
  const article = await getArticleBySection("regiuni", slug, raion);
  if (!article) notFound();

  const raionName = raionLabel(raion);
  const breadcrumbItems = [
    { label: "Acasă", href: "/" },
    { label: "Regiuni", href: "/regiuni" },
    { label: raionName, href: `/regiuni/${raion}` },
    { label: article.title },
  ];

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Acasă", url: absoluteUrl("/") },
      { name: "Regiuni", url: absoluteUrl("/regiuni/") },
      { name: raionName, url: absoluteUrl(`/regiuni/${raion}/`) },
      { name: article.title, url: absoluteUrl(articleUrl(article)) },
    ]),
    newsArticleJsonLd(article),
  ];

  return (
    <>
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
      ))}
      <ArticlePage article={article} breadcrumbItems={breadcrumbItems} />
    </>
  );
}
