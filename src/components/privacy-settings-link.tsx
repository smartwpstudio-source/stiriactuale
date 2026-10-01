"use client";

declare global {
  interface Window {
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void };
  }
}

// Redeschide mesajul de consimțământ GDPR al AdSense (Confidențialitate și
// mesaje), ca cititorul să-și poată schimba alegerea oricând — cerință GDPR.
// googlefc e încărcat de scriptul AdSense; până atunci, apelul intră în coadă.
export function PrivacySettingsLink() {
  function open() {
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.());
  }
  return (
    <button type="button" onClick={open} className="text-left hover:text-amber">
      Setări confidențialitate
    </button>
  );
}
