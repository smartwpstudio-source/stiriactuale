"use client";

import { useState } from "react";
import { childcare, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function ChildcareCalculator({ p }: { p: NonNullable<CalcParams["crestere_copil"]> }) {
  const [avg, setAvg] = useState(10000);
  const options = childcare(avg, p);
  return (
    <div className="grid gap-4">
      <NumberField label="Venitul mediu lunar asigurat (12 luni înainte de naștere)" value={avg} onChange={setAvg} suffix="lei" step={100} />
      {options.map((o) => (
        <ResultRows
          key={o.id}
          rows={o.etape.map((e) => [`${e.procent}% × ${e.luni} luni`, `${lei(e.lunar)} / lună`] as [string, string])}
          total={[`Opțiunea ${o.id}: ${o.nume}`, lei(o.total)]}
        />
      ))}
      <ResultRows
        rows={[[`Plus ${p.suplimentar_lunar_lei.toLocaleString("ro-MD")} lei pe lună, până la ${p.suplimentar_luni / 12} ani`, lei(p.suplimentar_lunar_lei * p.suplimentar_luni)]]}
        total={["Indemnizația unică la naștere", lei(p.indemnizatie_unica_lei)]}
      />
    </div>
  );
}
