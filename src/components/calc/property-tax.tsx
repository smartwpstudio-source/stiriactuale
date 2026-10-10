"use client";

import { useState } from "react";
import { propertyTax, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, num, type Lang } from "./i18n";

export function PropertyTaxCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["impozit_imobil"]>; lang?: Lang }) {
  const t = T[lang];
  const [value, setValue] = useState(800000);
  const [rate, setRate] = useState(0.1);
  return (
    <div className="grid gap-4">
      <NumberField label={t.property.value} value={value} onChange={setValue} suffix={t.lei} step={1000} />
      <NumberField label={t.property.rate(p.cota_minima_pct)} value={rate} onChange={setRate} suffix="%" step={0.005} />
      <ResultRows
        rows={[[t.calc, `${num(value, lang)} ${t.lei} × ${num(rate, lang, 3)}%`]]}
        total={[t.property.total, money(propertyTax(value, rate), lang)]}
      />
    </div>
  );
}
