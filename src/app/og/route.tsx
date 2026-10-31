import { ImageResponse } from "next/og";
import { font } from "@/lib/og-font";

// Imaginea de distribuire (Facebook, Telegram, X) pentru articolele fără foto:
// titlul pe fundalul site-ului. /og/?t=Titlu&s=Secțiune — URL-ul conține tot
// conținutul, deci răspunsul se poate cache-ui permanent.

// Pe Workers, răspunsul rutei nu intră singur în cache-ul Cloudflare: fără Cache API,
// fiecare distribuire redesena imaginea (~370 ms de procesor, 2026-10-31).
const edge = () => (globalThis as { caches?: { default?: Cache } }).caches?.default;

export async function GET(request: Request) {
  const hit = await edge()?.match(request.url);
  if (hit) return hit;
  const res = await draw(request);
  await edge()?.put(request.url, res.clone());
  return res;
}

async function draw(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = (params.get("t") ?? "Stiri actuale").slice(0, 160);
  const section = (params.get("s") ?? "").slice(0, 40);
  const brand = "ȘTIRIACTUALE";

  const [serif, mono, logo] = await Promise.all([
    font("Fraunces", 500, title),
    font("IBM+Plex+Mono", 500, section.toUpperCase() + "stiriactuale.info"),
    font("Alfa+Slab+One", 400, brand),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#141820",
          padding: "64px 72px",
          color: "#eaeeea",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 26, letterSpacing: 2, color: "#c98d2e" }}>
          {section.toUpperCase()}
        </div>
        <div style={{ display: "flex", fontFamily: "Serif", fontSize: title.length > 90 ? 52 : 64, lineHeight: 1.15 }}>
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {/* logo-ul site-ului: cutia albastră "ȘTIRI·ACTUALE" */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              background: "#0047ab",
              borderRadius: 10,
              padding: "6px 18px 10px",
              fontFamily: "Logo",
              fontSize: 40,
              color: "#fff",
            }}
          >
            ȘTIRI
            <div style={{ width: 12, height: 12, borderRadius: 12, background: "#111", margin: "0 4px 6px" }} />
            ACTUALE
          </div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, color: "#9aa39a" }}>stiriactuale.info</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Serif", data: serif, weight: 500, style: "normal" },
        { name: "Mono", data: mono, weight: 500, style: "normal" },
        { name: "Logo", data: logo, weight: 400, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
