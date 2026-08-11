import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URL-urile canonice (vechi și noi) se termină în "/" — vezi
  // arhitectura-site-nou-taxonomie-pwa-seo.md, secțiunea 3. Ține normalizarea
  // de trailing slash consistentă cu proxy.ts, ca un articol vechi să primească
  // un singur 301 curat către URL-ul nou, nu un lanț de redirect-uri.
  trailingSlash: true,

  // Imaginile simbol generate de pipeline (fal.ai) sunt servite de pe
  // domeniul lor CDN — vezi src/lib/pipeline/image.ts.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.fal.media" }],
  },
};

export default nextConfig;
