import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorView, calculatorMetadata } from "@/components/calc/calculator-pages";
import { CALCULATORS } from "@/lib/calculators";

// Calculatoarele în rusă: aceeași logică și aceiași parametri ca /calculatoare/,
// doar textele diferă (components/calc/i18n.ts). Puține pagini — se construiesc
// la build, ca varianta românească.
export const revalidate = 3600;

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/ru/calculatoare/[slug]">): Promise<Metadata> {
  return calculatorMetadata((await params).slug, "ru");
}

export default async function RuCalculatorPage({ params }: PageProps<"/ru/calculatoare/[slug]">) {
  const view = await CalculatorView({ slug: (await params).slug, lang: "ru" });
  if (!view) notFound();
  return view;
}
