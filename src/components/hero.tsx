import Link from "next/link";
import { ArticleThumb } from "./article-thumb";
import { formatTimeAgo, sourcesLabel } from "@/lib/format-time-ago";
import { articleUrl } from "@/lib/content/url";
import { SECTION_LABELS, raionLabel, countryLabel } from "@/lib/content/geo";
import type { Article } from "@/lib/content/types";

// Știrea din prim-plan: pe desktop poza în stânga, titlul și rezumatul în
// dreapta (ca pe portalurile de știri); pe telefon una sub alta.
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
      className="group grid overflow-hidden rounded border border-line bg-white lg:grid-cols-[3fr_2fr]"
    >
      <ArticleThumb
        topics={article.topics}
        imageUrl={article.imageUrl}
        imageAlt={article.imageAlt}
        className="aspect-video w-full lg:aspect-auto lg:h-full lg:min-h-[360px]"
        iconSize={64}
        sizes="(max-width: 1024px) 100vw, 760px"
        priority
      />
      <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-8">
        <p className="font-mono text-xs uppercase tracking-wide text-amber-ink">
          în prim-plan · {SECTION_LABELS[article.section]}
          {locationLabel ? ` · ${locationLabel}` : ""}
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-ink group-hover:text-teal sm:text-4xl lg:text-[2.6rem]">
          {article.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink/80">{article.lead}</p>
        <p className="mt-3 font-mono text-xs text-sub">
          {formatTimeAgo(article.publishedAt)}
          {sourcesLabel(article.sourceCount)}
        </p>
      </div>
    </Link>
  );
}
