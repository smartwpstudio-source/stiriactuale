import type { Metadata } from "next";
import { CalculatorsList, calculatorsListMetadata } from "@/components/calc/calculator-pages";

// Lista calculatoarelor în rusă — același șablon ca /calculatoare/.
export const metadata: Metadata = calculatorsListMetadata("ru");

export default function RuCalculatorsPage() {
  return <CalculatorsList lang="ru" />;
}
