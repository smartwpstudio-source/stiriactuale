import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionHeading } from "@/components/section-heading";
import { GUIDE_CATEGORIES, GUIDE_CATEGORIES_RU, type GuideCategory } from "@/lib/content/guides";
import { getGuidesRu, ruPath } from "@/lib/content/guides-ru";

// Cuprinsul ghidurilor în rusă, pe aceleași categorii ca /ghiduri/
const TITLE = "Справочники: практические инструкции";
const DESCRIPTION =
  "Пошаговые справочники для жителей Молдовы и диаспоры на русском языке: документы, пенсии, пособия, здоровье, авто, работа и многое другое.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ru/ghiduri/", languages: { ro: "/ghiduri/", ru: "/ru/ghiduri/" } },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/ru/ghiduri/", locale: "ru_MD" },
};

export default async function RuGuidesPage() {
  // copie: lista din cache e partajată între pagini
  const guides = [...(await getGuidesRu())].sort((a, b) => a.title.localeCompare(b.title, "ru"));
  const byCategory = (Object.keys(GUIDE_CATEGORIES) as GuideCategory[])
    .map((c) => ({ c, items: guides.filter((g) => g.category === c) }))
    .filter((x) => x.items.length > 0);

  return (
    <div lang="ru" className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[{ label: "Știri Actuale", href: "/" }, { label: "Справочники" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Справочники</h1>
      <p className="mt-3 max-w-2xl text-lg text-sub">
        Понятные шаги для документов, пенсий, пособий и других житейских ситуаций — дома и в диаспоре. Проверено по
        официальным источникам, с датой последнего обновления.
      </p>
      <p className="mt-2 font-mono text-sm">
        <Link href="/ghiduri/" lang="ro" className="text-teal underline hover:text-amber-ink">
          Ghiduri în română
        </Link>
      </p>
      {byCategory.length === 0 && <p className="mt-8 font-mono text-sm text-sub">Первые справочники скоро появятся.</p>}
      <ul className="mt-6 flex flex-wrap gap-2">
        {byCategory.map(({ c, items }) => (
          <li key={c}>
            <a
              href={`#${c}`}
              className="block rounded border border-line bg-white px-3 py-1.5 font-mono text-xs text-ink hover:border-amber hover:text-amber-ink"
            >
              {GUIDE_CATEGORIES_RU[c]} <span className="text-sub">({items.length})</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-x-10 gap-y-12 lg:grid-cols-2">
        {byCategory.map(({ c, items }) => (
          <section key={c} id={c} className="scroll-mt-6">
            <SectionHeading title={GUIDE_CATEGORIES_RU[c]} />
            <ul className="mt-2">
              {items.map((g) => (
                <li key={g.slug} className="border-b border-line py-3 last:border-b-0">
                  <Link href={ruPath(g.slug)} className="group block">
                    <h3 className="font-serif text-lg leading-snug text-ink group-hover:text-teal">{g.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[0.95rem] text-sub">{g.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
            {c === "bucatarie" && (
              <Link href="/ru/retete/" className="mt-2 inline-block font-mono text-sm text-teal hover:text-amber-ink">
                Молдавские рецепты пошагово →
              </Link>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
