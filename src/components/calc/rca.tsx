"use client";

import { useState } from "react";
import {
  RCA,
  greenCard,
  rcaPremium,
  type GreenTerm,
  type GreenVehicle,
  type GreenZone,
  type RcaDriver,
  type RcaOwner,
  type RcaVehicle,
  type RcaZone,
} from "@/lib/calculators";
import { Choice, ResultRows } from "./fields";
import { T, fixed, money, num, type Lang } from "./i18n";

type Kind = "interna" | "externa";
const keys = <K extends string>(o: Record<K, unknown>) => Object.keys(o) as K[];

export function RcaCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].rca;
  const [kind, setKind] = useState<Kind>("interna");
  const [vehicle, setVehicle] = useState<RcaVehicle>("auto-1600");
  const [zone, setZone] = useState<RcaZone>("chisinau");
  const [owner, setOwner] = useState<RcaOwner>("pf");
  const [driver, setDriver] = useState<RcaDriver>("experimentat");
  const [gZone, setGZone] = useState<GreenZone>("zona3");
  const [gVehicle, setGVehicle] = useState<GreenVehicle>("A");
  const [term, setTerm] = useState<GreenTerm>("15z");
  const euro = (n: number) => `${fixed(n, lang)} €`;
  const k = (n: number) => num(n, lang, 2);
  let body: React.ReactNode;
  if (kind === "interna") {
    const r = rcaPremium(vehicle, zone, owner, driver);
    body = (
      <>
        <Choice label={t.vehicle} value={vehicle} onChange={setVehicle} options={keys(RCA.k1).map((v) => [v, t.vehicles[v]] as [RcaVehicle, string])} />
        <Choice label={t.zone} value={zone} onChange={setZone} options={[["chisinau", t.zones.chisinau], ["alte", t.zones.alte]]} />
        {!r.special && <Choice label={t.owner} value={owner} onChange={setOwner} options={[["pf", t.owners.pf], ["pj", t.owners.pj]]} />}
        {!r.special && owner === "pf" && (
          <Choice label={t.driver} value={driver} onChange={setDriver} options={keys(RCA.k4).map((d) => [d, t.drivers[d]] as [RcaDriver, string])} />
        )}
        <ResultRows
          rows={[
            [t.base, money(RCA.baza, lang)],
            [t.coefs, `${k(r.k1)} × ${k(r.k2)}${r.k3 === 1 ? "" : ` × ${k(r.k3)}`}${r.k4 === 1 ? "" : ` × ${k(r.k4)}`}`],
            [t.trailer, money(r.trailer, lang)],
          ]}
          total={[t.premium, money(r.premium, lang)]}
        />
      </>
    );
  } else {
    const r = greenCard(gZone, gVehicle, term);
    body = (
      <>
        <Choice label={t.gZone} value={gZone} onChange={setGZone} options={[["zona3", t.gZones.zona3], ["zona1", t.gZones.zona1]]} />
        <Choice label={t.vehicle} value={gVehicle} onChange={setGVehicle} options={keys(RCA.externa.k1.zona1).map((v) => [v, t.gVehicles[v]] as [GreenVehicle, string])} />
        <Choice label={t.term} value={term} onChange={setTerm} options={RCA.externa.termene.map((x) => [x, t.terms(x)] as [GreenTerm, string])} />
        <ResultRows rows={[[t.trailer, euro(r.trailer)]]} total={[t.premiumEuro, euro(r.premium)]} />
      </>
    );
  }
  return (
    <div className="grid gap-4">
      <Choice label={t.kind} value={kind} onChange={setKind} options={[["interna", t.kinds.interna], ["externa", t.kinds.externa]]} />
      {body}
      <p className="text-sm text-sub">{t.hint}</p>
    </div>
  );
}
