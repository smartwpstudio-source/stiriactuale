// Vremea din coloana laterală: MET Norway (api.met.no) — gratuit și pentru
// site-uri comerciale, cu condiția de a cita sursa (CC BY 4.0) și de a trimite
// un User-Agent cu contact. Cache 30 de minute (ei cer cel mult o cerere la
// câteva minute per locație). La eroare: null, caseta nu apare.
const UA = "stiriactuale.info contact@stiriactuale.info";

export const CITIES = [
  { name: "Chișinău", lat: 47.01, lon: 28.86 },
  { name: "Bălți", lat: 47.76, lon: 27.93 },
  { name: "Cahul", lat: 45.9, lon: 28.19 },
] as const;

type Series = { time: string; data: { instant: { details: { air_temperature: number } }; next_1_hours?: { summary: { symbol_code: string } }; next_6_hours?: { summary: { symbol_code: string } } } }[];

async function series(lat: number, lon: number): Promise<Series | null> {
  try {
    const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
      headers: { "User-Agent": UA },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return (await res.json()).properties.timeseries;
  } catch {
    return null;
  }
}

const LABELS: [RegExp, string, string][] = [
  [/thunder/, "⛈️", "furtună"],
  [/snow/, "❄️", "ninsoare"],
  [/sleet/, "🌨️", "lapoviță"],
  [/rain/, "🌧️", "ploaie"],
  [/fog/, "🌫️", "ceață"],
  [/^cloudy/, "☁️", "înnorat"],
  [/partlycloudy/, "⛅", "parțial noros"],
  [/fair/, "🌤️", "mai mult senin"],
  [/clearsky_night/, "🌙", "senin"],
  [/clearsky/, "☀️", "senin"],
];
export const describe = (symbol?: string) => {
  const l = LABELS.find(([re]) => symbol && re.test(symbol));
  return { icon: l?.[1] ?? "🌡️", text: l?.[2] ?? "" };
};

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });

export async function getWeather() {
  const all = await Promise.all(CITIES.map((c) => series(c.lat, c.lon)));
  if (!all[0]) return null;
  const now = CITIES.map((c, i) => {
    const t = all[i]?.[0];
    return t ? { city: c.name, temp: Math.round(t.data.instant.details.air_temperature), symbol: t.data.next_1_hours?.summary.symbol_code } : null;
  }).filter((x) => x !== null);
  return { now, days: nextDays(all[0]) };
}

// min/max și simbolul pe zilele următoare (după azi), din seria unei locații
function nextDays(s: Series) {
  const byDay = new Map<string, { min: number; max: number; symbol?: string }>();
  for (const t of s) {
    const k = dayKey(t.time);
    const temp = t.data.instant.details.air_temperature;
    const d = byDay.get(k) ?? { min: temp, max: temp };
    d.min = Math.min(d.min, temp);
    d.max = Math.max(d.max, temp);
    // simbolul zilei: primul interval de 6 ore care începe între 06 și 12 UTC
    // (prognoza trece de la pași de o oră la pași de 6 ore după ~2 zile)
    const h = new Date(t.time).getUTCHours();
    if (!d.symbol && h >= 6 && h <= 12) d.symbol = t.data.next_6_hours?.summary.symbol_code;
    byDay.set(k, d);
  }
  return [...byDay.entries()].slice(1, 4).map(([date, d]) => ({ date, min: Math.round(d.min), max: Math.round(d.max), symbol: d.symbol }));
}

// Localitățile widget-ului /embed/vremea/<loc>/ (pentru site-urile partenere)
export const LOCATIONS = {
  drochia: { name: "Drochia", lat: 48.03, lon: 27.81 },
} as const;

// O singură locație: acum + următoarele 3 zile
export async function getForecast(lat: number, lon: number) {
  const s = await series(lat, lon);
  const t = s?.[0];
  if (!s || !t) return null;
  return {
    now: { temp: Math.round(t.data.instant.details.air_temperature), symbol: t.data.next_1_hours?.summary.symbol_code },
    days: nextDays(s),
  };
}

// Azi, per oraș: minima și maxima până la miezul nopții + simbolul zilei —
// pentru rezumatul de dimineață din Telegram (digest.ts).
export async function getTodayWeather() {
  const today = dayKey(new Date().toISOString());
  const all = await Promise.all(CITIES.map((c) => series(c.lat, c.lon)));
  return CITIES.flatMap((c, i) => {
    const points = (all[i] ?? []).filter((t) => dayKey(t.time) === today);
    if (!points.length) return [];
    const temps = points.map((t) => t.data.instant.details.air_temperature);
    // simbolul de la prânz (ora Chișinăului), nu de la miezul nopții
    const localHour = (iso: string) => Number(new Date(iso).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Chisinau" }));
    const noon = points.find((t) => localHour(t.time) >= 12) ?? points[points.length - 1];
    return [{ city: c.name, min: Math.round(Math.min(...temps)), max: Math.round(Math.max(...temps)), symbol: noon.data.next_1_hours?.summary.symbol_code ?? noon.data.next_6_hours?.summary.symbol_code }];
  });
}
