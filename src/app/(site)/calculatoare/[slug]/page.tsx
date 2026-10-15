import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorView, calculatorMetadata } from "@/components/calc/calculator-pages";
import { CALCULATORS } from "@/lib/calculators";

// cursul BNM se schimbă zilnic; parametrii doar la deploy
export const revalidate = 3600;

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/calculatoare/[slug]">): Promise<Metadata> {
  return calculatorMetadata((await params).slug, "ro");
}

export default async function CalculatorPage({ params }: PageProps<"/calculatoare/[slug]">) {
  const view = await CalculatorView({ slug: (await params).slug, lang: "ro" });
  if (!view) notFound();
  return view;
}
