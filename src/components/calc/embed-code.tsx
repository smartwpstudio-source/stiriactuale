"use client";

import { useState } from "react";

// Codul de inserat pe alt site. Linkul de credit stă ÎN AFARA iframe-ului —
// doar așa e un link pe pagina celuilalt site. Text = brandul, nu cuvinte-cheie
// (linkurile din widget-uri cu cuvinte-cheie sunt tratate de Google ca spam).
export function EmbedCode({ slug, title, siteUrl }: { slug: string; title: string; siteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const code = `<iframe src="${siteUrl}/embed/${slug}/" title="${title}" width="100%" height="560" style="border:0;max-width:640px" loading="lazy"></iframe>
<p style="font-size:13px">Calculator oferit de <a href="${siteUrl}/calculatoare/${slug}/">Știri Actuale</a></p>`;
  return (
    <section className="mt-10 rounded-lg border-2 border-teal/40 bg-white p-5">
      <h2 className="font-serif text-xl text-ink">Pune calculatorul pe site-ul tău — gratuit</h2>
      <p className="mt-1 text-sm text-sub">
        Copiază codul și lipește-l în pagina ta (HTML). Calculatorul se actualizează singur, fără reclame.
      </p>
      <textarea
        readOnly
        value={code}
        rows={4}
        className="mt-3 w-full rounded border border-line bg-paper p-2 font-mono text-xs text-ink"
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true))}
        className="mt-2 rounded bg-teal px-4 py-2 text-sm font-medium text-white"
      >
        {copied ? "Copiat ✓" : "Copiază codul"}
      </button>
    </section>
  );
}
