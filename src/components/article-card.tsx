import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { TopicLabel } from "./topic-label";
import { formatTimeAgo, sourcesLabel } from "@/lib/format-time-ago";
import { articleUrl } from "@/lib/content/url";
import type { Article } from "@/lib/content/types";

// Card de grilă: poză 16:9, titlu mare, rezumat pe 2-3 rânduri. `size="lg"`
// pentru prima știre a unui bloc.
export function ArticleCard({ article, size = "md" }: { article: Article; size?: "sm" | "md" | "lg" }) {
  const lg = size === "lg";
  const sm = size === "sm"; // grila "Știri noi": 2 coloane pe telefon, fără rezumat
  return (
    <Link href={articleUrl(article)} className="group flex flex-col overflow-hidden rounded border border-line bg-white">
      <ArticleThumb
        topics={article.topics}
        imageUrl={article.imageUrl}
        video={!!article.videoUrl}
        imageAlt={article.imageAlt}
        className="aspect-video w-full"
        iconSize={lg ? 48 : 36}
        sizes={lg ? "(max-width: 1024px) 100vw, 640px" : "(max-width: 640px) 100vw, 400px"}
      />
      <div className={`flex flex-1 flex-col ${sm ? "p-3" : "p-4"}`}>
        {!sm && article.topics[0] && <TopicLabel topic={article.topics[0]} />}
        <h3
          className={`font-serif leading-snug text-ink group-hover:text-teal ${lg ? "mt-1.5 text-2xl sm:text-[1.75rem]" : sm ? "line-clamp-4 text-base sm:text-lg" : "mt-1.5 text-lg sm:text-xl"}`}
        >
          {article.title}
        </h3>
        {!sm && article.lead && (
          <p className={`mt-2 text-sub ${lg ? "line-clamp-3 text-base" : "line-clamp-2 text-[0.95rem]"}`}>{article.lead}</p>
        )}
        <p className="mt-auto pt-3 font-mono text-xs text-sub">
          {formatTimeAgo(article.publishedAt)}
          {sourcesLabel(article.sourceCount)}
        </p>
      </div>
    </Link>
  );
}
