import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { TopicLabel } from "./topic-label";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { articleUrl } from "@/lib/content/url";
import type { Article } from "@/lib/content/types";

// Listă de rânduri orizontale (thumb mic + conținut) — mai potrivit pentru scanare
// rapidă la volum mare decât un grid dens. Vezi sistem-design-ui.md secțiunea 5,
// "Pagină categorie".
export function ArticleRow({ article }: { article: Article }) {
  return (
    <Link
      href={articleUrl(article)}
      className="flex gap-4 border-b border-line py-4 first:pt-0 last:border-b-0"
    >
      <ArticleThumb topics={article.topics} className="h-16 w-16 shrink-0" iconSize={20} />
      <div>
        {article.topics[0] && <TopicLabel topic={article.topics[0]} />}
        <h3 className="mt-1 font-serif text-sm leading-snug text-ink">{article.title}</h3>
        <p className="mt-1 font-mono text-[11px] text-sub">
          {formatTimeAgo(article.publishedAt)} · raportat de {article.sourceCount} surse
        </p>
      </div>
    </Link>
  );
}
