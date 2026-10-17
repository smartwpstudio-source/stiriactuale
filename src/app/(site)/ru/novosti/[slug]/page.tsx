import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleThumb } from "@/components/article-thumb";
import { ShareButtons } from "@/components/share-buttons";
import { VideoEmbed } from "@/components/video-embed";
import { ImpactBlock } from "@/components/impact-block";
import { getRuArticle } from "@/lib/content/queries";
import { getGuideRu, localizeLinks, ruSlugs } from "@/lib/content/guides-ru";
import { sanitizeBody } from "@/lib/content/sanitize";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";
import { resolveTools, type Tool } from "@/lib/impact";
import { calcText } from "@/components/calc/i18n";
import { COMPLAINT_MODELS, modelText } from "@/lib/complaint-models";
import { AI_IMAGE_PREFIX } from "@/lib/pipeline/image";
import { RU_NEWS_PUBLIC, ruNewsPath } from "@/lib/ru-news-public";
import type { CalculatorSlug } from "@/lib/calculators";

// Știrea tradusă în rusă (src/lib/pipeline/ru-news.ts). Ca la articolele RO:
// nimic la build, generată la prima vizită, refăcută la cerere (/api/revalidate/).
export const revalidate = 604800; // 7 zile: modificările vin la cerere (/api/revalidate/), fiecare regenerare costă CPU

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await getRuArticle((await params).slug);
  if (!found) return {};
  const { article, ru } = found;
  const url = ruNewsPath(article.slug);
  const image = article.imageUrl ?? `/og/?${new URLSearchParams({ t: ru.title, s: "Новости" })}`;
  return {
    title: ru.title,
    description: ru.metaDescription,
    alternates: { canonical: url, ...(RU_NEWS_PUBLIC && { languages: { ro: articleUrl(article), ru: url } }) },
    // vizibile pentru Google abia după activare (ru-news-public.ts)
    ...(!RU_NEWS_PUBLIC && { robots: { index: false, follow: true } }),
    openGraph: { title: ru.title, description: ru.metaDescription, type: "article", url, locale: "ru_MD", publishedTime: article.publishedAt, images: [{ url: image, width: 1200, height: 630 }] },
  };
}

function imageLabel(url?: string, credit?: string): string | null {
  if (credit) return `Фото: ${credit}`;
  if (!url) return null;
  if (url.includes(`/${AI_IMAGE_PREFIX}`)) return "Изображение создано ИИ";
  return url.includes("/articole/") || url.includes("/locuri/") ? "Иллюстративное фото" : null;
}

// Uneltele blocului de impact, spre variantele rusești (unde există) și cu titlul rusesc.
async function ruTools(tools: Tool[], ru: Set<string>): Promise<Tool[]> {
  return Promise.all(
    tools.map(async (t) => {
      const slug = t.id.split(":")[1];
      const href = localizeLinks(`href="${t.href}"`, ru).slice(6, -1);
      const title =
        t.kind === "calc"
          ? calcText({ slug: slug as CalculatorSlug, title: t.title, description: "" }, "ru").title
          : t.kind === "model"
            ? (() => {
                const m = COMPLAINT_MODELS.find((x) => x.slug === slug);
                return m ? modelText(m, "ru").title : t.title;
              })()
            : ((ru.has(slug) && (await getGuideRu(slug))?.title) || t.title);
      return { ...t, href, title };
    }),
  );
}

const DATE: Intl.DateTimeFormatOptions = { timeZone: "Europe/Chisinau", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" };

export default async function RuNewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getRuArticle((await params).slug);
  if (!found) notFound();
  const { article, ru } = found;
  const url = absoluteUrl(ruNewsPath(article.slug));
  const slugs = await ruSlugs();
  const tools = article.impact && ru.impact ? await ruTools(await resolveTools(article.impact.unelte), slugs) : [];
  const label = article.videoUrl ? null : imageLabel(article.imageUrl, article.imageCredit);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: ru.title,
    description: ru.lead,
    inLanguage: "ru",
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    url,
    mainEntityOfPage: url,
    ...(article.imageUrl ? { image: [article.imageUrl] } : {}),
    author: { "@type": "Organization", name: "Știri Actuale" },
    publisher: { "@type": "Organization", name: "Știri Actuale", logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png?v=2") } },
  };

  return (
    <article lang="ru" className="mx-auto w-full max-w-[760px] px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="font-mono text-xs uppercase tracking-wide text-sub">
        <Link prefetch={false} href="/" className="hover:text-ink">Știri Actuale</Link> ›{" "}
        <Link prefetch={false} href="/ru/" className="hover:text-ink">Новости</Link>
      </nav>
      <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">{ru.title}</h1>
      <p className="mt-4 font-mono text-sm text-sub">
        {new Date(article.publishedAt).toLocaleString("ru-RU", DATE)}
        {" · "}
        <Link prefetch={false} href={articleUrl(article)} lang="ro" hrefLang="ro" className="text-teal underline">
          Citește în română
        </Link>
      </p>
      <ShareButtons url={url} title={ru.title} />
      {article.videoUrl ? (
        <VideoEmbed src={article.videoUrl} title={ru.title} />
      ) : (
        <>
          <ArticleThumb
            topics={article.topics}
            imageUrl={article.imageUrl}
            imageAlt={ru.title}
            className="mt-6 aspect-video w-full rounded"
            iconSize={64}
            sizes="(max-width: 768px) 100vw, 760px"
            priority
          />
          {label && <p className="mt-1.5 text-sm text-sub">{label}</p>}
        </>
      )}
      <p className="mt-6 text-xl font-medium leading-relaxed text-ink">{ru.lead}</p>
      {article.impact && ru.impact && (
        <ImpactBlock slug={article.slug} impact={{ ...article.impact, ...ru.impact }} tools={tools} source={article.sources?.[0]?.name} lang="ru" />
      )}
      <div className="prose-article mt-4 text-ink" dangerouslySetInnerHTML={{ __html: localizeLinks(sanitizeBody(ru.bodyHtml, ru.title), slugs) }} />
      {article.sources && article.sources.length > 0 && (
        <p className="mt-6 text-sm text-sub">
          Источники:{" "}
          {article.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener nofollow" className="underline hover:text-ink">
                {s.name}
              </a>
            </span>
          ))}
        </p>
      )}
      <p className="mt-8 rounded border border-line bg-white p-4 text-sm text-sub">
        Перевод новости с румынского языка. <Link prefetch={false} href="/ru/" className="text-teal underline">Все новости на русском</Link>
      </p>
    </article>
  );
}
