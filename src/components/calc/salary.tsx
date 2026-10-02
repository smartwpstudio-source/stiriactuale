"use client";

import { useState } from "react";
import { grossForNet, netSalary, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows, lei } from "./fields";

export function SalaryCalculator({ p }: { p: NonNullable<CalcParams["salariu"]> }) {
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
      <div className="mb-4 flex gap-2">
        {tab("brut", "Știu salariul brut")}
        {tab("net", "Știu cât vreau „în mână”")}
      </div>
      <NumberField label={mode === "brut" ? "Salariul brut lunar" : "Salariul net dorit"} value={amount} onChange={setAmount} suffix="lei" step={100} />
      <ResultRows
        rows={[
          ["Salariul brut", lei(r.gross)],
          [`Asigurare medicală CNAM (${p.cnam_angajat_pct}%)`, `− ${lei(r.cnam)}`],
          [`Contribuții sociale CNAS (${p.cnas_angajat_pct}%)`, `− ${lei(r.cnas)}`],
          [`Impozit pe venit (${p.impozit_venit_pct}%)`, `− ${lei(r.tax)}`],
        ]}
        total={["Salariul net („în mână”)", lei(r.net)]}
      />
    </div>
  );
}
