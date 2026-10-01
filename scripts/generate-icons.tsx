// Generează iconițele site-ului (public/icons/ + public/favicon.ico) din marca
// "Ș" a logo-ului vechi stiriactuale.info: albastru #0047AB, literă albă în
// Alfa Slab One, punctul negru din "ȘTIRI.INFO". Rulează o singură dată, după
// orice schimbare de logo: npx tsx scripts/generate-icons.tsx
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

const PUBLIC = path.join(import.meta.dirname, "..", "public");
const BLUE = "#0047AB";

// Google Fonts dă TTF când browserul cerut e vechi; doar caracterul "Ș".
async function slabFont(): Promise<ArrayBuffer> {
  const css = await (await fetch("https://fonts.googleapis.com/css2?family=Alfa+Slab+One&text=%C8%98")).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("Alfa Slab One indisponibil");
  return (await fetch(url)).arrayBuffer();
}

// scale = cât din latura pătratului ocupă litera (mai mic la "maskable",
// unde Android decupează marginile în cerc sau squircle)
function Mark({ size, scale, radius = 0 }: { size: number; scale: number; radius?: number }) {
  const font = Math.round(size * scale);
  const dot = Math.round(font * 0.2);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BLUE,
        borderRadius: radius,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", marginTop: -Math.round(font * 0.16) }}>
        <span style={{ fontFamily: "Slab", fontSize: font, lineHeight: 1, color: "#fff" }}>Ș</span>
        <span
          style={{
            width: dot,
            height: dot,
            borderRadius: dot,
            background: "#111",
            marginLeft: Math.round(font * 0.04),
            marginBottom: Math.round(font * 0.32),
          }}
        />
      </div>
    </div>
  );
}

async function png(el: React.ReactElement, size: number, font: ArrayBuffer): Promise<Buffer> {
  const res = new ImageResponse(el, { width: size, height: size, fonts: [{ name: "Slab", data: font, weight: 400 }] });
  return Buffer.from(await res.arrayBuffer());
}

// ICO = antet + director + imaginile PNG ca atare (acceptat de toate browserele)
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const dir = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...images.map((i) => i.data)]);
}

async function main() {
  const font = await slabFont();
  await mkdir(path.join(PUBLIC, "icons"), { recursive: true });
  const out = async (name: string, el: React.ReactElement, size: number) => {
    const data = await png(el, size, font);
    await writeFile(path.join(PUBLIC, name), data);
    console.log(`  ${name} (${size}x${size})`);
    return data;
  };

  await out("icons/icon-192.png", <Mark size={192} scale={0.64} />, 192);
  await out("icons/icon-512.png", <Mark size={512} scale={0.64} />, 512);
  await out("icons/icon-maskable-512.png", <Mark size={512} scale={0.48} />, 512);
  await out("icons/apple-touch-icon.png", <Mark size={180} scale={0.62} />, 180);
  const f32 = await out("icons/favicon-32.png", <Mark size={32} scale={0.78} radius={6} />, 32);
  const f48 = await png(<Mark size={48} scale={0.78} radius={9} />, 48, font);
  await writeFile(path.join(PUBLIC, "favicon.ico"), ico([{ size: 32, data: f32 }, { size: 48, data: f48 }]));
  console.log("  favicon.ico (32+48)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
