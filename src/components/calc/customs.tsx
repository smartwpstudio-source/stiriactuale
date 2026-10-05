"use client";

import { useState } from "react";
import { customsExcise, type CalcParams, type Engine } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

const ENGINES: [Engine, string][] = [
  ["benzina", "Benzină"],
  ["diesel", "Motorină (diesel)"],
  ["hibrid-benzina", "Hibrid benzină (full hybrid)"],
  ["hibrid-diesel", "Hibrid diesel (full hybrid)"],
  ["plugin-benzina", "Plug-in hibrid benzină"],
  ["plugin-diesel", "Plug-in hibrid diesel"],
  ["electric", "Complet electric"],
];

export function CustomsCalculator({ p }: { p: NonNullable<CalcParams["vamuire_auto"]> }) {
  const thisYear = new Date().getFullYear();
  const [engine, setEngine] = useState<Engine>("benzina");
  const [cm3, setCm3] = useState(1598);
  const [year, setYear] = useState(thisYear - 8);
  const [value, setValue] = useState(150000);
  const age = Math.max(0, thisYear - year);
  const r = customsExcise(engine, cm3, age, value, p);
  return (
    <div className="grid gap-4">
      <label className="block">
        <span className="block text-sm font-medium text-ink">Tipul motorului</span>
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value as Engine)}
          className="mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-lg text-ink outline-none focus:border-teal"
        >
          {ENGINES.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {engine !== "electric" && <NumberField label="Capacitatea cilindrică" value={cm3} onChange={setCm3} suffix="cm³" />}
      {engine !== "electric" && <NumberField label="Anul fabricației" value={year} onChange={setYear} />}
      <NumberField label="Valoarea în vamă (contează doar peste 600.000 lei)" value={value} onChange={setValue} suffix="lei" step={1000} />
      <ResultRows
        rows={[
          ["Taxa vamală", "0 lei"],
          ["TVA", "0 lei (scutit)"],
          engine === "electric"
            ? ["Acciza", "0 lei (electric)"]
            : [
                `Acciza: ${r.rate.toLocaleString("ro-MD")} lei × ${cm3.toLocaleString("ro-MD")} cm³${r.reduction ? ` − ${r.reduction}%` : ""} (${age} ani)`,
                lei(r.excise),
              ],
          ...(r.lux ? [[`Acciza de lux (${r.luxPct}% din valoare)`, lei(r.lux)] as [string, string]] : []),
        ]}
        total={["Total de plată la vamă", lei(r.total)]}
      />
    </div>
  );
}
