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
      <NumberField label="Zile de concediu medical (din certificat)" value={days} onChange={setDays} suffix="zile" />
      <ResultRows
        rows={[
          [`Primele ${r.empDays} zile — plătește angajatorul (${r.empPct}%)`, lei(r.employer)],
          [`Restul de ${Math.max(0, days - r.empDays)} zile — plătește CNAS (${r.pct}%, după stagiu)`, lei(r.cnas)],
        ]}
        total={[`Total pentru ${days} zile`, lei(r.total)]}
      />
    </div>
  );
}
