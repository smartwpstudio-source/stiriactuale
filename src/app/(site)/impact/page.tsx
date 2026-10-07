import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArticleRow } from "@/components/article-row";
import { listArticles } from "@/lib/content/queries";
import { IMPACT_TYPES, type ImpactType } from "@/lib/impact-types";

export const metadata: Metadata = {
  title: "Ce te afectează: prețuri, taxe, reguli noi și alerte",
  description: "Știrile care schimbă ceva pentru tine — prețuri, tarife, pensii, reguli și termene noi, alerte — cu ce faci acum și calculatorul sau ghidul potrivit.",
  alternates: { canonical: "/impact/" },
};

export default async function ImpactPage({ searchParams }: PageProps<"/impact">) {
  const raw = (await searchParams).tip;
  const tip = typeof raw === "string" && raw in IMPACT_TYPES ? (raw as ImpactType) : undefined;
  const { items } = await listArticles({ impact: tip ?? true }, 1, 40);
  const chip = (href: string, label: string, on: boolean) => (
    <Link key={href} href={href} className={`rounded-full border px-3 py-1 text-sm ${on ? "border-teal bg-teal text-white" : "border-line bg-white text-ink hover:border-teal"}`}>
      {label}
    </Link>
  );
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Ce te afectează" }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Ce te afectează acum</h1>
      <p className="mt-3 text-lg text-sub">
        Știrile care schimbă ceva pentru tine: cine e afectat, ce se schimbă, ce faci acum — și calculatorul sau ghidul potrivit.
      </p>
      <nav className="mt-5 flex flex-wrap gap-2">
        {chip("/impact/", "Toate", !tip)}
        {Object.entries(IMPACT_TYPES).map(([k, v]) => chip(`/impact/?tip=${k}`, v, tip === k))}
      </nav>
      <div className="mt-4">
        {items.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
        {items.length === 0 && <p className="mt-6 text-sub">Deocamdată nimic aici.</p>}
      </div>
    </div>
  );
}
