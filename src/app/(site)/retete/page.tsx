import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionHeading } from "@/components/section-heading";
import { COURSES, getRecipes, recipePath, type Course } from "@/lib/content/recipes";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Rețete moldovenești tradiționale",
  description: "Rețete moldovenești pas cu pas: ciorbe, sarmale, plăcinte, deserturi și conserve, cu ingrediente pe porții, timpi de gătire și variante pe regiuni.",
  alternates: { canonical: "/retete/" },
};

const minutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);

export default async function RecipesPage() {
  const recipes = await getRecipes();
  const byCourse = (Object.keys(COURSES) as Course[])
    .map((c) => ({ c, items: recipes.filter((r) => r.course === c) }))
    .filter((x) => x.items.length > 0);

  return (
    // „doar de post”: un checkbox și :has() — fără JavaScript
    <div className="group/list mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Bucătăria moldovenească", href: "/ghiduri/#bucatarie" }, { label: "Rețete" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Rețete moldovenești</h1>
      <p className="mt-3 max-w-2xl text-lg text-sub">
        Bucatele de acasă, pas cu pas: cantitățile se recalculează pe numărul de porții, cu sfaturi, greșeli de evitat și
        variantele din fiecare colț al Moldovei.
      </p>
      {byCourse.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-sub">Primele rețete apar în curând.</p>
      ) : (
        <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded border border-line bg-white px-3 py-1.5 font-mono text-sm text-ink hover:border-teal">
          <input id="doar-post" type="checkbox" className="h-4 w-4 accent-teal" />
          Doar de post
        </label>
      )}
      {byCourse.map(({ c, items }) => (
        <section
          key={c}
          id={c}
          className={`mt-10 scroll-mt-6 ${items.some((r) => r.fasting) ? "" : "group-has-[#doar-post:checked]/list:hidden"}`}
        >
          <SectionHeading title={COURSES[c].ro} />
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <li key={r.slug} className={r.fasting ? "" : "group-has-[#doar-post:checked]/list:hidden"}>
                <Link href={recipePath(r.slug)} className="group block overflow-hidden rounded border border-line bg-white">
                  <div className="relative aspect-[3/2] bg-line">
                    <Image src={r.image.url} alt={r.image.alt} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                    {r.fasting && (
                      <span className="absolute left-2 top-2 rounded bg-teal px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-white">De post</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-serif text-lg leading-snug text-ink group-hover:text-teal">{r.title}</h3>
                    <p className="mt-1 font-mono text-xs text-sub">
                      {minutes(r.prepMinutes + r.cookMinutes)} · {r.servings} porții
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
