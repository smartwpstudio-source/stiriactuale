"use client";

import { useEffect, useState } from "react";
import { IconBell, IconBellRinging } from "@tabler/icons-react";
import { COUNTRY_NAMES, RAION_NAMES } from "@/lib/content/geo";
import type { PushPrefs, PushScope } from "@/lib/push-segment";

// Abonare la alertele importante. Permisiunea se cere DOAR la click — un
// prompt la intrarea pe site e enervant și Chrome îl blochează automat.
// Pe iPhone, Web Push merge doar cu site-ul adăugat pe ecranul principal.
// După abonare: întrebare opțională (raion / țară) — segmentarea din
// src/lib/push-segment.ts. Alegerea se ține și în localStorage, doar pentru afișare.
type State = "loading" | "hidden" | "ios-install" | "denied" | "off" | "on" | "busy";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PREFS_KEY = "push-prefs";
const PROMISE = "Primești doar alertele importante: urgențe, vreme periculoasă, legi și decizii noi. Fără spam, noaptea nu trimitem nimic.";

const sorted = (o: Record<string, string>) => Object.entries(o).sort((a, b) => a[1].localeCompare(b[1], "ro"));
const RAIONS = sorted(RAION_NAMES);
const COUNTRIES = sorted(COUNTRY_NAMES);
const DEFAULT: PushPrefs = { scope: "all", raion: null, country: null };

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const b64 = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function registration() {
  return "serviceWorker" in navigator ? navigator.serviceWorker.getRegistration() : undefined;
}

function storedPrefs(): PushPrefs {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") };
  } catch {
    return DEFAULT;
  }
}

const box = "mt-6 rounded-xl border border-amber bg-amber/[0.08] p-5 font-sans text-ink";

export function PushOptIn() {
  const [state, setState] = useState<State>("loading");
  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT);
  const [saved, setSaved] = useState<"" | "ok" | "err" | "busy">("");

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
      const on = !!(await reg.pushManager.getSubscription());
      if (on) setPrefs(storedPrefs());
      setState(on ? "on" : "off");
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
      setPrefs(DEFAULT); // abonament nou: pe server pornește cu „toată țara”
      setSaved("");
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
    try {
      localStorage.removeItem(PREFS_KEY);
    } catch {}
    setState("off");
  }

  // Se salvează doar o alegere completă (raion / țară selectate).
  async function choose(next: PushPrefs) {
    setPrefs(next);
    if ((next.scope === "raion" && !next.raion) || (next.scope === "tara" && !next.country)) return setSaved("");
    setSaved("busy");
    try {
      const sub = await (await registration())?.pushManager.getSubscription();
      const res = await fetch("/api/push/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub?.endpoint, ...next }),
      });
      if (!res.ok) throw new Error();
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {}
      setSaved("ok");
    } catch {
      setSaved("err");
    }
  }

  if (state === "loading" || state === "hidden") return null;

  if (state === "ios-install") {
    return (
      <div className={box}>
        <p className="text-base font-semibold">Alerte pe iPhone</p>
        <p className="mt-1 text-sm text-sub">
          Pe iPhone, alertele merg doar cu site-ul adăugat pe ecran: apasă <em>Partajează</em> →{" "}
          <em>Adaugă pe ecranul principal</em>, deschide site-ul de acolo și apasă „Activează alertele”.
        </p>
      </div>
    );
  }
  if (state === "denied") {
    return (
      <p className="mt-6 text-sm text-sub">
        Alertele sunt blocate pentru acest site. Le poți permite din setările browserului (iconița de lângă adresa site-ului).
      </p>
    );
  }

  const on = state === "on";
  const radio = (scope: PushScope, label: string) => (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="radio"
        name="push-scope"
        checked={prefs.scope === scope}
        onChange={() =>
          choose({
            scope,
            raion: scope === "raion" ? prefs.raion : null,
            country: scope === "tara" ? prefs.country : null,
          })
        }
        className="accent-teal"
      />
      {label}
    </label>
  );
  const select = "ml-6 w-[calc(100%-1.5rem)] max-w-xs rounded border border-line bg-white px-2 py-1.5 text-sm";

  return (
    <section className={box} aria-label="Alerte importante">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber-ink">
          {on ? <IconBellRinging size={24} aria-hidden /> : <IconBell size={24} aria-hidden />}
        </span>
        <div className="flex-1">
          <p className="text-lg font-semibold leading-snug">{on ? "Alertele sunt active" : "Activează alertele importante"}</p>
          <p className="mt-1 text-sm text-sub">{PROMISE}</p>
        </div>
        <button
          onClick={on ? disable : enable}
          disabled={state === "busy"}
          className={
            on
              ? "shrink-0 self-start text-sm text-sub underline sm:self-center"
              : "shrink-0 self-start rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink2 disabled:opacity-60 sm:self-center"
          }
        >
          {on ? "Dezactivează" : state === "busy" ? "Se activează…" : "Activează alertele"}
        </button>
      </div>

      {on && (
        <fieldset className="mt-4 border-t border-amber/40 pt-4 text-sm">
          <legend className="font-semibold">
            Ce alerte vrei? <span className="font-normal text-sub">(opțional)</span>
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {radio("all", "Toată țara")}
            {radio("raion", "Și știrile importante din raionul meu")}
            {prefs.scope === "raion" && (
              <select
                aria-label="Raionul tău"
                value={prefs.raion ?? ""}
                onChange={(e) => choose({ ...prefs, raion: e.target.value || null })}
                className={select}
              >
                <option value="">alege raionul…</option>
                {RAIONS.map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            )}
            {radio("tara", "Sunt în diaspora")}
            {prefs.scope === "tara" && (
              <select
                aria-label="Țara în care locuiești"
                value={prefs.country ?? ""}
                onChange={(e) => choose({ ...prefs, country: e.target.value || null })}
                className={select}
              >
                <option value="">alege țara…</option>
                {COUNTRIES.map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-2 text-xs text-sub" aria-live="polite">
            {saved === "ok" && "Salvat."}
            {saved === "busy" && "Se salvează…"}
            {saved === "err" && "Nu s-a putut salva. Încearcă din nou."}
            {!saved && "Știrile naționale importante le primești oricum. Nu folosim locația ta."}
          </p>
        </fieldset>
      )}
    </section>
  );
}
