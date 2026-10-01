import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getArticleBySection } from "@/lib/content/queries";
import { countryLabel } from "@/lib/content/geo";
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
  params: Promise<{ tara: string; slug: string }>;
}): Promise<Metadata> {
  const { tara, slug } = await params;
  const article = await getArticleBySection("diaspora", slug, undefined, tara);
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

export default async function DiasporaArticlePage({
  params,
}: {
  params: Promise<{ tara: string; slug: string }>;
}) {
  const { tara, slug } = await params;
  const article = await getArticleBySection("diaspora", slug, undefined, tara);
  if (!article) notFound();

  const countryName = countryLabel(tara);
  const breadcrumbItems = [
    { label: "Acasă", href: "/" },
    { label: "Diaspora", href: "/diaspora" },
    { label: countryName, href: `/diaspora/${tara}` },
    { label: article.title },
  ];

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Acasă", url: absoluteUrl("/") },
      { name: "Diaspora", url: absoluteUrl("/diaspora/") },
      { name: countryName, url: absoluteUrl(`/diaspora/${tara}/`) },
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
