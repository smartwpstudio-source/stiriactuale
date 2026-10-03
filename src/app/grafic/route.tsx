import { ImageResponse } from "next/og";
import { font } from "@/lib/og-font";

// Grafice proprii pentru știrile fără poză reală potrivită: avertizări meteo
// (cod galben / portocaliu / roșu), alertă 112, escrocherie, fals, alertă
// aeriană, cutremur. Desenate de noi — fără drepturi de autor de rezolvat.
// /grafic/?n=galben&t=Caniculă — folosite din arhiva de locuri (content/locuri).
const STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  galben: { bg: "#f2c200", fg: "#141820", label: "COD GALBEN" },
  portocaliu: { bg: "#ef7d00", fg: "#141820", label: "COD PORTOCALIU" },
  rosu: { bg: "#c8102e", fg: "#ffffff", label: "COD ROȘU" },
  alerta: { bg: "#c8102e", fg: "#ffffff", label: "ALERTĂ" },
  frauda: { bg: "#141820", fg: "#f2c200", label: "ATENȚIE" },
  fals: { bg: "#141820", fg: "#ff4d4d", label: "FALS" },
  aerian: { bg: "#141820", fg: "#ff4d4d", label: "SPAȚIUL AERIAN" },
  cutremur: { bg: "#3d2b1f", fg: "#f5e6d3", label: "CUTREMUR" },
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const style = STYLES[params.get("n") ?? ""] ?? STYLES.alerta;
  const text = (params.get("t") ?? "").slice(0, 60);
  const sub = (params.get("s") ?? "").slice(0, 80);
  const [serif, mono] = await Promise.all([
    font("Fraunces", 500, text + sub),
    font("IBM+Plex+Mono", 500, style.label + "stiriactuale.info"),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: style.bg,
          color: style.fg,
          padding: "64px 80px",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 44, letterSpacing: 6 }}>{style.label}</div>
        <div style={{ display: "flex", fontFamily: "Serif", fontSize: text.length > 24 ? 92 : 120, lineHeight: 1.05, marginTop: 18 }}>
          {text}
        </div>
        {sub && <div style={{ display: "flex", fontFamily: "Serif", fontSize: 40, marginTop: 22, opacity: 0.85 }}>{sub}</div>}
        <div style={{ display: "flex", position: "absolute", right: 80, bottom: 48, fontFamily: "Mono", fontSize: 24, opacity: 0.7 }}>
          stiriactuale.info
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 720,
      fonts: [
        { name: "Serif", data: serif, weight: 500, style: "normal" },
        { name: "Mono", data: mono, weight: 500, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
