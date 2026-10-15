"use client";

import { useState } from "react";
import { BIRTH_ALLOWANCE, birthAllowance } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, money, type Lang } from "./i18n";

const YEARS = Object.keys(BIRTH_ALLOWANCE.lei).sort().reverse();

export function BirthAllowanceCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].birth;
  const [year, setYear] = useState(YEARS[0]);
  const [children, setChildren] = useState(1);
  const r = birthAllowance(Number(year), children);
  return (
    <div className="grid gap-4">
      <Choice label={t.year} value={year} onChange={setYear} options={YEARS.map((y) => [y, y] as [string, string])} />
      <NumberField label={t.children} value={children} onChange={setChildren} />
      {!r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : (
        <ResultRows rows={[[t.perChild, money(r.perChild, lang)], [t.count, String(r.children)]]} total={[t.total, money(r.total, lang)]} />
      )}
      <p className="text-sm text-sub">{t.hint}</p>
    </div>
  );
}
