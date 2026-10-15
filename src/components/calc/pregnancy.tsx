"use client";

import { useState, useSyncExternalStore } from "react";
import { PREGNANCY, pregnancy, type PregnancyFrom } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, date, type Lang } from "./i18n";

// „azi” la Chișinău, calculat în browser (pagina stă în cache)
const noop = () => () => {};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });

const input = "mt-1 w-full rounded border border-line bg-white px-3 py-2 text-ink outline-none focus:border-teal";

export function PregnancyCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].pregnancy;
  const now = useSyncExternalStore(noop, today, () => "");
  const [from, setFrom] = useState<PregnancyFrom>("menstruatie");
  const [day, setDay] = useState("");
  const [cycle, setCycle] = useState<number>(PREGNANCY.ciclu);
  const r = now && day ? pregnancy(from, day, cycle, now) : null;
  return (
    <div className="grid gap-4">
      <Choice label={t.from} value={from} onChange={setFrom} options={[["menstruatie", t.froms.menstruatie], ["conceptie", t.froms.conceptie]]} />
      <label className="block">
        <span className="block text-sm font-medium text-ink">{from === "menstruatie" ? t.lmp : t.conception}</span>
        <input type="date" value={day} max={now || undefined} onChange={(e) => setDay(e.target.value)} className={input} />
      </label>
      {from === "menstruatie" && <NumberField label={t.cycle} value={cycle} onChange={setCycle} suffix={T[lang].daysUnit} />}
      {!r ? (
        <p className="text-sub">{day ? t.invalid : t.empty}</p>
      ) : (
        <ResultRows
          rows={[
            [t.week, t.weekValue(r.weeks, r.days)],
            [t.trimester, t.trimesters[r.trimester - 1]],
            [t.left, r.left >= 0 ? t.leftValue(r.left) : t.past(-r.left)],
            [t.end1, date(r.milestones.trimestrul1, lang)],
            [t.end2, date(r.milestones.trimestrul2, lang)],
            [t.term, date(r.milestones.termen, lang)],
            [t.over, date(r.milestones.depasire, lang)],
          ]}
          total={[t.due, date(r.due, lang)]}
        />
      )}
    </div>
  );
}
