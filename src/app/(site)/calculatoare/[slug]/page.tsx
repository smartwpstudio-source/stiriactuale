import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { CurrencyConverter } from "@/components/calc/currency";
import { MaternityCalculator } from "@/components/calc/maternity";
import { SalaryCalculator } from "@/components/calc/salary";
import { SickPayCalculator } from "@/components/calc/sick-pay";
import { getBnmRates } from "@/lib/bnm";
import { CALCULATORS, availableCalculators } from "@/lib/calculators";
import { getCalcParams } from "@/lib/calculators-data";

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
  const p = await getCalcParams();
  const c = availableCalculators(p).find((x) => x.slug === slug);
  if (!c) notFound();

  let body: React.ReactNode = null;
  let sources: { name: string; url: string }[] = [];
  if (slug === "convertor-valutar") {
    const bnm = await getBnmRates();
    if (!bnm) return <Shell title={c.title}><p className="text-sub">Cursul BNM nu e disponibil acum. Revino peste câteva minute.</p></Shell>;
    body = <CurrencyConverter rates={bnm.rates} />;
    sources = [{ name: `Banca Națională a Moldovei — curs oficial din ${bnm.date}`, url: "https://www.bnm.md/ro/content/ratele-de-schimb" }];
  } else if (slug === "salariu-net" && p?.salariu) {
    body = <SalaryCalculator p={p.salariu} />;
    sources = p.salariu.surse;
  } else if (slug === "concediu-medical" && p?.concediu_medical) {
    body = <SickPayCalculator p={p.concediu_medical} />;
    sources = p.concediu_medical.surse;
  } else if (slug === "concediu-maternitate" && p?.maternitate) {
    body = <MaternityCalculator p={p.maternitate} />;
    sources = p.maternitate.surse;
  }

  return (
    <Shell title={c.title} description={c.description}>
      {body}
      <p className="mt-6 text-sm text-sub">
        Rezultatul e o estimare orientativă{p && slug !== "convertor-valutar" ? `, cu valorile oficiale pentru ${p.an} (verificate la ${p.updated})` : ""}. Suma exactă o stabilește angajatorul sau instituția care plătește.
      </p>
      {sources.length > 0 && (
        <p className="mt-2 text-sm text-sub">
          Surse:{" "}
          {sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-ink">{s.name}</a>
            </span>
          ))}
        </p>
      )}
    </Shell>
  );
}

function Shell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: "Calculatoare", href: "/calculatoare/" }, { label: title }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-lg text-sub">{description}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
