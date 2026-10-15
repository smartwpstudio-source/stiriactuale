"use client";

import { useState } from "react";
import { DEPOSIT, deposit, type Capitalization } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, money, num, type Lang } from "./i18n";

export function DepositCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].deposit;
  const [amount, setAmount] = useState(50000);
  const [rate, setRate] = useState(5);
  const [months, setMonths] = useState(12);
  const [cap, setCap] = useState<Capitalization>("lunar");
  const [taxed, setTaxed] = useState<"da" | "nu">("da");
  const r = deposit(amount, rate, months, cap, taxed === "da");
  // tabelul: lună cu lună până la 2 ani, apoi pe ani (ultima lună a fiecărui an)
  const byYear = (r?.rows.length ?? 0) > 24;
  const rows = !r ? [] : byYear ? r.rows.filter((x) => x.month % 12 === 0 || x.month === r.rows.length) : r.rows;
  const sumTo = (m: number, from: number, k: "interest" | "tax") => r!.rows.filter((x) => x.month > from && x.month <= m).reduce((a, x) => a + x[k], 0);
  return (
    <div className="grid gap-4">
      <NumberField label={t.amount} value={amount} onChange={setAmount} suffix={T[lang].lei} step={1000} />
      <NumberField label={t.rate} value={rate} onChange={setRate} suffix="%" step={0.1} />
      <NumberField label={t.months} value={months} onChange={setMonths} suffix={t.monthsUnit} />
      <Choice label={t.cap} value={cap} onChange={setCap} options={[["lunar", t.caps.lunar], ["scadenta", t.caps.scadenta]]} />
      <Choice label={t.tax} value={taxed} onChange={setTaxed} options={[["da", t.taxes.da], ["nu", t.taxes.nu]]} />
      {!r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : (
        <>
          <ResultRows
            rows={[
              [t.gross, money(r.gross, lang)],
              [t.taxRow(taxed === "da" ? DEPOSIT.impozit_pct : 0), money(r.tax, lang)],
              [t.net, money(r.net, lang)],
              [t.effective, `${num(r.effectivePct, lang)}%`],
            ]}
            total={[t.final, money(r.final, lang)]}
          />
          {r.overGuarantee && (
            <p role="alert" className="rounded border border-alert bg-white px-4 py-3 text-sm font-medium text-alert">
              {t.over(num(DEPOSIT.plafon_fgdsb_lei, lang))}
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-right text-sm">
              <thead className="text-sub">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{byYear ? t.year : t.month}</th>
                  <th className="px-3 py-2 font-medium">{t.interest}</th>
                  <th className="px-3 py-2 font-medium">{t.taxCol}</th>
                  <th className="px-3 py-2 font-medium">{t.balance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-ink">
                {rows.map((x, i) => {
                  const from = byYear ? (i === 0 ? 0 : rows[i - 1].month) : x.month - 1;
                  return (
                    <tr key={x.month}>
                      <td className="px-3 py-1.5 text-left">{byYear ? Math.ceil(x.month / 12) : x.month}</td>
                      <td className="whitespace-nowrap px-3 py-1.5">{num(sumTo(x.month, from, "interest"), lang)}</td>
                      <td className="whitespace-nowrap px-3 py-1.5">{num(sumTo(x.month, from, "tax"), lang)}</td>
                      <td className="whitespace-nowrap px-3 py-1.5">{num(x.balance, lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
