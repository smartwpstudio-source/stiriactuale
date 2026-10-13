"use client";

import { useState } from "react";
import { eventPortions } from "@/lib/calculators";
import { NumberField, ResultRows } from "./fields";
import { T, num, type Lang } from "./i18n";

export function PortionsCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].portions;
  const [adults, setAdults] = useState(80);
  const [children, setChildren] = useState(10);
  const [reserve, setReserve] = useState(5);
  const r = eventPortions(adults, children, reserve);
  const range = (a: number, b: number, u: string) => `${a === b ? num(a, lang, 1) : `${num(a, lang, 1)}–${num(b, lang, 1)}`} ${t.units[u]}`;
  return (
    <div className="grid gap-4">
      <NumberField label={t.adults} value={adults} onChange={setAdults} />
      <NumberField label={t.children} value={children} onChange={setChildren} />
      <NumberField label={t.reserve} value={reserve} onChange={setReserve} />
      <ResultRows
        rows={r.items.map((x) => [t.items[x.id], range(x.from, x.to, x.unit)] as [string, string])}
        total={[t.portions, String(r.portions)]}
      />
    </div>
  );
}
