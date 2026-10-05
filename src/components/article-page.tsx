import Link from "next/link";
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";
import { TopicLabel } from "./topic-label";
import { ArticleThumb } from "./article-thumb";
import { ShareButtons } from "./share-buttons";
import { TelegramCta } from "./telegram-cta";
import { PushOptIn } from "./push-opt-in";
import { SimilarArticles } from "./similar-articles";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { getArticleLink, getSimilarArticles, listArticles } from "@/lib/content/queries";
import { ArticleRow } from "./article-row";
import { SectionHeading } from "./section-heading";
import { ViewBeacon } from "./view-beacon";
import { TOPIC_LABELS } from "@/lib/content/topic-meta";
import { articleUrl } from "@/lib/content/url";
import { absoluteUrl } from "@/lib/seo";
import { AI_IMAGE_PREFIX } from "@/lib/pipeline/image";
import { sanitizeBody, splitAfterParagraph } from "@/lib/content/sanitize";
import { ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";
import { AdSlot } from "./ad-slot";
import { RelatedGuide } from "./related-guide";
import { RelatedCalculator } from "./related-calculator";
import { getRelatedCalculator } from "@/lib/content/related-calculator";
import { VideoEmbed } from "./video-embed";
import { TelegramVideo } from "./telegram-video";
import { PostEmbed } from "./post-embed";
import { KindBadge } from "./kind-badge";
import { getRelatedGuide } from "@/lib/content/related-guide";

import type { Article } from "@/lib/content/types";

// Pattern de pagină articol din sistem-design-ui.md secțiunea 5: breadcrumb,
// etichetă de subiect, H1 Fraunces, byline mono, imagine full-width, lead mai mare,
// corp cu subtitluri H2, tag-uri la final, bloc share + Telegram, articole
// similare. Lățime de citire limitată (~600px).
// Doar pozele puse de pipeline/admin (Blob "articole/") sunt ilustrative; pozele
// arhivei WordPress sunt de regulă fotografii reale ale evenimentului.
function imageLabel(url?: string, credit?: string): string | null {
  if (credit) return `Foto: ${credit}`;
  if (!url) return null;
  if (url.includes(`/${AI_IMAGE_PREFIX}`)) return "Imagine generată AI";
  return url.includes("/articole/") ? "Foto ilustrativă" : null;
}

// „canal/123” din adresa playerului Telegram (video.ts: t.me/canal/123?embed=1)
const telegramPost = (url?: string) => url?.match(/^https:[/][/]t[.]me[/]([A-Za-z0-9_]{4,}[/][0-9]+)/)?.[1];

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
  const [similar, { items: latest }, guide, previous, calculator] = await Promise.all([
    getSimilarArticles(article),
    listArticles({}, 1, 9),
    article.archived ? undefined : getRelatedGuide(article.title, article.lead, article.locality),
    article.continuesId ? getArticleLink(article.continuesId) : null,
    article.archived ? undefined : getRelatedCalculator(article.title, article.lead),
  ]);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
      {/* data-no-ads: AdSense nu se încarcă pe arhiva preluată (vezi adsense-script.tsx) */}
      <article className="min-w-0 max-w-[720px]" data-no-ads={article.archived || undefined}>
        <Breadcrumb items={breadcrumbItems} />
        {(article.topics[0] || article.kind === "pe-scurt" || article.kind === "analiza" || article.continuesId) && (
          <div className="mt-3 flex items-center gap-2">
            <KindBadge kind={article.kind} continues={!!article.continuesId} />
            {article.topics[0] && <TopicLabel topic={article.topics[0]} />}
          </div>
        )}
        <h1 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">
          {article.title}
        </h1>
        {previous && (
          <Link
            href={articleUrl({ ...previous, locality: previous.locality ?? undefined, country: previous.country ?? undefined })}
            className="mt-4 block rounded border-l-4 border-teal bg-white px-4 py-2 text-sm hover:bg-paper"
          >
            <span className="font-mono text-xs uppercase tracking-wide text-teal">Context · {formatTimeAgo(previous.publishedAt.toISOString())}</span>
            <span className="block text-ink">{previous.title}</span>
          </Link>
        )}
        <p className="mt-4 font-mono text-sm text-sub">
          {article.archived
            ? `arhivă · ${new Date(article.publishedAt).toLocaleDateString("ro-MD", ARCHIVE_DATE)}`
            : `echipă editorială · ${formatTimeAgo(article.publishedAt)}`}
          {article.sourceCount > 1 && ` · din ${article.sourceCount} surse`}
          {article.updatedAt &&
            ` · actualizat la ${new Date(article.updatedAt).toLocaleString("ro-MD", { timeZone: "Europe/Chisinau", hour: "2-digit", minute: "2-digit", day: "numeric", month: "long" })}`}
        </p>
        <ShareButtons url={absoluteUrl(articleUrl(article))} title={article.title} />
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
            {telegramPost(article.videoUrl) ? (
              // video Telegram: doar video-ul, primul, în playerul nostru
              <TelegramVideo post={telegramPost(article.videoUrl)!} channel={article.sources?.[0]?.name ?? "Telegram"}>
                {/* Telegram nu dă video-ul pe web (fișier mare): playerul lor oficial, cu tot cu text */}
                <VideoEmbed src={article.videoUrl!} title={article.title} />
              </TelegramVideo>
            ) : article.videoUrl ? (
              // video din sursă: playerul ia locul pozei, sus
              <VideoEmbed src={article.videoUrl} title={article.title} />
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
              {imageLabel(article.imageUrl, article.imageCredit) && (
                <p className="mt-1 font-mono text-xs text-sub">{imageLabel(article.imageUrl, article.imageCredit)}</p>
              )}
              </>
            )}
            <p className="mt-6 text-xl font-medium leading-relaxed text-ink">{article.lead}</p>
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
                  {article.postUrl && <PostEmbed src={article.postUrl} />}
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
        {calculator && <RelatedCalculator calc={calculator} />}
        {guide && <RelatedGuide guide={guide} />}
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
