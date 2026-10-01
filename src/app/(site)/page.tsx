import { Hero } from "@/components/hero";
import { ArticleCard } from "@/components/article-card";
import { ArticleRow } from "@/components/article-row";
import { SectionHeading } from "@/components/section-heading";
import { PushOptIn } from "@/components/push-opt-in";
import { getHeroArticle, getMostRead, listArticles } from "@/lib/content/queries";
import { SECTION_LABELS } from "@/lib/content/geo";
import type { Section } from "@/lib/content/types";

// Randare ISR, revalidată la un minut — conținutul vine din pipeline.
export const revalidate = 60;

const SECTIONS: Section[] = ["regiuni", "national", "international", "diaspora"];

export default async function HomePage() {
  const hero = await getHeroArticle();

  if (!hero) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center">
        <p className="font-mono text-sm text-sub">Niciun articol publicat încă.</p>
      </div>
    );
  }

  const [{ items: latestAll }, mostRead] = await Promise.all([listArticles({}, 1, 16), getMostRead(5)]);
  const latest = latestAll.filter((a) => a.slug !== hero.slug);
  const sidebar = latest.slice(0, 7);
  const grid = latest.slice(7, 15);
  const shown = new Set([hero.slug, ...sidebar.map((a) => a.slug), ...grid.map((a) => a.slug)]);

  const sections = await Promise.all(
    SECTIONS.map(async (section) => ({
      section,
      items: (await listArticles({ section }, 1, 12)).items.filter((a) => !shown.has(a.slug)).slice(0, 4),
    })),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Hero article={hero} />
        </div>
        <aside>
          <SectionHeading title="Ultimele știri" />
          <div className="mt-1">
            {sidebar.map((a) => (
              <ArticleRow key={a.slug} article={a} compact />
            ))}
          </div>
        </aside>
      </div>

      <PushOptIn />

      {mostRead.length >= 3 && (
        <section className="mt-10">
          <SectionHeading title="Cele mai citite" />
          <ol className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
            {mostRead.map((a, i) => (
              <li key={a.slug} className="flex gap-3">
                <span className="font-serif text-4xl leading-none text-amber-ink">{i + 1}</span>
                <ArticleRow article={a} compact />
              </li>
            ))}
          </ol>
        </section>
      )}

      {grid.length > 0 && (
        <section className="mt-10">
          <SectionHeading title="Mai multe știri" />
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {grid.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 grid gap-x-10 gap-y-12 lg:grid-cols-2">
        {sections.map(({ section, items }) =>
          items.length === 0 ? null : (
            <section key={section}>
              <SectionHeading title={SECTION_LABELS[section]} href={`/${section}/`} />
              <div className="mt-4">
                <ArticleCard article={items[0]} size="lg" />
              </div>
              <div className="mt-2">
                {items.slice(1).map((a) => (
                  <ArticleRow key={a.slug} article={a} />
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </div>
  );
}
