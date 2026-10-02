// ID de publisher confirmat live pe ads.txt / data-ad-client de pe stiriactuale.info
// (contul e deja aprobat pe domeniu — vezi brief-final-claude-code.md punctul 8).
// Overridabil prin env dacă e vreodată nevoie de un cont separat de test.
export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-2239672430589463";

// Blocul "In-article" creat în AdSense (Ads -> By ad unit). Gol = fără blocuri
// fixe, rămân doar Auto Ads.
export const ADSENSE_IN_ARTICLE_SLOT = "6466968826";
