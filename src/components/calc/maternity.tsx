"use client";

import { useState } from "react";
import { maternityPay, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function MaternityCalculator({ p }: { p: NonNullable<CalcParams["maternitate"]> }) {
  const [avg, setAvg] = useState(10000);
  const options = p.durate ?? [{ zile: p.zile_total, caz: "durata standard" }];
  const [days, setDays] = useState(options[0].zile);
  const r = maternityPay(avg, p, days);
  return (
    <div className="grid gap-4">
      <NumberField label={`Venitul mediu lunar asigurat (ultimele ${p.luni_baza} luni)`} value={avg} onChange={setAvg} suffix="lei" step={100} />
      <fieldset>
        <legend className="text-sm font-medium text-ink">Durata concediului</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.zile}
              type="button"
              onClick={() => setDays(o.zile)}
              className={`rounded px-3 py-1.5 text-left text-sm ${days === o.zile ? "bg-ink text-white" : "border border-line text-ink"}`}
            >
              {o.zile} zile <span className="opacity-75">· {o.caz}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <ResultRows
        rows={[
          ["Procent", `${p.procent}%`],
          ["Indemnizația pe o zi", lei(r.daily)],
          ["Durata", `${r.days} zile calendaristice`],
        ]}
        total={["Total estimat", lei(r.total)]}
      />
    </div>
  );
}
