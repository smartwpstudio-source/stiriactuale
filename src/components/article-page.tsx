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
import type { Article } from "@/lib/content/types";

// Pattern de pagină articol din sistem-design-ui.md secțiunea 5: breadcrumb,
// etichetă de subiect, H1 Fraunces, byline mono, imagine full-width, lead mai mare,
// corp cu subtitluri H2, tag-uri la final, bloc share + Telegram, articole
// similare. Lățime de citire limitată (~600px).
export async function ArticlePage({
  article,
  breadcrumbItems,
}: {
  article: Article;
  breadcrumbItems: BreadcrumbItem[];
}) {
  const similar = await getSimilarArticles(article);

  return (
    <article className="mx-auto w-full max-w-[600px] px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      {article.topics[0] && (
        <div className="mt-3">
          <TopicLabel topic={article.topics[0]} />
        </div>
      )}
      <h1 className="mt-2 font-serif text-3xl leading-tight text-ink">{article.title}</h1>
      <p className="mt-3 font-mono text-[11px] text-sub">
        echipă editorială · {formatTimeAgo(article.publishedAt)} · raportat de{" "}
        {article.sourceCount} surse
      </p>
      <ArticleThumb
        topics={article.topics}
        imageUrl={article.imageUrl}
        imageAlt={article.imageAlt}
        className="mt-6 h-64 w-full"
        iconSize={48}
      />
      <p className="mt-6 text-lg leading-relaxed text-ink">{article.lead}</p>
      <div
        className="prose-article mt-4 text-ink"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />
      {article.topics.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-4">
          {article.topics.map((t) => (
            <span
              key={t}
              className="rounded border border-line px-2 py-1 font-mono text-[11px] text-sub"
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
