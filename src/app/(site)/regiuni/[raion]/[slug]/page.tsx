import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { getArticleBySection } from "@/lib/content/queries";
import { raionLabel } from "@/lib/content/geo";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl, articleMetadata, breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/seo";

export const revalidate = 86400; // la cerere din pipeline (/api/revalidate/), ceasul e doar plasă

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

  return articleMetadata(article);
}

export default async function RegiuniArticlePage({
  params,
}: {
  params: Promise<{ raion: string; slug: string }>;
}) {
  const { raion, slug } = await params;
  const article = await getArticleBySection("regiuni", slug, raion);
  if (!article) {
    // raionul corectat după publicare: adresa veche duce la cea nouă
    const moved = await getArticleBySection("regiuni", slug);
    if (moved?.locality && moved.locality !== raion) permanentRedirect(`/regiuni/${moved.locality}/${slug}/`);
    notFound();
  }

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
