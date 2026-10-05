"use client";

import { useState } from "react";
import { propertyTax, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function PropertyTaxCalculator({ p }: { p: NonNullable<CalcParams["impozit_imobil"]> }) {
  const [value, setValue] = useState(800000);
  const [rate, setRate] = useState(0.1);
  return (
    <div className="grid gap-4">
      <NumberField label="Valoarea estimată (de pe avizul de plată)" value={value} onChange={setValue} suffix="lei" step={1000} />
      <NumberField label={`Cota primăriei (minimul legal: ${p.cota_minima_pct}%)`} value={rate} onChange={setRate} suffix="%" step={0.005} />
      <ResultRows rows={[["Calcul", `${value.toLocaleString("ro-MD")} lei × ${rate.toLocaleString("ro-MD")}%`]]} total={["Impozitul pe an", lei(propertyTax(value, rate))]} />
    </div>
  );
}
