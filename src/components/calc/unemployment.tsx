"use client";

import { useState } from "react";
import { unemployment, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, type Lang } from "./i18n";

export function UnemploymentCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["somaj"]>; lang?: Lang }) {
  const t = T[lang];
  const [avg, setAvg] = useState(10000);
  const [years, setYears] = useState(5);
  const r = unemployment(avg, Math.round(years * 12), p);
  return (
    <div className="grid gap-4">
      <NumberField label={t.unemployment.avg} value={avg} onChange={setAvg} suffix={t.lei} step={100} />
      <NumberField label={t.unemployment.stagiu} value={years} onChange={setYears} suffix={t.yearsUnit} step={0.5} />
      {r ? (
        <ResultRows
          rows={[
            [t.unemployment.monthly(p.procent), money(r.monthly, lang)],
            [t.unemployment.duration, t.months(r.luni)],
          ]}
          total={[t.unemployment.total, money(r.total, lang)]}
        />
      ) : (
        <p className="rounded-lg border border-alert/40 bg-white p-4 text-ink">{t.unemployment.none(p.stagiu_minim_luni)}</p>
      )}
    </div>
  );
}
