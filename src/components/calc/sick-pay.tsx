"use client";

import { useState } from "react";
import { sickPay, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, type Lang } from "./i18n";

export function SickPayCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["concediu_medical"]>; lang?: Lang }) {
  const t = T[lang];
  const [avg, setAvg] = useState(10000);
  const [years, setYears] = useState(5);
  const [days, setDays] = useState(10);
  const r = sickPay(avg, years, days, p);
  return (
    <div className="grid gap-4">
      <NumberField label={t.sick.avg(p.luni_baza)} value={avg} onChange={setAvg} suffix={t.lei} step={100} />
      <NumberField label={t.sick.stagiu} value={years} onChange={setYears} suffix={t.yearsUnit} />
      <NumberField label={t.sick.days} value={days} onChange={setDays} suffix={t.daysUnit} />
      <ResultRows
        rows={[
          [t.sick.employer(r.empDays, r.empPct), money(r.employer, lang)],
          [t.sick.cnas(Math.max(0, days - r.empDays), r.pct), money(r.cnas, lang)],
        ]}
        total={[t.sick.total(days), money(r.total, lang)]}
      />
    </div>
  );
}
