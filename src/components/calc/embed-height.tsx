"use client";

import { useEffect } from "react";

// În iframe pe alt site: trimite înălțimea conținutului către pagina gazdă,
// care redimensionează iframe-ul (scriptul din codul de inserare) — fără bară
// de derulare internă, și într-o coloană laterală îngustă.
export function EmbedHeight({ slug }: { slug: string }) {
  useEffect(() => {
    if (window.parent === window) return;
    const send = () =>
      window.parent.postMessage({ stiriactuale: slug, height: document.documentElement.scrollHeight }, "*");
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    send();
    return () => ro.disconnect();
  }, [slug]);
  return null;
}
