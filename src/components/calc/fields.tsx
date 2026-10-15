"use client";

// Câmpuri și rânduri de rezultat comune calculatoarelor (sumele: money() din i18n.ts).

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <span className="mt-1 flex items-center rounded border border-line bg-white focus-within:border-teal">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-3 py-2.5 text-lg text-ink outline-none"
        />
        {suffix && <span className="px-3 font-mono text-sm text-sub">{suffix}</span>}
      </span>
    </label>
  );
}

export function ResultRows({ rows, total }: { rows: [string, string][]; total: [string, string] }) {
  return (
    <div className="mt-6 rounded-lg border border-line bg-white">
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-[0.95rem]">
            <dt className="text-sub">{k}</dt>
            {/* sumele nu se rup pe rânduri; textele lungi (regula de calcul) da — altfel ies din ecran pe mobil */}
            <dd className={`font-mono text-ink ${v.length > 24 ? "min-w-0 text-right" : "shrink-0 whitespace-nowrap"}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between gap-4 rounded-b-lg bg-teal px-4 py-3 text-white">
        <span className="font-medium">{total[0]}</span>
        <span className="shrink-0 whitespace-nowrap font-mono text-lg font-semibold">{total[1]}</span>
      </div>
    </div>
  );
}

// Alegere între câteva variante (butoane, ca la tipul ratelor) sau, cu multe variante, listă.
export function Choice<K extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: K;
  options: [K, string][];
  onChange: (k: K) => void;
}) {
  if (options.length > 4)
    return (
      <label className="block">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as K)}
          className="mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-ink outline-none focus:border-teal"
        >
          {options.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
    );
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-ink">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={value === id}
            className={`rounded px-3 py-1.5 text-sm ${value === id ? "bg-ink text-white" : "border border-line text-ink"}`}
          >
            {name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
