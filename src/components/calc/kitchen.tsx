"use client";

import { useState } from "react";
import { KITCHEN_G_ML, kitchenMeasure, type KitchenIngredient, type KitchenUnit } from "@/lib/calculators";
import { Choice, NumberField, ResultRows } from "./fields";
import { T, num, type Lang } from "./i18n";

export function KitchenCalculator({ lang = "ro" }: { lang?: Lang }) {
  const t = T[lang].kitchen;
  const [ingredient, setIngredient] = useState<KitchenIngredient>("faina");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<KitchenUnit | "g">("pahar250");
  const r = kitchenMeasure(ingredient, qty, unit);
  const units = Object.keys(t.units) as (KitchenUnit | "g")[];
  return (
    <div className="grid gap-4">
      <Choice
        label={t.ingredient}
        value={ingredient}
        onChange={setIngredient}
        options={(Object.keys(KITCHEN_G_ML) as KitchenIngredient[]).map((k) => [k, t.ingredients[k]] as [KitchenIngredient, string])}
      />
      <NumberField label={t.qty} value={qty} onChange={setQty} step={unit === "g" ? 10 : 0.5} />
      <Choice label={t.unit} value={unit} onChange={setUnit} options={units.map((u) => [u, t.units[u]] as [KitchenUnit | "g", string])} />
      {!r ? (
        <p className="text-sub">{t.invalid}</p>
      ) : (
        <ResultRows
          rows={r.units.filter((u) => u.id !== unit && !(unit === "g" && u.id === "ml")).map((u) => [t.units[u.id], num(u.qty, lang, u.qty < 10 ? 2 : 1)] as [string, string])}
          total={[unit === "g" ? t.volume : t.grams, unit === "g" ? `${num(r.ml, lang, 0)} ${t.ml}` : `${num(r.grams, lang, r.grams < 10 ? 1 : 0)} ${t.g}`]}
        />
      )}
    </div>
  );
}
