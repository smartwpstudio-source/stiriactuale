import type { MetadataRoute } from "next";

// PWA instalabilă: manifest + service worker cu citire offline și notificări
// push (adăugate la cererea proprietarului, 2026-10-01 — brief-ul inițial le
// excludea din v1). Iconițe placeholder generate din
// tokenii de design (scripts/generate-icons.tsx), de înlocuit cu un logo real
// ulterior fără să schimbe structura manifestului.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stiri actuale",
    short_name: "Stiri actuale",
    description: "Știri din Moldova — regiuni, național, internațional, diaspora.",
    start_url: "/",
    display: "standalone",
    background_color: "#EAEEEA",
    theme_color: "#141820",
    lang: "ro",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
