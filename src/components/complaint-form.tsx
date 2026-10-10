"use client";

import { useState, useSyncExternalStore } from "react";
import { IconLanguage, IconLock } from "@tabler/icons-react";
import type { ComplaintLang, Part, Template } from "@/lib/complaint-models";

// Textele interfeței. Scrisoarea în sine e mereu în română (limba în care o
// primesc instituțiile) — în rusă se traduc doar etichetele și butoanele.
const T = {
  ro: {
    privacyStrong: "Datele tale nu pleacă nicăieri.",
    privacy:
      "Tot ce scrii aici, inclusiv IDNP-ul, rămâne doar în telefonul sau calculatorul tău: nu se trimite pe internet și nu se salvează pe site. Când închizi pagina, datele dispar.",
    after: (h: string) => <> — după „{h}”</>,
    letter: "Scrisoarea ta",
    missing: (n: number) => `Câmpuri necompletate: ${n} — rămân în scrisoare între paranteze drepte.`,
    word: "Descarcă Word",
    pdf: "Salvează PDF / Printează",
    copy: "Copiază textul",
    copied: "Copiat ✓",
    pdfHint: "La „Salvează PDF”, alege în fereastra de printare destinația „Salvează ca PDF”.",
  },
  ru: {
    privacyStrong: "Ваши данные никуда не уходят.",
    privacy:
      "Всё, что вы здесь пишете, включая IDNP, остаётся только в вашем телефоне или компьютере: ничего не отправляется в интернет и не сохраняется на сайте. Когда вы закроете страницу, данные исчезнут.",
    after: (h: string) => <> — после «{h}»</>,
    letter: "Текст жалобы (на румынском)",
    missing: (n: number) => `Не заполнено полей: ${n} — в тексте они останутся в квадратных скобках.`,
    word: "Скачать Word",
    pdf: "Сохранить PDF / Распечатать",
    copy: "Копировать текст",
    copied: "Скопировано ✓",
    pdfHint: "Для «Сохранить PDF» выберите в окне печати вариант «Сохранить как PDF».",
  },
};

// Formularul modelului de reclamație: completezi câmpurile, vezi scrisoarea,
// o descarci (Word), o salvezi ca PDF (printare) sau o copiezi. Totul rămâne în
// browser — datele (inclusiv IDNP) nu se trimit nicăieri.
// `explain` (doar în rusă): ce scrie în scrisoare, ca ajutor — nu se depune.
export function ComplaintForm({
  template,
  title,
  lang = "ro",
  explain,
}: {
  template: Template;
  title: string;
  lang?: ComplaintLang;
  explain?: string[];
}) {
  const t = T[lang];
  const [values, setValues] = useState<string[]>(() => template.fields.map(() => ""));
  const [copied, setCopied] = useState(false);
  // data de azi la semnătură — doar în browser (pagina e generată la build);
  // în format românesc, fiindcă intră în scrisoare
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
      <p className="mb-5 flex gap-3 rounded-lg border-2 border-teal/50 bg-white p-4 text-sm leading-relaxed text-ink print:hidden">
        <IconLock size={22} stroke={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
        <span>
          <strong>{t.privacyStrong}</strong> {t.privacy}
        </span>
      </p>
      <form className="space-y-3 print:hidden" onSubmit={(e) => e.preventDefault()}>
        {template.fields.map((f, i) => (
          <label key={i} className="block">
            <span className="inline-block text-sm font-medium text-ink first-letter:uppercase">{f.label}</span>
            {f.hint && <span className="text-sm text-sub">{t.after(f.hint)}</span>}
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
      </form>

      <h2 className="mt-8 font-serif text-xl text-ink print:hidden">{t.letter}</h2>
      {lang === "ru" && (
        <p className="mt-2 flex gap-3 rounded-lg border border-amber/60 bg-white p-3 text-sm leading-relaxed text-ink print:hidden">
          <IconLanguage size={20} stroke={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
          <span>
            Текст жалобы составлен на румынском — официальном языке, на котором её принимают учреждения. Подаётся именно
            этот текст.{explain && " Что в нём написано, объяснено по-русски под кнопками."}
          </span>
        </p>
      )}
      {missing > 0 && <p className="mt-1 text-sm text-sub print:hidden">{t.missing(missing)}</p>}
      <div
        id="complaint-letter"
        lang="ro"
        className="mt-3 space-y-3 rounded border border-line bg-white p-5 font-serif text-[0.95rem] leading-relaxed text-ink print:border-0 print:p-0"
      >
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={downloadWord} className="rounded bg-teal px-4 py-2 text-sm font-medium text-white">
          {t.word}
        </button>
        <button type="button" onClick={() => window.print()} className="rounded border border-teal px-4 py-2 text-sm font-medium text-teal">
          {t.pdf}
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(lines.join("\n\n")).then(() => setCopied(true))}
          className="rounded border border-line px-4 py-2 text-sm font-medium text-ink"
        >
          {copied ? t.copied : t.copy}
        </button>
      </div>
      <p className="mt-2 text-xs text-sub print:hidden">{t.pdfHint}</p>

      {explain && (
        <details className="mt-6 rounded border border-line bg-white p-4 print:hidden">
          <summary className="cursor-pointer font-medium text-ink">Что написано в жалобе — пояснение на русском</summary>
          <p className="mt-2 text-sm text-sub">
            Это пересказ для понимания, а не документ для подачи: подаётся румынский текст выше. В квадратных
            скобках — то, что вы вписываете в поля.
          </p>
          <div className="mt-3 space-y-2 border-l-2 border-line pl-3 text-[0.95rem] leading-relaxed text-ink/90">
            {explain.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
