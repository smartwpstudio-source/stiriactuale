import { ArticleCard } from "./article-card";
import type { Article } from "@/lib/content/types";

export function SimilarArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="font-serif text-lg text-ink">Articole similare</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}
