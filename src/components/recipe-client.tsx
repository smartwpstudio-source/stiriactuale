"use client";

import { useEffect, useRef, useState } from "react";
import { IconMinus, IconPlus, IconPrinter } from "@tabler/icons-react";
import type { Ingredient } from "@/lib/content/recipes";

// "500", "0,5", "1/2", "1 1/2" → număr; altceva ("după gust") → NaN
function parseNum(s: string): number {
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return /^\d+([.,]\d+)?$/.test(s) ? Number(s.replace(",", ".")) : NaN;
}

const FRACTIONS: [number, string][] = [[0, ""], [1 / 4, "1/4"], [1 / 3, "1/3"], [1 / 2, "1/2"], [2 / 3, "2/3"], [3 / 4, "3/4"], [1, ""]];

function formatNum(n: number): string {
  if (n >= 10) return String(Math.round(n));
  const whole = Math.floor(n);
  const [f, label] = FRACTIONS.reduce((best, c) => (Math.abs(n - whole - c[0]) < Math.abs(n - whole - best[0]) ? c : best));
  if (Math.abs(n - whole - f) > 0.05) return String(Math.round(n * 10) / 10).replace(".", ",");
  const w = whole + (f === 1 ? 1 : 0);
  if (!label) return String(w);
  return w ? `${w} ${label}` : label;
}

// Cantitatea pentru alt număr de porții; intervalele ("2-3") pe ambele capete,
// textul nenumeric rămâne neschimbat.
export function scaleQty(qty: string, factor: number): string {
  if (factor === 1) return qty;
  const parts = qty.trim().split(/\s*[-–]\s*/);
  const nums = parts.map(parseNum);
  if (nums.some(Number.isNaN)) return qty;
  return nums.map((n) => formatNum(n * factor)).join("–");
}

type Labels = { ingredients: string; servings: string; less: string; more: string };

// Ingredientele bifabile (starea în localStorage, pe rețetă) + selectorul de porții.
// Bifele sunt necontrolate: citite/scrise direct din DOM, fără re-randare.
export function RecipeIngredients({
  slug,
  servings,
  groups,
  labels,
}: {
  slug: string;
  servings: number;
  groups: { group?: string; items: Ingredient[] }[];
  labels: Labels;
}) {
  const [n, setN] = useState(servings);
  const list = useRef<HTMLDivElement>(null);
  const key = `reteta:${slug}`;

  useEffect(() => {
    try {
      const saved = new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]"));
      list.current?.querySelectorAll<HTMLInputElement>("input[type=checkbox]").forEach((i) => (i.checked = saved.has(i.value)));
    } catch {}
  }, [key]);

  const save = () => {
    try {
      const checked = [...(list.current?.querySelectorAll<HTMLInputElement>("input:checked") ?? [])].map((i) => i.value);
      localStorage.setItem(key, JSON.stringify(checked));
    } catch {}
  };

  const btn = "flex h-9 w-9 items-center justify-center rounded border border-line bg-white text-ink hover:border-amber disabled:opacity-40";
  return (
    <section className="mt-10" aria-labelledby="ingrediente">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-2">
        <h2 id="ingrediente" className="font-serif text-2xl text-ink">{labels.ingredients}</h2>
        <div className="flex items-center gap-2 font-mono text-sm text-sub">
          <button type="button" className={`${btn} print:hidden`} onClick={() => setN((x) => Math.max(1, x - 1))} disabled={n <= 1} aria-label={labels.less}>
            <IconMinus size={16} />
          </button>
          <span className="min-w-[6.5rem] text-center text-ink" aria-live="polite">
            {n} {labels.servings}
          </span>
          <button type="button" className={`${btn} print:hidden`} onClick={() => setN((x) => Math.min(99, x + 1))} disabled={n >= 99} aria-label={labels.more}>
            <IconPlus size={16} />
          </button>
        </div>
      </div>
      <div ref={list} onChange={save}>
        {groups.map((g, gi) => (
          <div key={gi} className="mt-4">
            {g.group && <h3 className="font-mono text-xs uppercase tracking-wide text-amber-ink">{g.group}</h3>}
            <ul className="mt-1 divide-y divide-line rounded border border-line bg-white print:border-0">
              {g.items.map((it, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
                    <input type="checkbox" value={`${gi}-${i}`} className="peer mt-1 h-4 w-4 shrink-0 accent-teal" />
                    <span className="text-ink peer-checked:text-sub peer-checked:line-through">
                      {it.qty && <strong className="font-medium">{scaleQty(it.qty, n / servings)} </strong>}
                      {it.unit && <strong className="font-medium">{it.unit} </strong>}
                      {it.name}
                      {it.note && <span className="text-sub">, {it.note}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-amber print:hidden"
    >
      <IconPrinter size={18} stroke={1.75} aria-hidden />
      {label}
    </button>
  );
}
