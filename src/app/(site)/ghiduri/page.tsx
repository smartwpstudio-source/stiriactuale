import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionHeading } from "@/components/section-heading";
import { GUIDE_CATEGORIES, getGuides, type GuideCategory } from "@/lib/content/guides";

export const metadata: Metadata = {
  title: "Ghiduri practice",
  description: "Ghiduri pas cu pas pentru moldovenii de acasă și din diaspora: acte, pensii, ajutoare, sănătate, auto.",
  alternates: { canonical: "/ghiduri/" },
};

export default async function GuidesPage() {
  const guides = await getGuides();
  const byCategory = (Object.keys(GUIDE_CATEGORIES) as GuideCategory[])
    .map((c) => ({ c, items: guides.filter((g) => g.category === c) }))
    .filter((x) => x.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Ghiduri" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Ghiduri practice</h1>
      <p className="mt-3 max-w-2xl text-lg text-sub">
        Pași clari pentru acte, pensii, ajutoare și alte situații de zi cu zi — acasă și în diaspora. Verificate pe
        sursele oficiale, cu data ultimei actualizări.
      </p>
      {byCategory.length === 0 && <p className="mt-8 font-mono text-sm text-sub">Primele ghiduri apar în curând.</p>}
      {/* teme: salt direct la secțiune — ghidurile sunt multe */}
      <ul className="mt-6 flex flex-wrap gap-2">
        {byCategory.map(({ c, items }) => (
          <li key={c}>
            <a
              href={`#${c}`}
              className="block rounded border border-line bg-white px-3 py-1.5 font-mono text-xs text-ink hover:border-amber hover:text-amber-ink"
            >
              {GUIDE_CATEGORIES[c]} <span className="text-sub">({items.length})</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-x-10 gap-y-12 lg:grid-cols-2">
        {byCategory.map(({ c, items }) => (
          <section key={c} id={c} className="scroll-mt-6">
            <SectionHeading title={GUIDE_CATEGORIES[c]} />
            <ul className="mt-2">
              {items.map((g) => (
                <li key={g.slug} className="border-b border-line py-3 last:border-b-0">
                  <Link href={`/ghiduri/${g.slug}/`} className="group block">
                    <h3 className="font-serif text-lg leading-snug text-ink group-hover:text-teal">{g.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[0.95rem] text-sub">{g.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
