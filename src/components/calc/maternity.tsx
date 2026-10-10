"use client";

import { useState } from "react";
import { maternityPay, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, maternityCase, money, type Lang } from "./i18n";

export function MaternityCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["maternitate"]>; lang?: Lang }) {
  const t = T[lang];
  const [avg, setAvg] = useState(10000);
  const options = p.durate ?? [{ zile: p.zile_total, caz: t.maternity.standard }];
  const [days, setDays] = useState(options[0].zile);
  const r = maternityPay(avg, p, days);
  return (
    <div className="grid gap-4">
      <NumberField label={t.maternity.avg(p.luni_baza)} value={avg} onChange={setAvg} suffix={t.lei} step={100} />
      <fieldset>
        <legend className="text-sm font-medium text-ink">{t.maternity.duration}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.zile}
              type="button"
              onClick={() => setDays(o.zile)}
              className={`rounded px-3 py-1.5 text-left text-sm ${days === o.zile ? "bg-ink text-white" : "border border-line text-ink"}`}
            >
              {t.maternity.option(o.zile)} <span className="opacity-75">· {maternityCase(o.zile, o.caz, lang)}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <ResultRows
        rows={[
          [t.maternity.percent, `${p.procent}%`],
          [t.maternity.daily, money(r.daily, lang)],
          [t.maternity.length, t.maternity.calendarDays(r.days)],
        ]}
        total={[t.maternity.total, money(r.total, lang)]}
      />
    </div>
  );
}
