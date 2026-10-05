"use client";

import { useState } from "react";
import { vacationPay, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function VacationCalculator({ p }: { p: NonNullable<CalcParams["concediu_odihna"]> }) {
  const [avg, setAvg] = useState(12000);
  const [days, setDays] = useState(p.zile_minime);
  const r = vacationPay(avg, days, p);
  return (
    <div className="grid gap-4">
      <NumberField label="Salariul mediu lunar din ultimele 3 luni (brut)" value={avg} onChange={setAvg} suffix="lei" step={100} />
      <NumberField label="Zile de concediu (calendaristice)" value={days} onChange={setDays} suffix="zile" />
      <ResultRows rows={[["Pe o zi calendaristică", lei(r.daily)]]} total={[`Indemnizația pentru ${days} zile (brut)`, lei(r.total)]} />
    </div>
  );
}
