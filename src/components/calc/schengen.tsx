"use client";

import { useState, useSyncExternalStore } from "react";
import { schengenDays, type Trip } from "@/lib/calculators";
import { ResultRows } from "./fields";
import { T, date, type Lang } from "./i18n";

// „azi” la Chișinău, calculat în browser: pagina stă în cache, pe server data ar îngheța
const noop = () => () => {};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });

const input = "mt-1 w-full rounded border border-line bg-white px-3 py-2 text-ink outline-none focus:border-teal";

export function SchengenCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].schengen;
  const now = useSyncExternalStore(noop, today, () => "");
  const [trips, setTrips] = useState<Trip[]>([{ from: "", to: "" }]);
  const [control, setControl] = useState(""); // gol = azi
  const at = control || now;
  const r = at ? schengenDays(trips, at) : null;
  const edit = (i: number, k: keyof Trip, v: string) => setTrips(trips.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-3">
        <legend className="mb-1 block text-sm font-medium text-ink">{t.trips}</legend>
        {trips.map((x, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <label className="block min-w-0 text-sm text-sub">
              {t.from}
              <input type="date" value={x.from} onChange={(e) => edit(i, "from", e.target.value)} className={input} />
            </label>
            <label className="block min-w-0 text-sm text-sub">
              {t.to}
              <input type="date" value={x.to} min={x.from || undefined} onChange={(e) => edit(i, "to", e.target.value)} className={input} />
            </label>
            <button
              type="button"
              onClick={() => setTrips(trips.length > 1 ? trips.filter((_, j) => j !== i) : [{ from: "", to: "" }])}
              className="rounded border border-line px-2 py-2 text-sm text-ink"
              aria-label={`${t.remove} ${i + 1}`}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setTrips([...trips, { from: "", to: "" }])} className="justify-self-start text-sm font-medium text-teal">
          {t.add}
        </button>
      </fieldset>
      <label className="block">
        <span className="block text-sm font-medium text-ink">{t.control}</span>
        <input type="date" value={at} onChange={(e) => setControl(e.target.value)} className={input} />
        <span className="mt-1 block text-xs text-sub">{t.controlHint}</span>
      </label>
      {r && (
        <>
          <ResultRows
            rows={[
              [t.window, `${date(r.windowStart, lang)} – ${date(at, lang)}`],
              [t.used, String(r.used)],
            ]}
            total={[t.remaining, String(r.remaining)]}
          />
          {r.over && (
            <p role="alert" className="rounded border border-alert bg-white px-4 py-3 font-medium text-alert">
              {t.over(r.used - 90)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
