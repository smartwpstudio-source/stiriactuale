"use client";

import { useState } from "react";

// Comanda unui comunicat (pagina /comunicate-de-presa/): ajunge la editor în botul de admin.
// Câmpul „site_web” e ascuns: îl completează doar roboții de spam.
export function PressOrderForm() {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/comanda-comunicat/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    setState(res?.ok ? "ok" : "error");
  }
  if (state === "ok") {
    return (
      <p className="mt-4 rounded border-l-4 border-teal bg-white px-4 py-3 text-ink">
        Mulțumim! Am primit comanda. Îți scriem în cel mult o zi lucrătoare, cu factura.
      </p>
    );
  }
  const input = "w-full rounded border border-line bg-white px-3 py-2 text-ink";
  return (
    <form onSubmit={submit} className="not-prose mt-4 space-y-3 rounded-lg border border-line bg-paper p-4">
      <p className="font-semibold text-ink">Trimite comunicatul</p>
      <input name="nume" required maxLength={120} placeholder="Numele tău" className={input} />
      <input name="firma" maxLength={160} placeholder="Firma sau organizația (pentru factură)" className={input} />
      <input name="idno" maxLength={20} placeholder="IDNO (pentru factură, opțional)" className={input} />
      <input name="email" type="email" required maxLength={160} placeholder="E-mail" className={input} />
      <input name="telefon" maxLength={40} placeholder="Telefon" className={input} />
      <input name="titlu" required maxLength={200} placeholder="Titlul comunicatului" className={input} />
      <textarea name="text" required rows={8} maxLength={8000} placeholder="Textul comunicatului" className={input} />
      <input name="link" type="url" maxLength={300} placeholder="Linkul spre site-ul tău (https://…)" className={input} />
      <input name="site_web" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <p className="text-sm text-sub">Poza (sau pozele) ne-o trimiți pe e-mail, după ce îți scriem.</p>
      <button disabled={state === "busy"} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-60">
        {state === "busy" ? "Se trimite…" : "Trimite comanda"}
      </button>
      {state === "error" && <p className="text-sm text-alert">Nu s-a trimis. Încearcă din nou peste un minut.</p>}
    </form>
  );
}
