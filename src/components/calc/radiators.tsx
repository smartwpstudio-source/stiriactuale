"use client";

import { useState } from "react";
import { RADIATOR_TYPICAL, radiatorPower, type Dwelling, type Insulation } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, num, type Lang } from "./i18n";

type YesNo = "da" | "nu";

export function RadiatorsCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].radiator;
  const h = T[lang].heating;
  const [area, setArea] = useState(20);
  const [ceiling, setCeiling] = useState<number>(RADIATOR_TYPICAL.tavan_m);
  const [dwelling, setDwelling] = useState<Dwelling>("apartament");
  const [insulation, setInsulation] = useState<Insulation>("medie");
  const [corner, setCorner] = useState<YesNo>("nu");
  const [windows, setWindows] = useState<YesNo>("nu");
  const [elementW, setElementW] = useState<number>(RADIATOR_TYPICAL.element_w);
  const r = radiatorPower({ area, ceiling, dwelling, insulation, corner: corner === "da", bigWindows: windows === "da", elementW });
  const yesNo: [YesNo, string][] = [["nu", t.yesNo.nu], ["da", t.yesNo.da]];
  return (
    <div className="grid gap-4">
      <NumberField label={t.area} value={area} onChange={setArea} suffix="m²" />
      <NumberField label={t.ceiling} value={ceiling} onChange={setCeiling} suffix="m" step={0.1} />
      <Choice label={h.dwelling} value={dwelling} onChange={setDwelling} options={[["apartament", h.dwellings.apartament], ["casa", h.dwellings.casa]]} />
      <Choice label={h.insulation} value={insulation} onChange={setInsulation} options={[["slaba", h.insulations.slaba], ["medie", h.insulations.medie], ["buna", h.insulations.buna]]} />
      <Choice label={t.corner} value={corner} onChange={setCorner} options={yesNo} />
      <Choice label={t.windows} value={windows} onChange={setWindows} options={yesNo} />
      <NumberField label={t.elementW} value={elementW} onChange={setElementW} suffix="W" step={10} />
      <ResultRows
        rows={[
          [t.elements, r.elements === null ? t.noElement : `${r.elements} ${t.elementsUnit}`],
          [t.boiler, `${num(r.boilerKw, lang, 1)} kW`],
        ]}
        total={[t.total, `${num(r.watts, lang, 0)} W (${num(r.watts / 1000, lang, 1)} kW)`]}
      />
      <p className="text-sm text-sub">{t.hint}</p>
    </div>
  );
}
