"use client";

import { useState, useSyncExternalStore } from "react";
import { addWorkingDays, workingDays } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, date, monthName, type Lang } from "./i18n";

// „azi” la Chișinău, calculat în browser: pagina stă în cache, pe server data ar îngheța
const noop = () => () => {};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });
const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

const input = "mt-1 w-full rounded border border-line bg-white px-3 py-2 text-ink outline-none focus:border-teal";

type Mode = "luna" | "interval" | "termen";

export function WorkdaysCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].workdays;
  const now = useSyncExternalStore(noop, today, () => "");
  const [mode, setMode] = useState<Mode>("luna");
  const [month, setMonth] = useState<number | null>(null); // null = luna curentă
  const [year, setYear] = useState<number | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [start, setStart] = useState("");
  const [n, setN] = useState(10);
  const y = year ?? (now ? Number(now.slice(0, 4)) : 2026);
  const m = month ?? (now ? Number(now.slice(5, 7)) : 1);
  const range: [string, string] =
    mode === "luna" ? [`${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(lastDay(y, m))}`] : [from || now, to || now];
  const r = mode === "termen" || y < 1900 || y > 2099 ? null : workingDays(...range);
  const deadline = mode === "termen" ? addWorkingDays(start || now, n) : null;
  return (
    <div className="grid gap-4">
      <Choice label={t.mode} value={mode} onChange={setMode} options={[["luna", t.modes.luna], ["interval", t.modes.interval], ["termen", t.modes.termen]]} />
      {mode === "luna" && (
        <>
          <Choice
            label={t.month}
            value={String(m)}
            onChange={(v) => setMonth(Number(v))}
            options={Array.from({ length: 12 }, (_, i) => [String(i + 1), monthName(i + 1, lang)] as [string, string])}
          />
          <NumberField label={t.year} value={y} onChange={setYear} />
        </>
      )}
      {mode === "interval" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block min-w-0 text-sm text-sub">
            {t.from}
            <input type="date" value={from || now} onChange={(e) => setFrom(e.target.value)} className={input} />
          </label>
          <label className="block min-w-0 text-sm text-sub">
            {t.to}
            <input type="date" value={to || now} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={input} />
          </label>
        </div>
      )}
      {mode === "termen" && (
        <>
          <label className="block">
            <span className="block text-sm font-medium text-ink">{t.start}</span>
            <input type="date" value={start || now} onChange={(e) => setStart(e.target.value)} className={input} />
          </label>
          <NumberField label={t.n} value={n} onChange={setN} suffix={T[lang].daysUnit} />
          {deadline && (
            <ResultRows rows={[]} total={[t.deadline, date(deadline, lang)]} />
          )}
          <p className="text-sm text-sub">{t.deadlineHint}</p>
        </>
      )}
      {mode !== "termen" &&
        (!r ? (
          now && <p className="text-sub">{t.invalid}</p>
        ) : (
          <ResultRows
            rows={[
              [t.calendar, String(r.calendar)],
              ...r.holidays.map((h) => [`${t.holidays}: ${t.names[h.id]}`, date(h.date, lang)] as [string, string]),
              ...r.transfers.map((x) => [`${t.transfers} (${x.act})`, `${date(x.date, lang)} — ${x.off ? t.transferOff : t.transferWork}`] as [string, string]),
              [t.short, String(r.short)],
              [t.hours, String(r.hours)],
            ]}
            total={[t.total, String(r.work)]}
          />
        ))}
    </div>
  );
}
