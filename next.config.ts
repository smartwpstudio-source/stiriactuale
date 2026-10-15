import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URL-urile canonice (vechi și noi) se termină în "/" — vezi
  // arhitectura-site-nou-taxonomie-pwa-seo.md, secțiunea 3. Ține normalizarea
  // de trailing slash consistentă cu proxy.ts, ca un articol vechi să primească
  // un singur 301 curat către URL-ul nou, nu un lanț de redirect-uri.
  trailingSlash: true,

  // Ghidurile și contactele de raion/țară sunt fișiere JSON citite pe server
  // (content/) — incluse explicit în pachetul fiecărei rute regenerate (ISR).
  outputFileTracingIncludes: {
    "/**": ["./content/**/*.json"],
  },

  // Foto de stock copiate de pipeline în Vercel Blob — vezi
  // src/lib/pipeline/image.ts.
  // Upload de imagini din /admin: fișierul e redimensionat în browser la
  // ~300 KB, 4mb rămâne sub plafonul de 4,5 MB al funcțiilor Vercel.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },

  images: {
    // puține mărimi: fiecare (poză, lățime) e o transformare separată la Cloudflare Images
    // (5.000 incluse pe lună). Implicit erau 16 lățimi (2026-10-15).
    deviceSizes: [640, 828, 1200],
    imageSizes: [128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // graficele proprii (/grafic/: cod galben, alertă 112, escrocherie)
      { protocol: "https", hostname: "stiriactuale.info", pathname: "/grafic/**" },
      // ilustrațiile-simbol desenate (public/simbol/, content/locuri/simbol.json)
      { protocol: "https", hostname: "stiriactuale.info", pathname: "/simbol/**" },
      // capturile video-urilor YouTube din surse (src/lib/video.ts)
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
