import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { ShareButtons } from "@/components/share-buttons";
import { AdSlot } from "@/components/ad-slot";
import { PrintButton, RecipeIngredients, RecipeRating } from "@/components/recipe-client";
import { ADSENSE_IN_ARTICLE_SLOT } from "@/lib/adsense";
import { sanitizeBody } from "@/lib/content/sanitize";
import { getGuides } from "@/lib/content/guides";
import { getGuidesRu, localizeLinks, ruPath, ruSlugs } from "@/lib/content/guides-ru";
import { COURSES, DIFFICULTIES, getRecipes, recipePath, type Lang, type Recipe } from "@/lib/content/recipes";
import { absoluteUrl } from "@/lib/seo";
import { stepName } from "@/lib/recipe-rating";
import { getRecipeRating } from "@/lib/recipe-rating-db";

// Șablonul unei rețete, în română sau rusă (/retete/<slug>/, /ru/retete/<slug>/).
const T = {
  ro: {
    home: "Acasă",
    cuisine: "Bucătăria moldovenească",
    recipes: "Rețete",
    other: "Читать на русском",
    servings: "porții",
    servingsLabel: "Porții",
    prep: "Pregătire",
    cook: "Gătire",
    total: "Total",
    difficulty: "Dificultate",
    fasting: "De post",
    ingredients: "Ingrediente",
    less: "Mai puține porții",
    more: "Mai multe porții",
    method: "Mod de preparare",
    tips: "Sfaturi",
    mistakes: "Greșeli frecvente",
    variants: "Variante pe regiuni",
    story: "Povestea",
    occasions: "Se pregătește la",
    related: "Vezi și",
    sources: "Surse",
    print: "Printează",
    photo: "Foto",
    region: "Regiunea",
    h: "h",
    min: "min",
    cuisineName: "Moldovenească",
    rate: "Notează rețeta",
    star: "{n} din 5 stele",
    thanks: "Mulțumim!",
    rateError: "Nu s-a putut trimite nota. Încearcă mai târziu.",
    noRatings: "Încă nicio notă. Fii primul care o notează.",
    yours: "Nota ta: {n}",
  },
  ru: {
    home: "Главная",
    cuisine: "Молдавская кухня",
    recipes: "Рецепты",
    other: "Citește în română",
    servings: "порц.",
    servingsLabel: "Порции",
    prep: "Подготовка",
    cook: "Готовка",
    total: "Всего",
    difficulty: "Сложность",
    fasting: "Постное",
    ingredients: "Ингредиенты",
    less: "Меньше порций",
    more: "Больше порций",
    method: "Приготовление",
    tips: "Советы",
    mistakes: "Частые ошибки",
    variants: "Варианты по регионам",
    story: "История блюда",
    occasions: "Готовят на",
    related: "Смотрите также",
    sources: "Источники",
    print: "Распечатать",
    photo: "Фото",
    region: "Регион",
    h: "ч",
    min: "мин",
    cuisineName: "Молдавская",
    rate: "Оцените рецепт",
    star: "{n} из 5 звёзд",
    thanks: "Спасибо!",
    rateError: "Не удалось отправить оценку. Попробуйте позже.",
    noRatings: "Оценок пока нет. Будьте первым.",
    yours: "Ваша оценка: {n}",
  },
} as const;

const duration = (m: number, t: (typeof T)[Lang]) =>
  m >= 60 ? `${Math.floor(m / 60)} ${t.h}${m % 60 ? ` ${m % 60} ${t.min}` : ""}` : `${m} ${t.min}`;
const iso = (m: number) => `PT${m}M`;
const ingredientText = (i: Recipe["ingredients"][number]["items"][number]) =>
  [i.qty, i.unit, i.name].filter(Boolean).join(" ") + (i.note ? ` (${i.note})` : "");

export function recipeMetadata(r: Recipe, lang: Lang, hasOther: boolean): Metadata {
  const url = recipePath(r.slug, lang);
  const languages = hasOther ? { ro: recipePath(r.slug, "ro"), ru: recipePath(r.slug, "ru") } : undefined;
  return {
    title: r.title,
    description: r.description,
    alternates: { canonical: url, ...(languages && { languages }) },
    openGraph: {
      title: r.title,
      description: r.description,
      type: "article",
      url,
      ...(lang === "ru" && { locale: "ru_MD" }),
      images: [{ url: r.image.url, alt: r.image.alt }],
    },
  };
}

// slug de ghid sau de rețetă → link și titlu în limba paginii
async function linkResolver(lang: Lang) {
  const [guides, recipes] = await Promise.all([lang === "ru" ? getGuidesRu() : getGuides(), getRecipes(lang)]);
  const roGuides = lang === "ru" ? await getGuides() : guides;
  return (slug: string): { href: string; title: string } | undefined => {
    const rec = recipes.find((x) => x.slug === slug);
    if (rec) return { href: recipePath(slug, lang), title: rec.title };
    const g = guides.find((x) => x.slug === slug);
    if (g) return { href: lang === "ru" ? ruPath(slug) : `/ghiduri/${slug}/`, title: g.title };
    const ro = roGuides.find((x) => x.slug === slug); // ghid fără traducere: varianta românească
    return ro && { href: `/ghiduri/${slug}/`, title: ro.title };
  };
}

function LinkList({ title, items }: { title: string; items: { href: string; title: string }[] }) {
  if (!items.length) return null;
  return (
    <nav aria-label={title}>
      <h2 className="font-mono text-xs uppercase tracking-wide text-sub">{title}</h2>
      <ul className="mt-2 space-y-2">
        {items.map((x) => (
          <li key={x.href}>
            <Link prefetch={false} href={x.href} className="font-serif text-lg leading-snug text-ink hover:text-teal">
              {x.title} →
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export async function RecipePage({ r, lang, hasOther }: { r: Recipe; lang: Lang; hasOther: boolean }) {
  const t = T[lang];
  const url = absoluteUrl(recipePath(r.slug, lang));
  const total = r.prepMinutes + r.cookMinutes;
  const [resolve, rating] = await Promise.all([linkResolver(lang), getRecipeRating(r.slug)]);
  const occasions = (r.occasions ?? []).map(resolve).filter((x) => x !== undefined);
  const related = (r.related ?? []).map(resolve).filter((x) => x !== undefined);
  let story = r.storyHtml ? sanitizeBody(r.storyHtml) : "";
  if (story && lang === "ru") {
    const ruRecipes = new Set((await getRecipes("ru")).map((x) => x.slug));
    story = localizeLinks(story, await ruSlugs()).replace(/href="\/retete\/([a-z0-9-]+)\/"/g, (m, s: string) =>
      ruRecipes.has(s) ? `href="${recipePath(s, "ru")}"` : m,
    );
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: r.title,
      description: r.description,
      image: [r.image.url],
      inLanguage: lang,
      dateModified: r.updated,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "Știri Actuale", url: absoluteUrl("/") },
      publisher: { "@type": "Organization", name: "Știri Actuale", logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png?v=2") } },
      recipeYield: `${r.servings} ${t.servings}`,
      prepTime: iso(r.prepMinutes),
      cookTime: iso(r.cookMinutes),
      totalTime: iso(total),
      recipeCategory: COURSES[r.course][lang],
      recipeCuisine: t.cuisineName,
      keywords: [t.cuisine, COURSES[r.course][lang], r.region, r.fasting ? t.fasting : undefined].filter(Boolean).join(", "),
      recipeIngredient: r.ingredients.flatMap((g) => g.items.map(ingredientText)),
      recipeInstructions: r.steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name ?? stepName(s.text),
        text: s.text,
        url: `${url}#pas-${i + 1}`,
      })),
      citation: r.sources.map((s) => ({ "@type": "CreativeWork", name: s.name, url: s.url })),
      // doar note reale ale cititorilor; fără nicio notă, fără aggregateRating
      ...(rating && {
        aggregateRating: { "@type": "AggregateRating", ratingValue: rating.value, ratingCount: rating.count, bestRating: 5, worstRating: 1 },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: t.home, item: absoluteUrl("/") },
        { name: t.recipes, item: absoluteUrl(lang === "ro" ? "/retete/" : "/ru/retete/") },
        { name: r.title, item: url },
      ].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })),
    },
  ];

  const facts: [string, string][] = [
    [t.servingsLabel, String(r.servings)],
    [t.prep, duration(r.prepMinutes, t)],
    [t.cook, duration(r.cookMinutes, t)],
    [t.total, duration(total, t)],
    [t.difficulty, DIFFICULTIES[r.difficulty][lang]],
  ];
  const box = "mt-8 rounded border border-line bg-white p-4 sm:p-5";

  return (
    <article id="recipe" lang={lang} className="mx-auto w-full max-w-[760px] px-4 py-8">
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
      <div className="print:hidden">
        <Breadcrumb
          items={
            lang === "ro"
              ? [{ label: t.home, href: "/" }, { label: t.cuisine, href: "/ghiduri/#bucatarie" }, { label: t.recipes, href: "/retete/" }]
              : [{ label: "Știri Actuale", href: "/" }, { label: t.cuisine, href: "/ru/ghiduri/#bucatarie" }, { label: t.recipes, href: "/ru/retete/" }]
          }
        />
      </div>
      <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">{r.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/90">{r.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-sm text-sub">
        {r.fasting && <span className="rounded bg-teal px-2 py-0.5 text-xs uppercase tracking-wide text-white">{t.fasting}</span>}
        {r.region && <span>{r.region}</span>}
        {hasOther && (
          <Link prefetch={false} href={recipePath(r.slug, lang === "ro" ? "ru" : "ro")} lang={lang === "ro" ? "ru" : "ro"} className="text-teal underline print:hidden">
            {t.other}
          </Link>
        )}
      </div>

      <figure className="mt-5 print:hidden">
        <div className="relative aspect-[3/2] overflow-hidden rounded bg-line">
          <Image src={r.image.url} alt={r.image.alt} fill sizes="(min-width: 760px) 728px, 100vw" loading="eager" fetchPriority="high" className="object-cover" />
        </div>
        <figcaption className="mt-1.5 font-mono text-xs text-sub">
          {r.image.alt}. {t.photo}: {r.image.credit}
        </figcaption>
      </figure>

      <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-5">
        {facts.map(([k, v]) => (
          <div key={k} className="bg-white px-3 py-2.5 last:col-span-2 sm:last:col-span-1">
            <dt className="font-mono text-[11px] uppercase tracking-wide text-sub">{k}</dt>
            <dd className="mt-0.5 font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
        <PrintButton label={t.print} />
      </div>
      <div className="print:hidden">
        <ShareButtons url={url} title={r.title} />
      </div>

      <RecipeIngredients
        slug={r.slug}
        servings={r.servings}
        groups={r.ingredients}
        labels={{ ingredients: t.ingredients, servings: t.servings, less: t.less, more: t.more }}
      />

      <section className="mt-10" aria-labelledby="preparare">
        <h2 id="preparare" className="border-t-2 border-ink pt-2 font-serif text-2xl text-ink">{t.method}</h2>
        <ol className="mt-4 space-y-5">
          {r.steps.map((s, i) => (
            <li key={i} id={`pas-${i + 1}`} className="flex scroll-mt-6 gap-4 break-inside-avoid">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm text-paper print:border print:border-ink print:bg-transparent print:text-ink">
                {i + 1}
              </span>
              <div className="pt-1 leading-relaxed text-ink">
                {s.text}
                {s.minutes ? <span className="ml-2 whitespace-nowrap font-mono text-xs text-sub">~{duration(s.minutes, t)}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {r.tips && r.tips.length > 0 && (
        <section className={`${box} border-t-4 border-t-teal`}>
          <h2 className="font-serif text-xl text-ink">{t.tips}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink/90">
            {r.tips.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>
      )}
      {r.mistakes && r.mistakes.length > 0 && (
        <section className={`${box} border-t-4 border-t-amber`}>
          <h2 className="font-serif text-xl text-ink">{t.mistakes}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink/90">
            {r.mistakes.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>
      )}
      {r.variants && r.variants.length > 0 && (
        <section className={box}>
          <h2 className="font-serif text-xl text-ink">{t.variants}</h2>
          <dl className="mt-2 space-y-2.5">
            {r.variants.map((v, i) => (
              <div key={i}>
                <dt className="font-mono text-xs uppercase tracking-wide text-amber-ink">{v.region}</dt>
                <dd className="mt-0.5 text-ink/90">{v.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <RecipeRating
        slug={r.slug}
        lang={lang}
        initial={rating}
        labels={{ title: t.rate, star: t.star, thanks: t.thanks, error: t.rateError, none: t.noRatings, yours: t.yours }}
      />

      {ADSENSE_IN_ARTICLE_SLOT && (
        <div className="print:hidden">
          <AdSlot slot={ADSENSE_IN_ARTICLE_SLOT} />
        </div>
      )}

      {story && (
        <section className="mt-10 print:hidden">
          <h2 className="border-t-2 border-ink pt-2 font-serif text-2xl text-ink">{t.story}</h2>
          <div className="prose-article mt-2 text-ink" dangerouslySetInnerHTML={{ __html: story }} />
        </section>
      )}

      {(occasions.length > 0 || related.length > 0) && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 print:hidden">
          <LinkList title={t.occasions} items={occasions} />
          <LinkList title={t.related} items={related} />
        </div>
      )}

      <aside className="mt-8 rounded border border-line bg-white p-4 text-sm text-sub print:border-0 print:p-0">
        {t.sources}:{" "}
        {r.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ", "}
            <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-ink">
              {s.name}
            </a>
          </span>
        ))}
        <span className="hidden print:block">{url}</span>
      </aside>
    </article>
  );
}
