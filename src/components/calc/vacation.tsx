"use client";

import { useState } from "react";
import { vacationPay, type CalcParams } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, money, type Lang } from "./i18n";

export function VacationCalculator({ p, lang = "ro" }: { p: NonNullable<CalcParams["concediu_odihna"]>; lang?: Lang }) {
  const t = T[lang];
  const [avg, setAvg] = useState(12000);
  const [days, setDays] = useState(p.zile_minime);
  const r = vacationPay(avg, days, p);
  return (
    <div className="grid gap-4">
      <NumberField label={t.vacation.avg} value={avg} onChange={setAvg} suffix={t.lei} step={100} />
      <NumberField label={t.vacation.days} value={days} onChange={setDays} suffix={t.daysUnit} />
      <ResultRows rows={[[t.vacation.daily, money(r.daily, lang)]]} total={[t.vacation.total(days), money(r.total, lang)]} />
    </div>
  );
}
