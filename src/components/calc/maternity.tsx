"use client";

import { useState } from "react";
import { maternityPay, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function MaternityCalculator({ p }: { p: NonNullable<CalcParams["maternitate"]> }) {
  const [avg, setAvg] = useState(10000);
  const r = maternityPay(avg, p);
  return (
    <div>
      <NumberField label={`Venitul mediu lunar asigurat (ultimele ${p.luni_baza} luni)`} value={avg} onChange={setAvg} suffix="lei" step={100} />
      <ResultRows
        rows={[
          ["Procent", `${p.procent}%`],
          ["Indemnizația pe o zi", lei(r.daily)],
          ["Durata concediului", `${r.days} zile calendaristice`],
        ]}
        total={["Total estimat", lei(r.total)]}
      />
    </div>
  );
}
