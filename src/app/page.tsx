import Link from "next/link";
import { Hero } from "@/components/hero";
import { ArticleCard } from "@/components/article-card";
import { getAllArticles, getArticlesBySection } from "@/lib/content/queries";
import { SECTION_LABELS } from "@/lib/content/geo";
import type { Section } from "@/lib/content/types";

// Randare dinamică, revalidată frecvent — conținutul vine din pipeline-ul AI
// (rulează la fiecare ~2h, promovat manual din draft), nu mai e o listă
// fixă cunoscută la build time. Vezi arhitectura-site-nou-taxonomie-pwa-seo.md
// secțiunea 2 ("randare hibridă SSG/ISR").
export const revalidate = 60;

const SECTIONS: Section[] = ["regiuni", "national", "international", "diaspora"];

export default async function HomePage() {
  const all = await getAllArticles();

  if (all.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center">
        <p className="font-mono text-sm text-sub">Niciun articol publicat încă.</p>
      </div>
    );
  }

  const hero = all[0];

  const sections = await Promise.all(
    SECTIONS.map(async (section) => {
      const items = (await getArticlesBySection(section))
        .filter((a) => a.slug !== hero.slug)
        .slice(0, 3);
      return { section, items };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Hero article={hero} />
      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        {sections.map(({ section, items }) => {
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
