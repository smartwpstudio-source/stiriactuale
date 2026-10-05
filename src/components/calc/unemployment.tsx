"use client";

import { useState } from "react";
import { unemployment, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function UnemploymentCalculator({ p }: { p: NonNullable<CalcParams["somaj"]> }) {
  const [avg, setAvg] = useState(10000);
  const [years, setYears] = useState(5);
  const r = unemployment(avg, Math.round(years * 12), p);
  return (
    <div className="grid gap-4">
      <NumberField label="Venitul mediu lunar asigurat (ultimele 12 luni)" value={avg} onChange={setAvg} suffix="lei" step={100} />
      <NumberField label="Stagiul total de cotizare" value={years} onChange={setYears} suffix="ani" step={0.5} />
      {r ? (
        <ResultRows
          rows={[
            [`Pe lună (${p.procent}% din venit)`, lei(r.monthly)],
            ["Durata plății", `${r.luni} luni`],
          ]}
          total={["Total pe toată perioada", lei(r.total)]}
        />
      ) : (
        <p className="rounded-lg border border-alert/40 bg-white p-4 text-ink">
          Fără drept la indemnizație: e nevoie de cel puțin {p.stagiu_minim_luni} luni de stagiu de cotizare în ultimele 24 de luni.
        </p>
      )}
    </div>
  );
}
