import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmbedCode } from "@/components/calc/embed-code";
import { loadCalculator } from "@/components/calc/calculator-body";
import { CALCULATORS } from "@/lib/calculators";
import { SITE_URL } from "@/lib/seo";

// cursul BNM se schimbă zilnic; parametrii doar la deploy
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/calculatoare/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = CALCULATORS.find((x) => x.slug === slug);
  return c ? { title: `Calculator: ${c.title}`, description: c.description, alternates: { canonical: `/calculatoare/${c.slug}/` } } : {};
}

export default async function CalculatorPage({ params }: PageProps<"/calculatoare/[slug]">) {
  const { slug } = await params;
  const r = await loadCalculator(slug);
  if (!r) notFound();
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Calculatoare", href: "/calculatoare/" }, { label: r.calc.title }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{r.calc.title}</h1>
      <p className="mt-3 text-lg text-sub">{r.calc.description}</p>
      <div className="mt-6">{r.body}</div>
      {"guide" in r.calc && (
        <Link href={`/ghiduri/${r.calc.guide}/`} className="mt-6 block rounded border border-line bg-white p-4 text-ink hover:border-teal">
          <span className="block font-mono text-xs uppercase tracking-wide text-teal">Ghid complet</span>
          <span className="mt-1 block font-medium">Cine plătește, termene, scutiri și cum se achită →</span>
        </Link>
      )}
      {r.note && <p className="mt-6 text-sm text-sub">{r.note}</p>}
      {r.sources.length > 0 && (
        <p className="mt-2 text-sm text-sub">
          Surse:{" "}
          {r.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-ink">{s.name}</a>
            </span>
          ))}
        </p>
      )}
      <EmbedCode slug={slug} title={r.calc.title} siteUrl={SITE_URL} />
    </div>
  );
}
