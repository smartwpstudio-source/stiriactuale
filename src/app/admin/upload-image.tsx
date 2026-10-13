"use client";

import { useState } from "react";

// Nano Banana din aplicația Magnific dă PNG de câțiva MB; Vercel acceptă max
// 4,5 MB pe cerere, iar pe site nu e nevoie de mai mult de 1600px. Imaginea se
// redimensionează în browser la JPEG înainte de trimitere.
const MAX_WIDTH = 1600;
const MAX_RAW_BYTES = 3.5 * 1024 * 1024; // fără redimensionare (format necunoscut browserului)

async function toJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85));
}

// Încărcarea înlocuiește poza actuală (și la articolele deja publicate); poza
// veche rămâne în Blob. Câmpurile se completează ÎNAINTE de alegerea fișierului.
export function UploadImage({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const fd = new FormData(e.target.form!);
    try {
      fd.set("file", await toJpeg(file), "imagine.jpg");
    } catch {
      // HEIC sau alt format pe care browserul nu-l desenează: fișierul ca atare, dacă e mic
      if (file.size > MAX_RAW_BYTES) {
        setBusy(false);
        setError("Fișierul nu poate fi micșorat în browser și e prea mare — salvează-l ca JPG și încearcă din nou.");
        return;
      }
      fd.set("file", file, file.name);
    }
    try {
      await action(fd);
    } catch (err) {
      // redirect() din acțiune ajunge aici ca eroare specială — o lăsăm să treacă
      if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw err;
      setBusy(false);
      setError("Încărcarea a eșuat. Încearcă din nou.");
    }
  }

  return (
    <form className="flex flex-col gap-1 text-sm">
      {/* poza reală, cu acordul autorului sau a unei instituții: semnătura sub poză */}
      <label className="text-sub">
        Foto (sursa / autorul pozei reale, completează ÎNAINTE de a alege fișierul):{" "}
        <input name="credit" placeholder="ex. IGSU, Poliția, Ion Popescu" className="rounded border border-line px-2 py-1" />
      </label>
      <label className="text-sub">
        Descrierea pozei (opțional, tot ÎNAINTE de fișier; apare sub poză):{" "}
        <input name="alt" placeholder="ex. Igor Grosu la tribuna Parlamentului" className="rounded border border-line px-2 py-1" />
      </label>
      <label className="flex items-center gap-2 text-sub">
        <input type="checkbox" name="simbol" /> imagine simbol (apare „Imagine simbol”; se refolosește la știri pe aceeași temă)
      </label>
      <label className="flex items-center gap-2 text-sub">
        <input type="checkbox" name="ai" defaultChecked /> generată AI (afișează „Imagine generată AI”; ignorat când e completat „Foto” sau e bifat „simbol”)
      </label>
      <label className="text-sub">
        Încarcă poza nouă (înlocuiește poza actuală):{" "}
        <input type="file" name="file" accept="image/*" onChange={onChange} disabled={busy} />
      </label>
      {busy && <span className="text-teal">Se încarcă…</span>}
      {error && <span className="text-alert">{error}</span>}
    </form>
  );
}
