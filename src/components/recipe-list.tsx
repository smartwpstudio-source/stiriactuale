import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionHeading } from "@/components/section-heading";
import { COURSES, getRecipes, recipePath, type Course, type Lang } from "@/lib/content/recipes";

// Cuprinsul rețetelor, în română sau rusă (/retete/, /ru/retete/).
const T = {
  ro: {
    title: "Rețete moldovenești tradiționale",
    h1: "Rețete moldovenești",
    description:
      "Rețete moldovenești pas cu pas: ciorbe, sarmale, plăcinte, deserturi și conserve, cu ingrediente pe porții, timpi de gătire și variante pe regiuni.",
    intro:
      "Bucatele de acasă, pas cu pas: cantitățile se recalculează pe numărul de porții, cu sfaturi, greșeli de evitat și variantele din fiecare colț al Moldovei.",
    crumbs: [{ label: "Acasă", href: "/" }, { label: "Bucătăria moldovenească", href: "/ghiduri/#bucatarie" }, { label: "Rețete" }],
    empty: "Primele rețete apar în curând.",
    fastingOnly: "Doar de post",
    fasting: "De post",
    servings: "porții",
    other: "Рецепты на русском",
    h: "h",
    min: "min",
  },
  ru: {
    title: "Традиционные молдавские рецепты",
    h1: "Молдавские рецепты",
    description:
      "Молдавские рецепты пошагово: чорбы, сарма, плацинды, десерты и заготовки — ингредиенты на любое число порций, время готовки и региональные варианты.",
    intro:
      "Домашние блюда пошагово: количество продуктов пересчитывается на нужное число порций, с советами, частыми ошибками и вариантами из разных уголков Молдовы.",
    crumbs: [{ label: "Știri Actuale", href: "/" }, { label: "Молдавская кухня", href: "/ru/ghiduri/#bucatarie" }, { label: "Рецепты" }],
    empty: "Первые рецепты скоро появятся.",
    fastingOnly: "Только постные",
    fasting: "Постное",
    servings: "порц.",
    other: "Rețete în română",
    h: "ч",
    min: "мин",
  },
} as const;

const LIST_PATH = { ro: "/retete/", ru: "/ru/retete/" } as const;

export function recipeListMetadata(lang: Lang): Metadata {
  const t = T[lang];
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: LIST_PATH[lang], languages: { ro: LIST_PATH.ro, ru: LIST_PATH.ru } },
    ...(lang === "ru" && { openGraph: { title: t.title, description: t.description, url: LIST_PATH.ru, locale: "ru_MD" } }),
  };
}

export async function RecipeList({ lang }: { lang: Lang }) {
  const t = T[lang];
  const minutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} ${t.h}${m % 60 ? ` ${m % 60} ${t.min}` : ""}` : `${m} ${t.min}`);
  const recipes = await getRecipes(lang);
  const byCourse = (Object.keys(COURSES) as Course[])
    .map((c) => ({ c, items: recipes.filter((r) => r.course === c) }))
    .filter((x) => x.items.length > 0);
  const other = lang === "ro" ? "ru" : "ro";

  return (
    // „doar de post”: un checkbox și :has() — fără JavaScript
    <div lang={lang} className="group/list mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[...t.crumbs]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{t.h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-sub">{t.intro}</p>
      <p className="mt-2 font-mono text-sm">
        <Link prefetch={false} href={LIST_PATH[other]} lang={other} className="text-teal underline hover:text-amber-ink">
          {t.other}
        </Link>
      </p>
      {byCourse.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-sub">{t.empty}</p>
      ) : (
        <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded border border-line bg-white px-3 py-1.5 font-mono text-sm text-ink hover:border-teal">
          <input id="doar-post" type="checkbox" className="h-4 w-4 accent-teal" />
          {t.fastingOnly}
        </label>
      )}
      {byCourse.map(({ c, items }) => (
        <section
          key={c}
          id={c}
          className={`mt-10 scroll-mt-6 ${items.some((r) => r.fasting) ? "" : "group-has-[#doar-post:checked]/list:hidden"}`}
        >
          <SectionHeading title={COURSES[c][lang]} />
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <li key={r.slug} className={r.fasting ? "" : "group-has-[#doar-post:checked]/list:hidden"}>
                <Link prefetch={false} href={recipePath(r.slug, lang)} className="group block overflow-hidden rounded border border-line bg-white">
                  <div className="relative aspect-[3/2] bg-line">
                    <Image src={r.image.url} alt={r.image.alt} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                    {r.fasting && (
                      <span className="absolute left-2 top-2 rounded bg-teal px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-white">{t.fasting}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-serif text-lg leading-snug text-ink group-hover:text-teal">{r.title}</h3>
                    <p className="mt-1 font-mono text-xs text-sub">
                      {minutes(r.prepMinutes + r.cookMinutes)} · {r.servings} {t.servings}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
