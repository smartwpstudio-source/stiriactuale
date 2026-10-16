"use client";

import { useState, useSyncExternalStore } from "react";
import { retirement, type Sex } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, date, num, type Lang } from "./i18n";

// „azi” la Chișinău, calculat în browser (pagina stă în cache)
const noop = () => () => {};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });

const input = "mt-1 w-full rounded border border-line bg-white px-3 py-2 text-ink outline-none focus:border-teal";

export function RetirementCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].retirement;
  const now = useSyncExternalStore(noop, today, () => "");
  const [birth, setBirth] = useState("");
  const [sex, setSex] = useState<Sex>("f");
  const [kids, setKids] = useState<"nu" | "da">("nu");
  const [stagiu, setStagiu] = useState(0);
  const r = birth ? retirement(birth, sex, kids === "da", stagiu) : null;
  const years = (n: number) => `${num(n, lang, 1)} ${t.yearsUnit(n)}`;
  return (
    <div className="grid gap-4">
      <label className="block">
        <span className="block text-sm font-medium text-ink">{t.birth}</span>
        <input type="date" value={birth} min="1940-01-01" max={now || undefined} onChange={(e) => setBirth(e.target.value)} className={input} />
      </label>
      <Choice label={t.sex} value={sex} onChange={setSex} options={[["f", t.sexes.f], ["m", t.sexes.m]]} />
      {sex === "f" && <Choice label={t.kids} value={kids} onChange={setKids} options={[["nu", t.no], ["da", t.yes]]} />}
      <NumberField label={t.stagiu} value={stagiu} onChange={setStagiu} suffix={T[lang].yearsUnit} step={0.5} />
      {!birth ? (
        <p className="text-sub">{t.empty}</p>
      ) : !r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : r.before2017 ? (
        <p className="text-sub">{t.before2017}</p>
      ) : (
        <>
          <ResultRows
            rows={[
              [t.age, t.ageValue(r.years, r.months)],
              [t.minimum, years(r.minimum)],
              [t.complete, years(r.complete)],
              ...(r.missingMin === null || r.missingComplete === null
                ? []
                : ([
                    [t.missingMin, r.missingMin > 0 ? years(r.missingMin) : t.done],
                    [t.missingComplete, r.missingComplete > 0 ? years(r.missingComplete) : t.done],
                  ] as [string, string][])),
              [t.longCareer, years(r.longCareer)],
            ]}
            total={[t.date, date(r.date, lang)]}
          />
          {now && r.date <= now && <p className="text-sm text-sub">{t.reached}</p>}
        </>
      )}
    </div>
  );
}
