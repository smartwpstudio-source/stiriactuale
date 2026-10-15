"use client";

import { useState } from "react";
import { firewood, HEAT_NEED_KWH_M2, type Dwelling, type Insulation } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, money, num, type Lang } from "./i18n";

export function FirewoodCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].wood;
  const h = T[lang].heating;
  const [area, setArea] = useState(80);
  const [dwelling, setDwelling] = useState<Dwelling>("casa");
  const [insulation, setInsulation] = useState<Insulation>("medie");
  const [need, setNeed] = useState<number | null>(null); // null = valoarea tipică
  const [months, setMonths] = useState(6);
  const [wood, setWood] = useState(NaN); // fără preț oficial: îl introduce utilizatorul
  const [pellet, setPellet] = useState(NaN);
  const needKwhM2 = need ?? HEAT_NEED_KWH_M2[dwelling][insulation];
  const r = firewood({ area, needKwhM2, months, woodLeiM3: wood, pelletLeiT: pellet });
  return (
    <div className="grid gap-4">
      <NumberField label={h.area} value={area} onChange={setArea} suffix="m²" />
      <Choice label={h.dwelling} value={dwelling} onChange={(d) => (setDwelling(d), setNeed(null))} options={[["casa", h.dwellings.casa], ["apartament", h.dwellings.apartament]]} />
      <Choice
        label={h.insulation}
        value={insulation}
        onChange={(i) => (setInsulation(i), setNeed(null))}
        options={[["slaba", h.insulations.slaba], ["medie", h.insulations.medie], ["buna", h.insulations.buna]]}
      />
      <NumberField label={h.need} value={needKwhM2} onChange={setNeed} suffix={`${T[lang].kwh}/m²`} />
      <NumberField label={h.months} value={months} onChange={setMonths} suffix={h.monthsUnit} />
      <NumberField label={h.wood} value={wood} onChange={setWood} suffix={`${T[lang].lei}/m³`} step={50} />
      <NumberField label={h.pellet} value={pellet} onChange={setPellet} suffix={`${T[lang].lei}/t`} step={100} />
      <ResultRows
        rows={[
          [`${t.woodRow}: ${num(r.woodM3, lang, 1)} ${t.woodUnit}`, r.woodLei === null ? h.noPrice : money(r.woodLei, lang)],
          [`${t.pelletRow}: ${num(r.pelletT, lang, 2)} t (${t.bags(num(r.pelletBags, lang, 0))})`, r.pelletLei === null ? h.noPrice : money(r.pelletLei, lang)],
        ]}
        total={[h.total, `${num(r.need, lang, 0)} ${T[lang].kwh}`]}
      />
    </div>
  );
}
