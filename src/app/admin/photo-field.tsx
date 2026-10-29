"use client";

// Poza (sau pozele, cu `multiple`) atașată la adăugarea linkului: micșorată în browser
// la JPEG de max 1600px (Vercel primește max 4,5 MB pe cerere), pusă înapoi în același câmp.
const MAX_WIDTH = 1600;

async function toJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.85));
  return new File([blob], "poza.jpg", { type: "image/jpeg" });
}

export function PhotoField({ name = "photo", multiple = false }: { name?: string; multiple?: boolean }) {
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = [...(input.files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const dt = new DataTransfer();
    for (const f of await Promise.all(files.map(toJpeg))) dt.items.add(f);
    input.files = dt.files;
  }
  return <input type="file" name={name} accept="image/*" multiple={multiple} onChange={onChange} className="text-sm text-sub" />;
}
