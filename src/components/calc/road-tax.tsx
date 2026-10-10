"use client";

import { useState } from "react";
import { roadTax, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, num, roadCategory, roadField, unit, type Lang } from "./i18n";

export function RoadTaxCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["taxa_drum"]>; lang?: Lang }) {
  const t = T[lang];
  const [id, setId] = useState(p.categorii[0].id);
  const c = p.categorii.find((x) => x.id === id) ?? p.categorii[0];
  const [values, setValues] = useState<Record<string, number>>({});
  const value = values[c.id] ?? c.implicit ?? 0;
  const { tax, step } = roadTax(value, c);
  const u = c.unitate ? unit(c.unitate, lang) : "";
  const rule =
    step.suma !== undefined
      ? `${t.road.fixed}${c.unitate ? ` (${step.max === null ? t.road.above : t.road.upTo(num(step.max, lang), u)})` : ""}`
      : `${num(step.rata ?? 0, lang)} ${t.lei} × ${num(value, lang)} ${u}`;
  return (
    <div className="grid gap-4">
      <label className="block min-w-0">
        <span className="block text-sm font-medium text-ink">{t.road.type}</span>
        <select
          value={c.id}
          onChange={(e) => setId(e.target.value)}
          className="mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-lg text-ink outline-none focus:border-teal"
        >
          {p.categorii.map((x) => (
            <option key={x.id} value={x.id}>
              {roadCategory(x.id, x.nume, lang)}
            </option>
          ))}
        </select>
      </label>
      {c.unitate && (
        <NumberField
          label={roadField(c.id, c.camp ?? "", lang)}
          value={value}
          onChange={(n) => setValues({ ...values, [c.id]: n })}
          suffix={u}
          step={c.unitate === "t" ? 0.1 : 1}
        />
      )}
      <ResultRows rows={[[t.calc, rule]]} total={[t.road.total, money(tax, lang)]} />
    </div>
  );
}
