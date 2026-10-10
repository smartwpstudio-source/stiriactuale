"use client";

import { useState } from "react";
import { grossForNet, netSalary, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, type Lang } from "./i18n";

export function SalaryCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["salariu"]>; lang?: Lang }) {
  const t = T[lang];
  const [mode, setMode] = useState<"brut" | "net">("brut");
  const [amount, setAmount] = useState(10000);
  const r = netSalary(mode === "brut" ? amount : grossForNet(amount, p), p);
  const tab = (m: typeof mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`rounded px-3 py-1.5 text-sm ${mode === m ? "bg-ink text-white" : "border border-line text-ink"}`}
    >
      {label}
    </button>
  );
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tab("brut", t.salary.knowGross)}
        {tab("net", t.salary.knowNet)}
      </div>
      <NumberField label={mode === "brut" ? t.salary.grossInput : t.salary.netInput} value={amount} onChange={setAmount} suffix={t.lei} step={100} />
      <ResultRows
        rows={[
          [t.salary.gross, money(r.gross, lang)],
          [t.salary.cnam(p.cnam_angajat_pct), `− ${money(r.cnam, lang)}`],
          [t.salary.cnas(p.cnas_angajat_pct), `− ${money(r.cnas, lang)}`],
          [t.salary.tax(p.impozit_venit_pct), `− ${money(r.tax, lang)}`],
        ]}
        total={[t.salary.net, money(r.net, lang)]}
      />
    </div>
  );
}
