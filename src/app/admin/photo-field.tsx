"use client";

// Poza atașată la adăugarea linkului: micșorată în browser la JPEG de max
// 1600px (Vercel primește max 4,5 MB pe cerere), pusă înapoi în același câmp.
const MAX_WIDTH = 1600;

export function PhotoField() {
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.85));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], "poza.jpg", { type: "image/jpeg" }));
    input.files = dt.files;
  }
  return <input type="file" name="photo" accept="image/*" onChange={onChange} className="text-sm text-sub" />;
}
