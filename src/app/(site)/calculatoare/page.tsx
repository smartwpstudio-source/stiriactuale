import type { Metadata } from "next";
import { CalculatorsList, calculatorsListMetadata } from "@/components/calc/calculator-pages";

export const metadata: Metadata = calculatorsListMetadata("ro");

export default function CalculatorsPage() {
  return <CalculatorsList lang="ro" />;
}
