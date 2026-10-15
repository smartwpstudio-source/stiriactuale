"use client";

import { useState } from "react";
import { ACTIVITY, calories, type Activity, type Sex } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, num, type Lang } from "./i18n";

export function CaloriesCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].calories;
  const [sex, setSex] = useState<Sex>("f");
  const [age, setAge] = useState(35);
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(168);
  const [activity, setActivity] = useState<Activity>("usor");
  const r = calories(sex, age, kg, cm, activity);
  const kcal = (n: number) => `${num(n, lang, 0)} ${t.kcal}`;
  return (
    <div className="grid gap-4">
      <Choice label={t.sex} value={sex} onChange={setSex} options={[["f", t.sexes.f], ["m", t.sexes.m]]} />
      <NumberField label={t.age} value={age} onChange={setAge} suffix={T[lang].yearsUnit} />
      <NumberField label={t.kg} value={kg} onChange={setKg} suffix="kg" step={0.5} />
      <NumberField label={t.cm} value={cm} onChange={setCm} suffix="cm" />
      <Choice label={t.activity} value={activity} onChange={setActivity} options={ACTIVITY.map((a) => [a.id, t.activities[a.id]] as [Activity, string])} />
      {!r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : (
        <ResultRows
          rows={[
            [t.bmr, kcal(r.bmr)],
            [t.lose, kcal(r.lose)],
            [t.gain, kcal(r.gain)],
          ]}
          total={[t.maintain, kcal(r.maintain)]}
        />
      )}
      {r && r.lose === r.floor && <p className="text-sm text-sub">{t.floor(r.floor)}</p>}
    </div>
  );
}
