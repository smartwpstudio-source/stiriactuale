"use client";

import { useState } from "react";
import { childcare, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, childcareOption, money, num, type Lang } from "./i18n";

export function ChildcareCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["crestere_copil"]>; lang?: Lang }) {
  const t = T[lang];
  const [avg, setAvg] = useState(10000);
  const options = childcare(avg, p);
  return (
    <div className="grid gap-4">
      <NumberField label={t.childcare.avg} value={avg} onChange={setAvg} suffix={t.lei} step={100} />
      {options.map((o) => (
        <ResultRows
          key={o.id}
          rows={o.etape.map((e) => [t.childcare.stage(e.procent, e.luni), `${money(e.lunar, lang)} ${t.childcare.perMonth}`] as [string, string])}
          total={[t.childcare.option(o.id, childcareOption(o.id, o.nume, lang)), money(o.total, lang)]}
        />
      ))}
      <ResultRows
        rows={[[t.childcare.extra(num(p.suplimentar_lunar_lei, lang), p.suplimentar_luni / 12), money(p.suplimentar_lunar_lei * p.suplimentar_luni, lang)]]}
        total={[t.childcare.single, money(p.indemnizatie_unica_lei, lang)]}
      />
    </div>
  );
}
