"use client";

import { useState } from "react";
import type { Rate } from "@/lib/bnm";
import { NumberField } from "./fields";
import { T, num, type Lang } from "./i18n";

export function CurrencyConverter({ rates, lang = "ro" }: { rates: Rate[]; lang?: Lang }) {
  const t = T[lang];
  const [amount, setAmount] = useState(100);
  const [code, setCode] = useState(rates[0]?.code ?? "EUR");
  const [toLei, setToLei] = useState(true);
  const rate = rates.find((r) => r.code === code)!;
  const perUnit = rate.value / rate.nominal;
  const result = toLei ? amount * perUnit : amount / perUnit;
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {rates.map((r) => (
          <button
            key={r.code}
            type="button"
            onClick={() => setCode(r.code)}
            className={`rounded px-3 py-1.5 font-mono text-sm ${code === r.code ? "bg-ink text-white" : "border border-line text-ink"}`}
          >
            {r.code}
          </button>
        ))}
      </div>
      <NumberField label={toLei ? t.currency.amountIn(code) : t.currency.amountLei} value={amount} onChange={setAmount} suffix={toLei ? code : "MDL"} />
      <button type="button" onClick={() => setToLei((v) => !v)} className="mt-3 text-sm text-teal underline">
        {toLei ? t.currency.swap(code, t.lei) : t.currency.swap(t.lei, code)}
      </button>
      <div className="mt-6 flex justify-between gap-4 rounded-lg bg-teal px-4 py-4 text-white">
        <span className="font-medium">{toLei ? t.currency.inLei : t.currency.inCode(code)}</span>
        <span className="font-mono text-xl font-semibold">
          {num(result, lang)} {toLei ? t.lei : code}
        </span>
      </div>
      <p className="mt-2 font-mono text-xs text-sub">{t.currency.rate(code, num(perUnit, lang))}</p>
    </div>
  );
}
