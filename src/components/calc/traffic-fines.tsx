"use client";

import { useState } from "react";
import { TRAFFIC_FINES, UC_LEI, fineLei } from "@/lib/calculators";
import { stripDiacritics } from "@/lib/pipeline/text-normalize";
import { T, num, type Lang } from "./i18n";

const norm = (s: string) => stripDiacritics(s).toLowerCase();

export function TrafficFinesCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].fines;
  const [q, setQ] = useState("");
  const lei = (n: number) => `${num(n, lang, 0)} ${T[lang].lei}`;
  // fiecare cuvânt căutat, fără ultima literă („viteza” găsește „vitezei”)
  const words = norm(q).split(/\s+/).filter(Boolean).map((w) => (w.length > 4 ? w.slice(0, -1) : w));
  const list = TRAFFIC_FINES.filter((f) => words.every((w) => norm(`${t.items[f.id]} ${f.art}`).includes(w)));
  return (
    <div className="grid gap-4">
      <label className="block">
        <span className="block text-sm font-medium text-ink">{t.search}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          className="mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-ink outline-none focus:border-teal"
        />
      </label>
      <p className="text-sm text-sub">{t.uc(UC_LEI)}</p>
      {list.length === 0 && <p className="text-sub">{t.none}</p>}
      <ul className="grid gap-3">
        {list.map((f) => {
          const l = fineLei(f);
          return (
            <li key={f.id} className="rounded-lg border border-line bg-white p-4">
              <p className="font-medium text-ink">{t.items[f.id]}</p>
              <p className="mt-0.5 font-mono text-xs text-sub">{t.code(f.art)}</p>
              <dl className="mt-3 grid gap-1 text-[0.95rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-sub">{t.fine}</dt>
                  <dd className="text-right font-mono text-ink">
                    {f.warning ? `${t.warning} ${t.or} ` : ""}
                    {lei(l.min)} – {lei(l.max)} <span className="text-sub">({f.min}–{f.max} {t.ucShort})</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-sub">{t.half}</dt>
                  <dd className="text-right font-mono text-ink">
                    {lei(l.halfMin)} – {lei(l.halfMax)}
                  </dd>
                </div>
                {f.points && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-sub">{t.points}</dt>
                    <dd className="font-mono text-ink">{f.points}</dd>
                  </div>
                )}
              </dl>
              {f.extra && <p className="mt-2 text-sm text-alert">{t.extra[f.id]}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
