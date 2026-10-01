import Link from "next/link";
import { Hero } from "@/components/hero";
import { ArticleCard } from "@/components/article-card";
import { SectionHeading } from "@/components/section-heading";
import { PushOptIn } from "@/components/push-opt-in";
import { NewsFeed } from "@/components/news-feed";
import { CurrencyBox } from "@/components/currency-box";
import { getHeroArticle, getMostRead, listArticles } from "@/lib/content/queries";
import { articleUrl } from "@/lib/content/url";

// Randare ISR, revalidată la un minut — conținutul vine din pipeline.
export const revalidate = 60;

// Structura de portal: știrea principală, grila "Știri noi", apoi lenta
// "Ultima oră" care se derulează la nesfârșit (oamenii derulează, nu caută în
// blocuri pe secțiuni). Pe desktop, alături: Cele mai citite + cursul BNM.
export default async function HomePage() {
  const hero = await getHeroArticle();

  if (!hero) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center">
        <p className="font-mono text-sm text-sub">Niciun articol publicat încă.</p>
      </div>
    );
  }

  const [{ items: latest }, { items: feedFirst, pages }, mostRead] = await Promise.all([
    listArticles({}, 1, 9),
    listArticles({}, 1, 20),
    getMostRead(6),
  ]);
  const fresh = latest.filter((a) => a.slug !== hero.slug).slice(0, 8);
  const exclude = [hero.slug, ...fresh.map((a) => a.slug)];
  const feed = feedFirst.filter((a) => !exclude.includes(a.slug));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <Hero article={hero} />

      <section className="mt-8">
        <SectionHeading title="Știri noi" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {fresh.map((a) => (
            <ArticleCard key={a.slug} article={a} size="sm" />
          ))}
        </div>
      </section>

      <PushOptIn />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <SectionHeading title="Știri actuale" />
          <div className="mt-2">
            <NewsFeed
              initial={feed}
              exclude={exclude}
              hasMore={pages > 1}
              today={new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" })}
            />
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            {mostRead.length >= 3 && (
              <section>
                <SectionHeading title="Cele mai citite" />
                <ol className="mt-2">
                  {mostRead.map((a, i) => (
                    <li key={a.slug} className="flex gap-3 border-b border-line py-3 last:border-b-0">
                      <span className="font-serif text-3xl leading-none text-amber-ink">{i + 1}</span>
                      <Link href={articleUrl(a)} className="font-serif text-[1.05rem] leading-snug text-ink hover:text-teal">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <CurrencyBox />
          </div>
        </aside>
      </div>
    </div>
  );
}
