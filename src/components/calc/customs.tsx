"use client";

import { useState } from "react";
import { customsExcise, type CalcParams, type Engine } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, num, type Lang } from "./i18n";

const ENGINES: Engine[] = ["benzina", "diesel", "hibrid-benzina", "hibrid-diesel", "plugin-benzina", "plugin-diesel", "electric"];

export function CustomsCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["vamuire_auto"]>; lang?: Lang }) {
  const t = T[lang].customs;
  const thisYear = new Date().getFullYear();
  const [engine, setEngine] = useState<Engine>("benzina");
  const [cm3, setCm3] = useState(1598);
  const [year, setYear] = useState(thisYear - 8);
  const [value, setValue] = useState(150000);
  const age = Math.max(0, thisYear - year);
  const r = customsExcise(engine, cm3, age, value, p);
  return (
    <div className="grid gap-4">
      <label className="block min-w-0">
        <span className="block text-sm font-medium text-ink">{t.engine}</span>
        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value as Engine)}
          className="mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-lg text-ink outline-none focus:border-teal"
        >
          {ENGINES.map((id) => (
            <option key={id} value={id}>
              {t.engines[id]}
            </option>
          ))}
        </select>
      </label>
      {engine !== "electric" && <NumberField label={t.cm3} value={cm3} onChange={setCm3} suffix={t.cm3Unit} />}
      {engine !== "electric" && <NumberField label={t.year} value={year} onChange={setYear} />}
      <NumberField label={t.value} value={value} onChange={setValue} suffix={T[lang].lei} step={1000} />
      <ResultRows
        rows={[
          [t.duty, t.zero],
          [t.vat, t.vatValue],
          engine === "electric" ? [t.excise, t.exciseElectric] : [t.exciseRow(num(r.rate, lang), num(cm3, lang), r.reduction, age), money(r.excise, lang)],
          ...(r.lux ? [[t.lux(r.luxPct), money(r.lux, lang)] as [string, string]] : []),
        ]}
        total={[t.total, money(r.total, lang)]}
      />
    </div>
  );
}
