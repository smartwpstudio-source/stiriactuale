import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { TopicLabel } from "./topic-label";
import { ImpactBadge } from "./impact-badge";
import { sourcesLabel } from "@/lib/format-time-ago";
import { TimeAgo } from "./time-ago";
import { articleUrl } from "@/lib/content/url";
import type { Article } from "@/lib/content/types";

// Rând orizontal de listă:
//  - "default": poză 160px + titlu + rezumat pe 2 rânduri (căutare, liste late);
//  - "small": poză 96px + titlu + dată, fără rezumat (blocurile de pe prima pagină);
//  - "compact": doar dată + titlu (coloanele laterale "Ultimele știri").
export function ArticleRow({
  article,
  variant = "default",
}: {
  article: Article;
  variant?: "default" | "small" | "compact";
}) {
  if (variant === "compact") {
    return (
      <Link href={articleUrl(article)} className="group block border-b border-line py-3 last:border-b-0">
        <p className="font-mono text-xs text-sub"><TimeAgo iso={article.publishedAt} /></p>
        <h3 className="mt-1 font-serif text-[1.05rem] leading-snug text-ink group-hover:text-teal">{article.title}</h3>
      </Link>
    );
  }
  const small = variant === "small";
  return (
    <Link href={articleUrl(article)} className="group flex items-start gap-4 border-b border-line py-3 last:border-b-0">
      {/* items-start + self-start: poza își păstrează forma, nu se întinde cât textul */}
      <ArticleThumb
        topics={article.topics}
        imageUrl={article.imageUrl}
        video={!!article.videoUrl}
        imageAlt={article.imageAlt}
        className={`aspect-[4/3] shrink-0 self-start rounded ${small ? "w-24" : "w-28 sm:w-40"}`}
        iconSize={small ? 20 : 28}
        sizes={small ? "96px" : "160px"}
      />
      <div className="min-w-0">
        <ImpactBadge impact={article.impact} className="mb-1" />
        {!small && article.topics[0] && <TopicLabel topic={article.topics[0]} />}
        <h3
          className={`font-serif leading-snug text-ink group-hover:text-teal ${small ? "line-clamp-3 text-base" : "mt-1 text-lg"}`}
        >
          {article.title}
        </h3>
        {!small && article.lead && <p className="mt-1 hidden text-[0.95rem] text-sub sm:line-clamp-2">{article.lead}</p>}
        <p className="mt-1.5 font-mono text-xs text-sub">
          <TimeAgo iso={article.publishedAt} />
          {!small && sourcesLabel(article.sourceCount)}
        </p>
      </div>
    </Link>
  );
}
