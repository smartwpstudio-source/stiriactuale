// Generează icoanele PWA statice (public/icons/) din tokenii de design blocați
// (ink #141820, amber #C98D2E — semnătura vizuală: punctul din banda de status).
// Placeholder simplu, geometric, ușor de înlocuit cu un logo real ulterior.
//
// Rulare: npx tsx scripts/generate-icons.tsx

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

const OUT_DIR = path.join(import.meta.dirname, "..", "public", "icons");

const INK = "#141820";
const AMBER = "#C98D2E";

function Mark({ size, dotRatio }: { size: number; dotRatio: number }) {
  const dot = Math.round(size * dotRatio);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: INK,
      }}
    >
      <div
        style={{
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: AMBER,
        }}
      />
    </div>
  );
}

async function renderPng(el: React.ReactElement, size: number, filename: string) {
  const response = new ImageResponse(el, { width: size, height: size });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(OUT_DIR, filename), buffer);
  console.log(`  ${filename} (${size}x${size})`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log("Generare icoane PWA...");

  // purpose "any": punctul poate ocupa mai mult spațiu, nu se aplică mască OS
  await renderPng(<Mark size={192} dotRatio={0.42} />, 192, "icon-192.png");
  await renderPng(<Mark size={512} dotRatio={0.42} />, 512, "icon-512.png");

  // purpose "maskable": zonă de siguranță mai mare (punct mai mic, centrat),
  // ca să nu fie decupat de forma de mască aplicată de OS (cerc/squircle)
  await renderPng(<Mark size={512} dotRatio={0.32} />, 512, "icon-maskable-512.png");

  // apple-touch-icon: fundal opac obligatoriu (iOS ignoră transparența)
  await renderPng(<Mark size={180} dotRatio={0.42} />, 180, "apple-touch-icon.png");

  console.log(`\nGata -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
