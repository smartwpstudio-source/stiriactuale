import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { formatTimeAgo, sourcesLabel } from "@/lib/format-time-ago";
import { articleUrl } from "@/lib/content/url";
import { SECTION_LABELS, raionLabel, countryLabel } from "@/lib/content/geo";
import type { Article } from "@/lib/content/types";

export function Hero({ article }: { article: Article }) {
  const locationLabel =
    article.section === "regiuni"
      ? raionLabel(article.locality!)
      : article.section === "diaspora"
        ? countryLabel(article.country!)
        : null;

  return (
    <Link
      href={articleUrl(article)}
      className="grid gap-6 border border-line bg-white p-4 sm:grid-cols-[1.2fr_1fr] sm:p-6"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-amber-ink">
          în prim-plan
        </p>
        <h1 className="mt-2 font-serif text-2xl italic leading-tight text-ink sm:text-3xl">
          {article.title}
        </h1>
        <p className="mt-3 font-mono text-xs text-sub">
          {SECTION_LABELS[article.section]}
          {locationLabel ? ` · ${locationLabel}` : ""} · {formatTimeAgo(article.publishedAt)}
          {sourcesLabel(article.sourceCount)}
        </p>
      </div>
      <ArticleThumb
        topics={article.topics}
        imageUrl={article.imageUrl}
        imageAlt={article.imageAlt}
        className="h-40 w-full sm:h-full"
        iconSize={40}
      />
    </Link>
  );
}
