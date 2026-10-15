"use client";

import { useState } from "react";
import { BMI_HEALTHY, bmi } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, num, type Lang } from "./i18n";

export function BmiCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].bmi;
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(170);
  const [age, setAge] = useState(0); // 0 = necompletat
  const r = bmi(kg, cm, age);
  return (
    <div className="grid gap-4">
      <NumberField label={t.kg} value={kg} onChange={setKg} suffix="kg" step={0.5} />
      <NumberField label={t.cm} value={cm} onChange={setCm} suffix="cm" />
      <NumberField label={t.age} value={age} onChange={setAge} suffix={T[lang].yearsUnit} />
      {!r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : (
        <>
          <ResultRows
            rows={
              r.category
                ? [
                    [t.category, t.classes[r.category]],
                    [t.healthy(num(BMI_HEALTHY.min, lang, 1), num(BMI_HEALTHY.max, lang, 1)), `${num(r.minKg, lang, 1)}–${num(r.maxKg, lang, 1)} kg`],
                  ]
                : []
            }
            total={[t.total, num(r.value, lang, 1)]}
          />
          {r.minor && (
            <p role="alert" className="rounded border border-alert bg-white px-4 py-3 text-sm font-medium text-alert">
              {t.minor}
            </p>
          )}
        </>
      )}
    </div>
  );
}
