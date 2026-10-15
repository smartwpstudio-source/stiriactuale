"use client";

import { useState } from "react";
import {
  ENERGY,
  HEAT_NEED_KWH_M2,
  heatingCost,
  type Dwelling,
  type HeatSupplier,
  type Insulation,
  type PowerSupplier,
} from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, money, num, type Lang } from "./i18n";

export function HeatingCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].heating;
  const [area, setArea] = useState(60);
  const [dwelling, setDwelling] = useState<Dwelling>("apartament");
  const [insulation, setInsulation] = useState<Insulation>("medie");
  const [need, setNeed] = useState<number | null>(null); // null = valoarea tipică
  const [months, setMonths] = useState(6);
  const [heat, setHeat] = useState<HeatSupplier>("termoelectrica");
  const [power, setPower] = useState<PowerSupplier>("premier");
  const [wood, setWood] = useState(NaN); // fără preț oficial: îl introduce utilizatorul
  const [pellet, setPellet] = useState(NaN);
  const needKwhM2 = need ?? HEAT_NEED_KWH_M2[dwelling][insulation];
  const r = heatingCost({ area, needKwhM2, months, heat, power, woodLeiM3: wood, pelletLeiT: pellet });
  const pickDwelling = (d: Dwelling) => (setDwelling(d), setNeed(null));
  const pickInsulation = (i: Insulation) => (setInsulation(i), setNeed(null));
  return (
    <div className="grid gap-4">
      <NumberField label={t.area} value={area} onChange={setArea} suffix="m²" />
      <Choice label={t.dwelling} value={dwelling} onChange={pickDwelling} options={[["apartament", t.dwellings.apartament], ["casa", t.dwellings.casa]]} />
      <Choice
        label={t.insulation}
        value={insulation}
        onChange={pickInsulation}
        options={[["slaba", t.insulations.slaba], ["medie", t.insulations.medie], ["buna", t.insulations.buna]]}
      />
      <NumberField label={t.need} value={needKwhM2} onChange={setNeed} suffix={`${T[lang].kwh}/m²`} />
      <NumberField label={t.months} value={months} onChange={setMonths} suffix={t.monthsUnit} />
      <Choice label={t.heat} value={heat} onChange={setHeat} options={ENERGY.caldura.map((c) => [c.id, `${t.heatSuppliers[c.id]} — ${num(c.lei_gcal, lang)} ${T[lang].lei}/Gcal`] as [HeatSupplier, string])} />
      <Choice label={t.power} value={power} onChange={setPower} options={[["premier", T[lang].power.suppliers.premier], ["fee-nord", T[lang].power.suppliers["fee-nord"]]]} />
      <NumberField label={t.wood} value={wood} onChange={setWood} suffix={`${T[lang].lei}/m³`} step={50} />
      <NumberField label={t.pellet} value={pellet} onChange={setPellet} suffix={`${T[lang].lei}/t`} step={100} />
      <ResultRows
        rows={r.options.map(
          (o) =>
            [
              `${t.options[o.id]} (${num(o.qty, lang, o.unit === "kwh" ? 0 : 1)} ${t.units[o.unit]})`,
              o.lei === null ? t.noPrice : `${money(o.lei, lang)} · ${money(months > 0 ? o.lei / months : 0, lang)}${t.perMonth}`,
            ] as [string, string],
        )}
        total={[t.total, `${num(r.need, lang, 0)} ${T[lang].kwh}`]}
      />
    </div>
  );
}
