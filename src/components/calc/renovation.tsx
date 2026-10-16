"use client";

import { useState } from "react";
import { RENOVATION as R, flooring, paint, tiles, wallpaper } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, num, type Lang } from "./i18n";

type Material = "vopsea" | "gresie" | "tapet" | "parchet";

export function RenovationCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].renovation;
  const [material, setMaterial] = useState<Material>("vopsea");
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.7);
  const [openings, setOpenings] = useState(3.5);
  const [ceiling, setCeiling] = useState<"da" | "nu">("da");
  const [coats, setCoats] = useState<number>(R.straturi);
  const [m2PerL, setM2PerL] = useState<number>(R.vopsea_m2_l);
  const [bucket, setBucket] = useState<number>(R.galeata_l);
  const [reserve, setReserve] = useState<number>(R.rezerva_pct);
  const [area, setArea] = useState(10);
  const [tileW, setTileW] = useState<number>(R.placa_cm[0]);
  const [tileH, setTileH] = useState<number>(R.placa_cm[1]);
  const [perBox, setPerBox] = useState<number>(R.placi_cutie);
  const [rollW, setRollW] = useState<number>(R.rola_latime_m);
  const [rollL, setRollL] = useState<number>(R.rola_lungime_m);
  const [repeat, setRepeat] = useState(0);
  const [pack, setPack] = useState<number>(R.laminat_m2_pachet);
  const [floorReserve, setFloorReserve] = useState<number>(R.laminat_rezerva_pct);
  const n = (x: number, d = 2) => num(x, lang, d);
  const room = (
    <>
      <NumberField label={t.length} value={length} onChange={setLength} suffix={t.u.m} step={0.1} />
      <NumberField label={t.width} value={width} onChange={setWidth} suffix={t.u.m} step={0.1} />
      <NumberField label={t.height} value={height} onChange={setHeight} suffix={t.u.m} step={0.05} />
    </>
  );
  let body: React.ReactNode = null;
  if (material === "vopsea") {
    const r = paint({ length, width, height, openings, ceiling: ceiling === "da", coats, m2PerL, bucketL: bucket, reservePct: reserve });
    body = (
      <>
        {room}
        <NumberField label={t.openings} value={openings} onChange={setOpenings} suffix={t.u.m2} step={0.1} />
        <Choice label={t.ceiling} value={ceiling} onChange={setCeiling} options={[["da", t.yes], ["nu", t.no]]} />
        <NumberField label={t.coats} value={coats} onChange={setCoats} />
        <NumberField label={t.coverage} value={m2PerL} onChange={setM2PerL} suffix={t.u.m2l} step={0.5} />
        <NumberField label={t.bucket} value={bucket} onChange={setBucket} suffix={t.u.l} step={0.5} />
        <NumberField label={t.reserve} value={reserve} onChange={setReserve} suffix="%" />
        {!r ? (
          <p className="text-sub">{t.invalid}</p>
        ) : (
          <ResultRows rows={[[t.paintArea, `${n(r.area)} ${t.u.m2}`], [t.liters, `${n(r.liters)} ${t.u.l}`]]} total={[t.buckets(n(bucket, 1)), r.buckets === null ? "—" : String(r.buckets)]} />
        )}
      </>
    );
  } else if (material === "gresie") {
    const r = tiles(area, tileW, tileH, perBox, reserve);
    body = (
      <>
        <NumberField label={t.area} value={area} onChange={setArea} suffix={t.u.m2} step={0.5} />
        <NumberField label={t.tileW} value={tileW} onChange={setTileW} suffix={t.u.cm} />
        <NumberField label={t.tileH} value={tileH} onChange={setTileH} suffix={t.u.cm} />
        <NumberField label={t.perBox} value={perBox} onChange={setPerBox} />
        <NumberField label={t.reserve} value={reserve} onChange={setReserve} suffix="%" />
        {!r ? (
          <p className="text-sub">{t.invalid}</p>
        ) : (
          <ResultRows
            rows={[[t.withReserve, `${n(r.withReserve)} ${t.u.m2}`], [t.tile, `${n(r.tile, 4)} ${t.u.m2}`], [t.tiles, String(r.count)]]}
            total={[t.boxes, r.boxes === null ? "—" : String(r.boxes)]}
          />
        )}
      </>
    );
  } else if (material === "tapet") {
    const perimeter = 2 * (length + width);
    const r = wallpaper(perimeter, height, rollW, rollL, repeat, R.tapet_adaos_cm);
    body = (
      <>
        {room}
        <NumberField label={t.rollW} value={rollW} onChange={setRollW} suffix={t.u.m} step={0.01} />
        <NumberField label={t.rollL} value={rollL} onChange={setRollL} suffix={t.u.m} step={0.05} />
        <NumberField label={t.repeat} value={repeat} onChange={setRepeat} suffix={t.u.cm} />
        {!r ? (
          <p className="text-sub">{t.invalid}</p>
        ) : (
          <ResultRows
            rows={[[t.perimeter, `${n(perimeter)} ${t.u.m}`], [t.strip, `${n(r.strip)} ${t.u.m}`], [t.strips, String(r.strips)], [t.perRoll, String(r.perRoll)]]}
            total={[t.rolls, String(r.rolls)]}
          />
        )}
      </>
    );
  } else {
    const r = flooring(area, pack, floorReserve);
    body = (
      <>
        <NumberField label={t.area} value={area} onChange={setArea} suffix={t.u.m2} step={0.5} />
        <NumberField label={t.pack} value={pack} onChange={setPack} suffix={t.u.m2} step={0.01} />
        <NumberField label={t.reserve} value={floorReserve} onChange={setFloorReserve} suffix="%" />
        {!r ? <p className="text-sub">{t.invalid}</p> : <ResultRows rows={[[t.withReserve, `${n(r.withReserve)} ${t.u.m2}`]]} total={[t.packs, String(r.packs)]} />}
      </>
    );
  }
  return (
    <div className="grid gap-4">
      <Choice
        label={t.material}
        value={material}
        onChange={setMaterial}
        options={(["vopsea", "gresie", "tapet", "parchet"] as Material[]).map((m) => [m, t.materials[m]] as [Material, string])}
      />
      {body}
      <p className="text-sm text-sub">{t.hints[material]}</p>
    </div>
  );
}
