import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getArticleBySection } from "@/lib/content/queries";
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySection("national", slug);
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

export default async function NationalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySection("national", slug);
  if (!article) notFound();

  const breadcrumbItems = [
    { label: "Acasă", href: "/" },
    { label: "Național", href: "/national" },
    { label: article.title },
  ];

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Acasă", url: absoluteUrl("/") },
      { name: "Național", url: absoluteUrl("/national/") },
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
