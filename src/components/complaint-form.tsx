"use client";

import { useState, useSyncExternalStore } from "react";
import type { Part, Template } from "@/lib/complaint-models";

// Formularul modelului de reclamație: completezi câmpurile, vezi scrisoarea,
// o descarci (Word), o salvezi ca PDF (printare) sau o copiezi. Totul rămâne în
// browser — datele (inclusiv IDNP) nu se trimit nicăieri.
export function ComplaintForm({ template, title }: { template: Template; title: string }) {
  const [values, setValues] = useState<string[]>(() => template.fields.map(() => ""));
  const [copied, setCopied] = useState(false);
  // data de azi la semnătură — doar în browser (pagina e generată la build)
  const today = useSyncExternalStore(
    () => () => {},
    () => new Date().toLocaleDateString("ro-MD"),
    () => "",
  );

  const fill = (p: Part) =>
    typeof p === "string" ? p : values[p.field].trim() || (template.fields[p.field].today && today) || `[${p.label}]`;
  const lines = template.paragraphs.map((ps) => ps.map(fill).join("").replace(/\s+/g, " ").trim());
  const missing = values.filter((v) => !v.trim()).length;

  const set = (i: number, v: string) => setValues((old) => old.map((x, k) => (k === i ? v : x)));

  function downloadWord() {
    // Word deschide direct HTML-ul salvat ca .doc — fără bibliotecă
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const html = `<html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="font-family:'Times New Roman';font-size:12pt">${lines.map((l) => `<p>${esc(l)}</p>`).join("")}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿", html], { type: "application/msword" }));
    a.download = "reclamatie.doc";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <form className="space-y-3 print:hidden" onSubmit={(e) => e.preventDefault()}>
        {template.fields.map((f, i) => (
          <label key={i} className="block">
            <span className="inline-block text-sm font-medium text-ink first-letter:uppercase">{f.label}</span>
            {f.hint && <span className="text-sm text-sub"> — după „{f.hint}”</span>}
            {f.long ? (
              <textarea
                rows={3}
                value={values[i]}
                onChange={(e) => set(i, e.target.value)}
                className="mt-1 w-full rounded border border-line bg-white p-2 text-ink"
              />
            ) : (
              <input
                value={values[i]}
                placeholder={f.today ? today : undefined}
                onChange={(e) => set(i, e.target.value)}
                className="mt-1 w-full rounded border border-line bg-white p-2 text-ink"
              />
            )}
          </label>
        ))}
        <p className="text-xs text-sub">
          Datele rămân doar pe dispozitivul tău: nu se trimit și nu se salvează nicăieri.
        </p>
      </form>

      <h2 className="mt-8 font-serif text-xl text-ink print:hidden">Scrisoarea ta</h2>
      {missing > 0 && (
        <p className="mt-1 text-sm text-sub print:hidden">
          Câmpuri necompletate: {missing} — rămân în scrisoare între paranteze drepte.
        </p>
      )}
      <div id="complaint-letter" className="mt-3 space-y-3 rounded border border-line bg-white p-5 font-serif text-[0.95rem] leading-relaxed text-ink print:border-0 print:p-0">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={downloadWord} className="rounded bg-teal px-4 py-2 text-sm font-medium text-white">
          Descarcă Word
        </button>
        <button type="button" onClick={() => window.print()} className="rounded border border-teal px-4 py-2 text-sm font-medium text-teal">
          Salvează PDF / Printează
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(lines.join("\n\n")).then(() => setCopied(true))}
          className="rounded border border-line px-4 py-2 text-sm font-medium text-ink"
        >
          {copied ? "Copiat ✓" : "Copiază textul"}
        </button>
      </div>
      <p className="mt-2 text-xs text-sub print:hidden">
        La „Salvează PDF”, alege în fereastra de printare destinația „Salvează ca PDF”.
      </p>
    </div>
  );
}
