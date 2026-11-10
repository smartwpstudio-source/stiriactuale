import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Fiecare pagină ne-cache-uită costă timp CPU pe Cloudflare (~0,5 s). Roboții de
// analiză SEO și de colectare (nu aduc cititori) primeau aproape jumătate din pagini
// (16.10.2026), iar /cautare/ (și /tag/ vechi, redirecționat acolo) e o pagină generată la fiecare cerere.
// Google, Bing, Apple, Yandex, Facebook și AdSense rămân permise.
const BLOCKED = [
  "AhrefsBot", "SemrushBot", "DotBot", "MJ12bot", "Bytespider", "Baiduspider", "PetalBot", "ShapBot", "DataForSeoBot", "BLEXBot",
  // colectare pentru antrenarea AI, fără vizitatori (2026-10-18); previzualizarea Facebook
  // (facebookexternalhit) rămâne permisă
  "meta-externalagent", "ClaudeBot", "Amazonbot", "Reflectionbot", "ExaSearchBot", "GPTBot", "CCBot", "Google-Extended",
  // căutarea ChatGPT: ~6.000 de cereri pe zi, aproape fără cititori, iar paginile refăcute pentru ea
  // consumau limita Supabase (decizia editorului, 2026-11-10; Cloudflare îl blochează și el)
  "OAI-SearchBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/cautare/"] },
      { userAgent: BLOCKED, disallow: "/" },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  };
}
