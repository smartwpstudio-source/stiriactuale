import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { TopicLabel } from "./topic-label";
import { formatTimeAgo, sourcesLabel } from "@/lib/format-time-ago";
import { articleUrl } from "@/lib/content/url";
import type { Article } from "@/lib/content/types";

// Rând orizontal: poză mică + titlu. `compact` (fără poză, fără rezumat) pentru
// coloanele laterale "Ultimele știri".
export function ArticleRow({ article, compact = false }: { article: Article; compact?: boolean }) {
  if (compact) {
    return (
      <Link href={articleUrl(article)} className="group block border-b border-line py-3 last:border-b-0">
        <p className="font-mono text-xs text-sub">{formatTimeAgo(article.publishedAt)}</p>
        <h3 className="mt-1 font-serif text-[1.05rem] leading-snug text-ink group-hover:text-teal">{article.title}</h3>
      </Link>
    );
  }
  return (
    <Link href={articleUrl(article)} className="group flex gap-4 border-b border-line py-4 last:border-b-0">
      <ArticleThumb
        topics={article.topics}
        imageUrl={article.imageUrl}
        imageAlt={article.imageAlt}
        className="aspect-[4/3] w-28 shrink-0 rounded sm:w-40"
        iconSize={28}
        sizes="160px"
      />
      <div className="min-w-0">
        {article.topics[0] && <TopicLabel topic={article.topics[0]} />}
        <h3 className="mt-1 font-serif text-lg leading-snug text-ink group-hover:text-teal">{article.title}</h3>
        {article.lead && <p className="mt-1 line-clamp-2 hidden text-[0.95rem] text-sub sm:block">{article.lead}</p>}
        <p className="mt-1.5 font-mono text-xs text-sub">
          {formatTimeAgo(article.publishedAt)}
          {sourcesLabel(article.sourceCount)}
        </p>
      </div>
    </Link>
  );
}
