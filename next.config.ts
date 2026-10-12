import type { NextConfig } from "next";

// Build-ul pentru Cloudflare Workers (npm run cf:build, scripts/cloudflare/build.mjs).
// Build-ul Vercel nu are variabila și rămâne neschimbat.
const cloudflare = process.env.BUILD_TARGET === "cloudflare";

const nextConfig: NextConfig = {
  // URL-urile canonice (vechi și noi) se termină în "/" — vezi
  // arhitectura-site-nou-taxonomie-pwa-seo.md, secțiunea 3. Ține normalizarea
  // de trailing slash consistentă cu proxy.ts, ca un articol vechi să primească
  // un singur 301 curat către URL-ul nou, nu un lanț de redirect-uri.
  trailingSlash: true,

  // Ghidurile și contactele de raion/țară sunt fișiere JSON citite pe server
  // (content/) — incluse explicit în pachetul fiecărei rute regenerate (ISR).
  // Pe Workers nu există disc: conținutul ajunge în assets (src/lib/content/store.ts).
  ...(!cloudflare && { outputFileTracingIncludes: { "/**": ["./content/**/*.json"] } }),

  // Foto de stock copiate de pipeline în Vercel Blob — vezi
  // src/lib/pipeline/image.ts.
  // Upload de imagini din /admin: fișierul e redimensionat în browser la
  // ~300 KB, 4mb rămâne sub plafonul de 4,5 MB al funcțiilor Vercel.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },

  // Pe Workers, `undici` (importat de @vercel/blob) nu se poate încărca — vezi
  // cloudflare/undici-fetch.mjs.
  ...(cloudflare && { turbopack: { resolveAlias: { undici: "./cloudflare/undici-fetch.mjs" } } }),

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // graficele proprii (/grafic/: cod galben, alertă 112, escrocherie)
      { protocol: "https", hostname: "stiriactuale.info", pathname: "/grafic/**" },
      // capturile video-urilor YouTube din surse (src/lib/video.ts)
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
