"use client";

import { useEffect } from "react";

// O afișare per articol per sesiune; roboții care se declară (webdriver) nu se numără.
// ponytail: fără filtrare de boți pe server — suficient pentru un clasament
// "Cele mai citite"; Vercel Analytics dacă e nevoie de cifre exacte.
export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    if (navigator.webdriver) return;
    const key = `viz:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    navigator.sendBeacon("/api/view/", JSON.stringify({ slug }));
  }, [slug]);
  return null;
}
