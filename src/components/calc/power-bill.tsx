"use client";

import { useState } from "react";
import { applianceUse, ENERGY, powerBill, type PowerSupplier } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, money, num, type Lang } from "./i18n";

// Puteri și ore tipice — valori orientative, nu oficiale (puterea reală e pe eticheta aparatului).
const APPLIANCES = [
  { id: "boiler", w: 2000, h: 3 },
  { id: "calorifer", w: 2000, h: 6 },
  { id: "aer", w: 1000, h: 6 },
  { id: "frigider", w: 50, h: 24 },
  { id: "spalat", w: 1000, h: 1 },
  { id: "cuptor", w: 2000, h: 1 },
  { id: "fierbator", w: 2000, h: 0.25 },
  { id: "televizor", w: 100, h: 4 },
  { id: "bec", w: 10, h: 5 },
] as const;
type Appliance = (typeof APPLIANCES)[number]["id"];

export function PowerBillCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].power;
  const kwhUnit = T[lang].kwh;
  const [supplier, setSupplier] = useState<PowerSupplier>("premier");
  const [tariff, setTariff] = useState<"unic" | "ore">("unic");
  const [kwh, setKwh] = useState(150);
  const [night, setNight] = useState(50);
  const [app, setApp] = useState<Appliance>("boiler");
  const [watts, setWatts] = useState<number>(APPLIANCES[0].w);
  const [hours, setHours] = useState<number>(APPLIANCES[0].h);
  const [days, setDays] = useState(30);
  const p = ENERGY.curent[supplier];
  const bill = powerBill(supplier, kwh, tariff === "ore" ? night : null);
  const use = applianceUse(watts, hours, days, p.lei_kwh);
  const lei = T[lang].lei;
  const pick = (id: Appliance) => {
    const a = APPLIANCES.find((x) => x.id === id)!;
    setApp(id);
    setWatts(a.w);
    setHours(a.h);
  };
  return (
    <div className="grid gap-4">
      <Choice label={t.supplier} value={supplier} onChange={setSupplier} options={[["premier", t.suppliers.premier], ["fee-nord", t.suppliers["fee-nord"]]]} />
      <Choice label={t.tariff} value={tariff} onChange={setTariff} options={[["unic", t.tariffs.unic], ["ore", t.tariffs.ore]]} />
      {tariff === "ore" && <p className="text-sm text-sub">{t.oreHint}</p>}
      <NumberField label={tariff === "ore" ? t.dayKwh : t.kwh} value={kwh} onChange={setKwh} suffix={kwhUnit} />
      {tariff === "ore" && <NumberField label={t.nightKwh} value={night} onChange={setNight} suffix={kwhUnit} />}
      <ResultRows
        rows={
          tariff === "ore"
            ? [
                [t.priceDay, `${num(p.zi, lang)} ${lei}/${kwhUnit}`],
                [t.priceNight, `${num(p.noapte, lang)} ${lei}/${kwhUnit}`],
              ]
            : [[t.price, `${num(p.lei_kwh, lang)} ${lei}/${kwhUnit}`]]
        }
        total={[t.total, money(bill.total, lang)]}
      />

      <h2 className="mt-6 font-serif text-xl text-ink">{t.appTitle}</h2>
      <p className="text-sm text-sub">{t.appHint}</p>
      <Choice label={t.appliance} value={app} onChange={pick} options={APPLIANCES.map((a) => [a.id, t.appliances[a.id]] as [Appliance, string])} />
      <NumberField label={t.watts} value={watts} onChange={setWatts} suffix="W" step={10} />
      <NumberField label={t.hours} value={hours} onChange={setHours} suffix={t.hoursUnit} step={0.25} />
      <NumberField label={t.days} value={days} onChange={setDays} suffix={T[lang].daysUnit} />
      <ResultRows rows={[[t.appKwh, `${num(use.kwh, lang)} ${kwhUnit}`]]} total={[t.appCost, money(use.lei, lang)]} />
    </div>
  );
}
