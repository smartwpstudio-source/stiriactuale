"use client";

import Link from "next/link";
import { useState } from "react";
import { LABOUR, overtimePay } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, calcPath, money, num, type Lang } from "./i18n";

export function OvertimeCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].overtime;
  const [mode, setMode] = useState<"lunar" | "orar">("lunar");
  const [salary, setSalary] = useState(15000);
  const [rate, setRate] = useState(90);
  const [norm, setNorm] = useState(168);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeDays, setOvertimeDays] = useState(0);
  const [nightHours, setNightHours] = useState(0);
  const [holidayHours, setHolidayHours] = useState(0);
  const [inNorm, setInNorm] = useState<"da" | "nu">("da");
  const hourly = mode === "lunar" ? (norm > 0 ? salary / norm : 0) : rate;
  const base = mode === "lunar" ? salary : rate * norm;
  const r = overtimePay({ hourly, overtimeHours, overtimeDays, nightHours, holidayHours, holidayInNorm: inNorm === "da" });
  const h = (n: number) => num(n, lang, 1);
  return (
    <div className="grid gap-4">
      <Choice label={t.mode} value={mode} onChange={setMode} options={[["lunar", t.modes.lunar], ["orar", t.modes.orar]]} />
      {mode === "lunar" ? (
        <NumberField label={t.salary} value={salary} onChange={setSalary} suffix={T[lang].lei} step={100} />
      ) : (
        <NumberField label={t.rate} value={rate} onChange={setRate} suffix={`${T[lang].lei}/h`} step={1} />
      )}
      <div>
        <NumberField label={t.norm} value={norm} onChange={setNorm} suffix={t.hoursUnit} />
        <Link prefetch={false} href={calcPath("zile-lucratoare", lang)} className="mt-1 block text-xs text-teal underline">
          {t.normHint}
        </Link>
      </div>
      <NumberField label={t.overtimeHours} value={overtimeHours} onChange={setOvertimeHours} suffix={t.hoursUnit} step={0.5} />
      <NumberField label={t.overtimeDays} value={overtimeDays} onChange={setOvertimeDays} suffix={T[lang].daysUnit} />
      <NumberField label={t.nightHours} value={nightHours} onChange={setNightHours} suffix={t.hoursUnit} step={0.5} />
      <NumberField label={t.holidayHours} value={holidayHours} onChange={setHolidayHours} suffix={t.hoursUnit} step={0.5} />
      <Choice label={t.inNorm} value={inNorm} onChange={setInNorm} options={[["da", t.inNorms.da], ["nu", t.inNorms.nu]]} />
      <ResultRows
        rows={[
          [t.base, money(base, lang)],
          [t.hourly, money(hourly, lang)],
          [t.overtimeRow(h(r.first), h(r.rest)), money(r.overtime, lang)],
          [t.nightRow, money(r.night, lang)],
          [t.holidayRow(inNorm === "da" ? LABOUR.sarbatoare_in_norma : LABOUR.sarbatoare_peste_norma), money(r.holiday, lang)],
          [t.extra, money(r.total, lang)],
        ]}
        total={[t.total, money(base + r.total, lang)]}
      />
      <Link prefetch={false} href={calcPath("salariu-net", lang)} className="text-sm font-medium text-teal underline">
        {t.netLink}
      </Link>
    </div>
  );
}
