"use client";

import { useState } from "react";
import { sickPay, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function SickPayCalculator({ p }: { p: NonNullable<CalcParams["concediu_medical"]> }) {
  const [avg, setAvg] = useState(10000);
  const [years, setYears] = useState(5);
  const [days, setDays] = useState(10);
  const r = sickPay(avg, years, days, p);
  return (
    <div className="grid gap-4">
      <NumberField label={`Venitul mediu lunar asigurat (ultimele ${p.luni_baza} luni)`} value={avg} onChange={setAvg} suffix="lei" step={100} />
      <NumberField label="Stagiul total de cotizare" value={years} onChange={setYears} suffix="ani" />
      <NumberField label="Zile de concediu medical (lucrătoare)" value={days} onChange={setDays} suffix="zile" />
      <ResultRows
        rows={[
          ["Procent după stagiu", `${r.pct}%`],
          ["Indemnizația pe o zi", lei(r.daily)],
          [`Primele ${p.primele_zile_angajator} zile`, "plătite de angajator"],
        ]}
        total={[`Total pentru ${days} zile`, lei(r.total)]}
      />
    </div>
  );
}
