import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getArticleBySection } from "@/lib/content/queries";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl, articleMetadata, breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/seo";

export const revalidate = 604800; // 7 zile; la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

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
  const article = await getArticleBySection("international", slug);
  if (!article) return {};

  return articleMetadata(article);
}

export default async function InternationalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySection("international", slug);
  if (!article) notFound();

  const breadcrumbItems = [
    { label: "Acasă", href: "/" },
    { label: "Lumea", href: "/international" },
    { label: article.title },
  ];

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Acasă", url: absoluteUrl("/") },
      { name: "Lumea", url: absoluteUrl("/international/") },
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
