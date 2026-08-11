import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { TopicLabel } from "./topic-label";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { articleUrl } from "@/lib/content/url";
import type { Article } from "@/lib/content/types";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={articleUrl(article)} className="block border border-line bg-white">
      <ArticleThumb
        topics={article.topics}
        imageUrl={article.imageUrl}
        imageAlt={article.imageAlt}
        className="h-32 w-full"
        iconSize={28}
      />
      <div className="p-3">
        {article.topics[0] && <TopicLabel topic={article.topics[0]} />}
        <h3 className="mt-1 font-serif text-base leading-snug text-ink">{article.title}</h3>
        <p className="mt-2 font-mono text-[11px] text-sub">
          {formatTimeAgo(article.publishedAt)} · raportat de {article.sourceCount} surse
        </p>
      </div>
    </Link>
  );
}
