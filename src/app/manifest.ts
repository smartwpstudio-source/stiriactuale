import type { MetadataRoute } from "next";

// PWA instalabilă: manifest + service worker cu citire offline și notificări
// push (adăugate la cererea proprietarului, 2026-10-01 — brief-ul inițial le
// excludea din v1). Iconițe: marca „Ș” generată de
// scripts/generate-icons.tsx. La schimbarea lor crește ?v=N, altfel telefoanele
// păstrează iconița veche (cache-ul browserului și al aplicației instalate).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Știri Actuale",
    short_name: "Știri Actuale",
    description: "Știri din Moldova — regiuni, național, internațional, diaspora.",
    start_url: "/",
    display: "standalone",
    background_color: "#EAEEEA",
    theme_color: "#141820",
    lang: "ro",
    icons: [
      { src: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
