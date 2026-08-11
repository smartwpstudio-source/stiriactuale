import Link from "next/link";
import { Hero } from "@/components/hero";
import { ArticleCard } from "@/components/article-card";
import { getAllArticles, getArticlesBySection } from "@/lib/content/queries";
import { SECTION_LABELS } from "@/lib/content/geo";
import type { Section } from "@/lib/content/types";

const SECTIONS: Section[] = ["regiuni", "national", "international", "diaspora"];

export default function HomePage() {
  const all = getAllArticles();
  const hero = all[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Hero article={hero} />
      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const items = getArticlesBySection(section)
            .filter((a) => a.slug !== hero.slug)
            .slice(0, 3);
          if (items.length === 0) return null;

          return (
            <section key={section}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-xl text-ink">{SECTION_LABELS[section]}</h2>
                <Link href={`/${section}`} className="font-mono text-xs text-sub hover:text-amber">
                  vezi toate
                </Link>
              </div>
              <div className="mt-3 grid gap-3">
                {items.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
