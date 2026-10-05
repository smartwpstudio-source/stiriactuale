"use client";

import { useState } from "react";
import { roadTax, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

const num = (n: number) => n.toLocaleString("ro-MD", { maximumFractionDigits: 2 });

export function RoadTaxCalculator({ p }: { p: NonNullable<CalcParams["taxa_drum"]> }) {
  const [id, setId] = useState(p.categorii[0].id);
  const c = p.categorii.find((x) => x.id === id) ?? p.categorii[0];
  const [values, setValues] = useState<Record<string, number>>({});
  const value = values[c.id] ?? c.implicit ?? 0;
  const { tax, step } = roadTax(value, c);
  const rule =
    step.suma !== undefined
      ? `sumă fixă pe an${c.unitate ? ` (${step.max === null ? "peste pragul anterior" : `până la ${num(step.max)} ${c.unitate}`})` : ""}`
      : `${num(step.rata ?? 0)} lei × ${num(value)} ${c.unitate}`;
  return (
    <div className="grid gap-4">
      <label className="block">
        <span className="block text-sm font-medium text-ink">Tipul vehiculului</span>
        <select
          value={c.id}
          onChange={(e) => setId(e.target.value)}
          className="mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-lg text-ink outline-none focus:border-teal"
        >
          {p.categorii.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nume}
            </option>
          ))}
        </select>
      </label>
      {c.unitate && (
        <NumberField
          label={c.camp ?? ""}
          value={value}
          onChange={(n) => setValues({ ...values, [c.id]: n })}
          suffix={c.unitate}
          step={c.unitate === "t" ? 0.1 : 1}
        />
      )}
      <ResultRows rows={[["Calcul", rule]]} total={["Taxa pe an", lei(tax)]} />
    </div>
  );
}
