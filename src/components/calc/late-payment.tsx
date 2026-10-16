"use client";

import { useState, useSyncExternalStore } from "react";
import { latePayment, type LateKind } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, date, money, num, type Lang } from "./i18n";

// „azi” la Chișinău, calculat în browser (pagina stă în cache)
const noop = () => () => {};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });

const input = "mt-1 w-full rounded border border-line bg-white px-3 py-2 text-ink outline-none focus:border-teal";

export function LatePaymentCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].late;
  const now = useSyncExternalStore(noop, today, () => "");
  const [amount, setAmount] = useState(10000);
  const [due, setDue] = useState("");
  const [paid, setPaid] = useState("");
  const [kind, setKind] = useState<LateKind>("consumator");
  const [pct, setPct] = useState(0.1);
  const pay = paid || now;
  const r = due && pay ? latePayment(amount, due, pay, kind, pct) : null;
  const rate = (p: { rate: number; perDay: boolean }) => (p.perDay ? t.perDay(num(p.rate, lang, 4)) : t.perYear(num(p.rate, lang, 2)));
  return (
    <div className="grid gap-4">
      <NumberField label={t.amount} value={amount} onChange={setAmount} suffix={T[lang].lei} step={100} />
      <label className="block">
        <span className="block text-sm font-medium text-ink">{t.due}</span>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={input} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-ink">{t.paid}</span>
        <input type="date" value={pay} onChange={(e) => setPaid(e.target.value)} className={input} />
      </label>
      <Choice
        label={t.kind}
        value={kind}
        onChange={setKind}
        options={(["consumator", "profesionist", "contract", "fiscal"] as LateKind[]).map((k) => [k, t.kinds[k]] as [LateKind, string])}
      />
      {kind === "contract" && <NumberField label={t.contractPct} value={pct} onChange={setPct} suffix={t.pctDay} step={0.01} />}
      {!due ? (
        <p className="text-sub">{t.empty}</p>
      ) : !r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : r.missing ? (
        <p className="text-sub">{kind === "fiscal" ? t.missingFiscal(r.missing.slice(0, 4)) : t.missingCivil}</p>
      ) : (
        <ResultRows
          rows={[
            [t.days, String(r.days)],
            ...r.parts.map(
              (p) => [`${date(p.from, lang)}–${date(p.to, lang)}: ${t.daysN(p.days)}, ${rate(p)}`, money(p.sum, lang)] as [string, string],
            ),
          ]}
          total={[t.total, money(r.total, lang)]}
        />
      )}
    </div>
  );
}
