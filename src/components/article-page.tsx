import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";
import { TopicLabel } from "./topic-label";
import { ArticleThumb } from "./article-thumb";
import { ShareButtons } from "./share-buttons";
import { TelegramCta } from "./telegram-cta";
import { PushOptIn } from "./push-opt-in";
import { SimilarArticles } from "./similar-articles";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { getSimilarArticles, listArticles } from "@/lib/content/queries";
import { ArticleRow } from "./article-row";
import { SectionHeading } from "./section-heading";
import { ViewBeacon } from "./view-beacon";
import { TOPIC_LABELS } from "@/lib/content/topic-meta";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";
import { AI_IMAGE_PREFIX } from "@/lib/pipeline/image";
import { sanitizeBody } from "@/lib/content/sanitize";
import { ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";
import { AdSlot } from "./ad-slot";
import { RelatedGuide } from "./related-guide";
import { VideoEmbed } from "./video-embed";
import { getRelatedGuide } from "@/lib/content/related-guide";

// Împarte corpul după al n-lea paragraf; [tot, ""] dacă după el nu mai rămân
// măcar 2 paragrafe (reclama nu stă lipită de final).
function splitAfterParagraph(html: string, n: number): [string, string] {
  let idx = -1;
  for (let i = 0; i < n; i++) {
    idx = html.indexOf("</p>", idx + 1);
    if (idx < 0) return [html, ""];
  }
  const cut = idx + 4;
  const rest = html.slice(cut);
  return (rest.match(/<\/p>/g) ?? []).length >= 2 ? [html.slice(0, cut), rest] : [html, ""];
}
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
  const [similar, { items: latest }, guide] = await Promise.all([
    getSimilarArticles(article),
    listArticles({}, 1, 9),
    article.archived ? undefined : getRelatedGuide(article.title, article.lead),
  ]);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
      {/* data-no-ads: AdSense nu se încarcă pe arhiva preluată (vezi adsense-script.tsx) */}
      <article className="min-w-0 max-w-[720px]" data-no-ads={article.archived || undefined}>
        <Breadcrumb items={breadcrumbItems} />
        {article.topics[0] && (
          <div className="mt-3">
            <TopicLabel topic={article.topics[0]} />
          </div>
        )}
        <h1 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">
          {article.title}
        </h1>
        <p className="mt-4 font-mono text-sm text-sub">
          {article.archived
            ? `arhivă · ${new Date(article.publishedAt).toLocaleDateString("ro-MD", ARCHIVE_DATE)}`
            : `echipă editorială · ${formatTimeAgo(article.publishedAt)}`}
          {article.sourceCount > 1 && ` · din ${article.sourceCount} surse`}
        </p>
        {article.archived && article.sources?.[0] ? (
          <>
            <p className="mt-6 text-xl leading-relaxed text-ink">{article.lead}</p>
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
              className="mt-6 aspect-video w-full rounded"
              iconSize={64}
              sizes="(max-width: 768px) 100vw, 720px"
            priority
            />
            {imageLabel(article.imageUrl) && (
              <p className="mt-1 font-mono text-xs text-sub">{imageLabel(article.imageUrl)}</p>
            )}
            <p className="mt-6 text-xl font-medium leading-relaxed text-ink">{article.lead}</p>
            {article.videoUrl && !article.archived && <VideoEmbed src={article.videoUrl} title={article.title} />}
            {(() => {
              const body = sanitizeBody(article.bodyHtml, article.imageAlt ?? article.title);
              const ads = !article.archived && ADSENSE_IN_ARTICLE_SLOT;
              // primul bloc după al doilea paragraf, doar la articolele cu destul text
              const [head, tail] = ads ? splitAfterParagraph(body, 2) : [body, ""];
              return (
                <>
                  <div className="prose-article mt-4 text-ink" dangerouslySetInnerHTML={{ __html: head }} />
                  {ads && tail && <AdSlot slot={ADSENSE_IN_ARTICLE_SLOT} />}
                  {tail && <div className="prose-article text-ink" dangerouslySetInnerHTML={{ __html: tail }} />}
                  {ads && <AdSlot slot={ADSENSE_IN_ARTICLE_SLOT} />}
                </>
              );
            })()}
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
              <span key={t} className="rounded border border-line px-2 py-1 font-mono text-xs text-sub">
                {TOPIC_LABELS[t]}
              </span>
            ))}
          </div>
        )}
        {guide && <RelatedGuide guide={guide} />}
        <ShareButtons url={absoluteUrl(articleUrl(article))} title={article.title} />
        <TelegramCta />
        <PushOptIn />
        <SimilarArticles articles={similar} />
      {!article.archived && <ViewBeacon slug={article.slug} />}
      </article>
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <SectionHeading title="Ultimele știri" />
          <div className="mt-1">
            {latest
              .filter((a) => a.slug !== article.slug)
              .slice(0, 8)
              .map((a) => (
                <ArticleRow key={a.slug} article={a} variant="compact" />
              ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
