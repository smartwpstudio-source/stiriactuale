import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // URL-urile canonice (vechi și noi) se termină în "/" — vezi
  // arhitectura-site-nou-taxonomie-pwa-seo.md, secțiunea 3. Ține normalizarea
  // de trailing slash consistentă cu proxy.ts, ca un articol vechi să primească
  // un singur 301 curat către URL-ul nou, nu un lanț de redirect-uri.
  trailingSlash: true,

  // Foto de stock copiate de pipeline în Vercel Blob — vezi
  // src/lib/pipeline/image.ts.
  // Upload de imagini din /admin: fișierul e redimensionat în browser la
  // ~300 KB, 4mb rămâne sub plafonul de 4,5 MB al funcțiilor Vercel.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
