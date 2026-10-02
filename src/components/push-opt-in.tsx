"use client";

import { useEffect, useState } from "react";
import { IconBell, IconBellOff } from "@tabler/icons-react";

// Abonare la alertele importante. Permisiunea se cere DOAR la click — un
// prompt la intrarea pe site e enervant și Chrome îl blochează automat.
// Pe iPhone, Web Push merge doar cu site-ul adăugat pe ecranul principal.
type State = "loading" | "hidden" | "ios-install" | "denied" | "off" | "on" | "busy";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const b64 = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function registration() {
  return "serviceWorker" in navigator ? navigator.serviceWorker.getRegistration() : undefined;
}

export function PushOptIn() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!("PushManager" in window) || !("Notification" in window)) {
        return setState(ios && !standalone ? "ios-install" : "hidden");
      }
      const reg = await registration();
      if (!reg || !KEY) return setState("hidden"); // service worker doar în producție
      if (Notification.permission === "denied") return setState("denied");
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setState("busy");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("denied");
      const reg = (await registration())!;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) });
      const res = await fetch("/api/push/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    const sub = await (await registration())?.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/", { method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
      await sub.unsubscribe();
    }
    setState("off");
  }

  if (state === "loading" || state === "hidden") return null;

  const box = "mt-4 flex items-center justify-between gap-4 rounded border border-line bg-white p-4 text-sm text-ink";
  if (state === "ios-install") {
    return (
      <div className={box}>
        <p>
          <strong>Alerte pe iPhone:</strong> apasă <em>Partajează</em> → <em>Adaugă pe ecranul principal</em>, deschide
          site-ul de acolo și activează alertele.
        </p>
      </div>
    );
  }
  if (state === "denied") {
    return <p className="mt-4 text-xs text-sub">Alertele sunt blocate din setările browserului pentru acest site.</p>;
  }
  return (
    <div className={box}>
      <div className="flex items-center gap-3">
        {state === "on" ? <IconBell size={20} className="shrink-0 text-teal" /> : <IconBellOff size={20} className="shrink-0 text-sub" />}
        <p>
          {state === "on"
            ? "Primești alertele importante: scumpiri, legi, cazuri de rezonanță."
            : "Primește doar alertele importante ale zilei, niciodată noaptea."}
        </p>
      </div>
      <button
        onClick={state === "on" ? disable : enable}
        disabled={state === "busy"}
        className={`shrink-0 rounded px-3 py-1.5 ${state === "on" ? "border border-line text-sub" : "bg-ink text-paper"}`}
      >
        {state === "on" ? "Dezactivează" : state === "busy" ? "…" : "Activează"}
      </button>
    </div>
  );
}
