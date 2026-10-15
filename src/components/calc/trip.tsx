"use client";

import { useState } from "react";
import { FUEL, tripCost, type Fuel } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, date, money, num, type Lang } from "./i18n";

export function TripCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].trip;
  const [km, setKm] = useState(200);
  const [route, setRoute] = useState<"dus" | "tur">("tur");
  const [consumption, setConsumption] = useState(7);
  const [fuel, setFuel] = useState<Fuel>("benzina");
  const [price, setPrice] = useState<number | null>(null); // null = prețul maxim ANRE (GPL: fără preț)
  const [passengers, setPassengers] = useState(1);
  const [extra, setExtra] = useState(0);
  const p = price ?? (fuel === "gpl" ? NaN : FUEL[fuel]);
  const r = tripCost({ km, roundTrip: route === "tur", lPer100: consumption, price: p, passengers, extra });
  return (
    <div className="grid gap-4">
      <NumberField label={t.km} value={km} onChange={setKm} suffix="km" step={10} />
      <Choice label={t.route} value={route} onChange={setRoute} options={[["dus", t.routes.dus], ["tur", t.routes.tur]]} />
      <NumberField label={t.consumption} value={consumption} onChange={setConsumption} suffix="l/100 km" step={0.1} />
      <Choice
        label={t.fuel}
        value={fuel}
        onChange={(f) => (setFuel(f), setPrice(null))}
        options={[["benzina", t.fuels.benzina], ["motorina", t.fuels.motorina], ["gpl", t.fuels.gpl]]}
      />
      <div>
        <NumberField label={t.price} value={p} onChange={setPrice} suffix={`${T[lang].lei}/l`} step={0.01} />
        <span className="mt-1 block text-xs text-sub">{fuel === "gpl" ? t.gplHint : t.priceHint(date(FUEL.de_la, lang))}</span>
      </div>
      <NumberField label={t.passengers} value={passengers} onChange={setPassengers} />
      <NumberField label={t.extra} value={extra} onChange={setExtra} suffix={T[lang].lei} step={10} />
      <ResultRows
        rows={[
          [t.distance, `${num(r.km, lang)} km`],
          [t.liters, `${num(r.liters, lang, 1)} l`],
          [t.fuelCost, r.fuel === null ? t.noPrice : money(r.fuel, lang)],
          [t.extraRow, money(extra, lang)],
          [t.total, r.total === null ? t.noPrice : money(r.total, lang)],
        ]}
        total={[t.perPerson(r.people), r.perPerson === null ? t.noPrice : money(r.perPerson, lang)]}
      />
    </div>
  );
}
