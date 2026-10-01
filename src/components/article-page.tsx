import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";
import { TopicLabel } from "./topic-label";
import { ArticleThumb } from "./article-thumb";
import { ShareButtons } from "./share-buttons";
import { TelegramCta } from "./telegram-cta";
import { SimilarArticles } from "./similar-articles";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { getSimilarArticles } from "@/lib/content/queries";
import { TOPIC_LABELS } from "@/lib/content/topic-meta";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";
import { AI_IMAGE_PREFIX } from "@/lib/pipeline/image";
import { sanitizeBody } from "@/lib/content/sanitize";
import type { Article } from "@/lib/content/types";

// Pattern de pagină articol din sistem-design-ui.md secțiunea 5: breadcrumb,
// etichetă de subiect, H1 Fraunces, byline mono, imagine full-width, lead mai mare,
// corp cu subtitluri H2, tag-uri la final, bloc share + Telegram, articole
// similare. Lățime de citire limitată (~600px).
// Doar pozele puse de pipeline/admin (Blob "articole/") sunt ilustrative; pozele
// arhivei WordPress sunt de regulă fotografii reale ale evenimentului.
function imageLabel(url?: string): string | null {
  if (!url) return null;
  if (url.includes(`/${AI_IMAGE_PREFIX}`)) return "Imagine generată AI";
  return url.includes("/articole/") ? "Foto ilustrativă" : null;
}

const ARCHIVE_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Chisinau",
};

export async function ArticlePage({
  article,
  breadcrumbItems,
}: {
  article: Article;
  breadcrumbItems: BreadcrumbItem[];
}) {
  const similar = await getSimilarArticles(article);

  return (
    // data-no-ads: AdSense nu se încarcă pe arhiva preluată (vezi adsense-script.tsx)
    <article className="mx-auto w-full max-w-[600px] px-4 py-8" data-no-ads={article.archived || undefined}>
      <Breadcrumb items={breadcrumbItems} />
      {article.topics[0] && (
        <div className="mt-3">
          <TopicLabel topic={article.topics[0]} />
        </div>
      )}
      <h1 className="mt-2 font-serif text-3xl leading-tight text-ink">{article.title}</h1>
      <p className="mt-3 font-mono text-xs text-sub">
        {article.archived
          ? `arhivă · ${new Date(article.publishedAt).toLocaleDateString("ro-MD", ARCHIVE_DATE)}`
          : `echipă editorială · ${formatTimeAgo(article.publishedAt)}`}
        {article.sourceCount > 1 && ` · din ${article.sourceCount} surse`}
      </p>
      {article.archived && article.sources?.[0] ? (
        <>
          <p className="mt-6 text-lg leading-relaxed text-ink">{article.lead}</p>
          <a
            href={article.sources[0].url}
            target="_blank"
            rel="noopener"
            className="mt-6 block rounded border border-line bg-white p-4 text-ink hover:border-teal"
          >
            <span className="block font-mono text-xs text-sub">
              Articol din arhivă, preluat de la {article.sources[0].name}
            </span>
            <span className="mt-1 block font-medium text-teal">Citește articolul complet la sursă →</span>
          </a>
        </>
      ) : (
        <>
          <ArticleThumb
            topics={article.topics}
            imageUrl={article.imageUrl}
            imageAlt={article.imageAlt}
            className="mt-6 h-64 w-full"
            iconSize={48}
          />
          {imageLabel(article.imageUrl) && (
            <p className="mt-1 font-mono text-xs text-sub">{imageLabel(article.imageUrl)}</p>
          )}
          <p className="mt-6 text-lg leading-relaxed text-ink">{article.lead}</p>
          <div
            className="prose-article mt-4 text-ink"
            dangerouslySetInnerHTML={{ __html: sanitizeBody(article.bodyHtml) }}
          />
        </>
      )}
      {!article.archived && article.sources && article.sources.length > 0 && (
        <p className="mt-6 text-sm text-sub">
          Surse:{" "}
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
      {article.topics.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-4">
          {article.topics.map((t) => (
            <span
              key={t}
              className="rounded border border-line px-2 py-1 font-mono text-xs text-sub"
            >
              {TOPIC_LABELS[t]}
            </span>
          ))}
        </div>
      )}
      <ShareButtons url={absoluteUrl(articleUrl(article))} title={article.title} />
      <TelegramCta />
      <SimilarArticles articles={similar} />
    </article>
  );
}
