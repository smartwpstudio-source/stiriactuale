import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getArticleBySection, getArticlesBySection } from "@/lib/content/queries";
import { raionLabel } from "@/lib/content/geo";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl, breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getArticlesBySection("regiuni").map((a) => ({ raion: a.locality!, slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ raion: string; slug: string }>;
}): Promise<Metadata> {
  const { raion, slug } = await params;
  const article = getArticleBySection("regiuni", slug, raion);
  if (!article) return {};

  const url = articleUrl(article);
  return {
    title: article.title,
    description: article.lead,
    alternates: { canonical: url },
    openGraph: { title: article.title, description: article.lead, type: "article", url },
  };
}

export default async function RegiuniArticlePage({
  params,
}: {
  params: Promise<{ raion: string; slug: string }>;
}) {
  const { raion, slug } = await params;
  const article = getArticleBySection("regiuni", slug, raion);
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <ArticlePage article={article} breadcrumbItems={breadcrumbItems} />
    </>
  );
}
