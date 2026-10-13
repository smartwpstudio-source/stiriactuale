"use client";

import { useState } from "react";
import { loan, type LoanType } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, num, type Lang } from "./i18n";

const TYPES: LoanType[] = ["anuitate", "descrescator"];

export function LoanCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].loan;
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(12);
  const [months, setMonths] = useState(36);
  const [type, setType] = useState<LoanType>("anuitate");
  const r = loan(amount, rate, months, type);
  return (
    <div className="grid gap-4">
      <NumberField label={t.amount} value={amount} onChange={setAmount} suffix={T[lang].lei} step={1000} />
      <NumberField label={t.rate} value={rate} onChange={setRate} suffix="%" step={0.1} />
      <NumberField label={t.months} value={months} onChange={setMonths} suffix={t.monthsUnit} />
      <fieldset>
        <legend className="block text-sm font-medium text-ink">{t.type}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {TYPES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              aria-pressed={type === id}
              className={`rounded px-3 py-1.5 text-sm ${type === id ? "bg-ink text-white" : "border border-line text-ink"}`}
            >
              {t.types[id]}
            </button>
          ))}
        </div>
      </fieldset>
      {!r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : (
        <>
          <ResultRows
            rows={[
              ...(type === "anuitate"
                ? [[t.monthly, money(r.first, lang)] as [string, string]]
                : [[t.first, money(r.first, lang)] as [string, string], [t.last, money(r.last, lang)] as [string, string]]),
              [t.interest, money(r.interest, lang)],
            ]}
            total={[t.total, money(r.total, lang)]}
          />
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-right text-sm">
              <thead className="text-sub">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t.year}</th>
                  <th className="px-3 py-2 font-medium">{t.principal}</th>
                  <th className="px-3 py-2 font-medium">{t.interestCol}</th>
                  <th className="px-3 py-2 font-medium">{t.remaining}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-ink">
                {r.years.map((y) => (
                  <tr key={y.year}>
                    <td className="px-3 py-1.5 text-left">{y.year}</td>
                    <td className="whitespace-nowrap px-3 py-1.5">{num(y.principal, lang, 0)}</td>
                    <td className="whitespace-nowrap px-3 py-1.5">{num(y.interest, lang, 0)}</td>
                    <td className="whitespace-nowrap px-3 py-1.5">{num(y.remaining, lang, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
