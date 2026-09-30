"use client";

import { useState } from "react";

// Nano Banana din aplicația Magnific dă PNG de câțiva MB; Vercel acceptă max
// 4,5 MB pe cerere, iar pe site nu e nevoie de mai mult de 1600px. Imaginea se
// redimensionează în browser la JPEG înainte de trimitere.
const MAX_WIDTH = 1600;

export function UploadImage({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.85));

    const fd = new FormData(e.target.form!);
    fd.set("file", blob, "imagine.jpg");
    await action(fd);
  }

  return (
    <form className="flex flex-col gap-1 text-sm">
      <label className="text-sub">
        Încarcă imagine (ex. generată cu Nano Banana):{" "}
        <input type="file" name="file" accept="image/*" onChange={onChange} disabled={busy} />
      </label>
      <label className="flex items-center gap-2 text-sub">
        <input type="checkbox" name="ai" defaultChecked /> generată AI (afișează „Imagine generată AI”)
      </label>
      {busy && <span className="text-teal">Se încarcă…</span>}
    </form>
  );
}
