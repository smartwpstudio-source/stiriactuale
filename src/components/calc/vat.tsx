"use client";

import { useState } from "react";
import { VAT, vat, type VatMode } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, money, type Lang } from "./i18n";

export function VatCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].vat;
  const [amount, setAmount] = useState(1000);
  const [mode, setMode] = useState<VatMode>("adauga");
  const [rate, setRate] = useState<string>(String(VAT.cote[0]));
  const r = vat(amount, Number(rate), mode);
  return (
    <div className="grid gap-4">
      <Choice label={t.mode} value={mode} onChange={setMode} options={[["adauga", t.modes.adauga], ["scoate", t.modes.scoate]]} />
      <NumberField label={mode === "adauga" ? t.amountNet : t.amountGross} value={amount} onChange={setAmount} suffix={T[lang].lei} step={10} />
      <Choice label={t.rate} value={rate} onChange={setRate} options={VAT.cote.map((c) => [String(c), t.rates[c]] as [string, string])} />
      {!r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : (
        <ResultRows
          rows={mode === "adauga" ? [[t.net, money(r.net, lang)], [t.tax(Number(rate)), money(r.tax, lang)]] : [[t.gross, money(r.gross, lang)], [t.tax(Number(rate)), money(r.tax, lang)]]}
          total={mode === "adauga" ? [t.gross, money(r.gross, lang)] : [t.net, money(r.net, lang)]}
        />
      )}
    </div>
  );
}
