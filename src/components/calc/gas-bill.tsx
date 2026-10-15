"use client";

import { useState } from "react";
import { ENERGY, gasBill } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, date, money, num, type Lang } from "./i18n";

export function GasBillCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].gas;
  const [mode, setMode] = useState<"m3" | "index">("m3");
  const [m3, setM3] = useState(50);
  const [oldIdx, setOldIdx] = useState(0);
  const [newIdx, setNewIdx] = useState(0);
  const used = mode === "m3" ? m3 : Math.max(0, newIdx - oldIdx);
  const r = gasBill(used);
  return (
    <div className="grid gap-4">
      <Choice label={t.mode} value={mode} onChange={setMode} options={[["m3", t.modes.m3], ["index", t.modes.index]]} />
      {mode === "m3" ? (
        <NumberField label={t.m3} value={m3} onChange={setM3} suffix="m³" />
      ) : (
        <>
          <NumberField label={t.oldIdx} value={oldIdx} onChange={setOldIdx} suffix="m³" />
          <NumberField label={t.newIdx} value={newIdx} onChange={setNewIdx} suffix="m³" />
          {newIdx < oldIdx && <p className="text-sm text-sub">{t.indexError}</p>}
        </>
      )}
      <ResultRows
        rows={[
          [t.used, `${num(r.m3, lang)} m³`],
          [t.price(date(ENERGY.gaz.de_la, lang)), `${num(ENERGY.gaz.lei_m3, lang, 3)} ${T[lang].lei}/m³`],
          [t.net, money(r.net, lang)],
          [t.vat(ENERGY.gaz.tva_pct), money(r.vat, lang)],
        ]}
        total={[t.total, money(r.total, lang)]}
      />
      <div className="rounded-lg border border-line bg-white p-4 text-[0.95rem] text-ink">
        <h2 className="font-medium">{t.howTo}</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sub">
          {t.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
