import { XMLParser } from "fast-xml-parser";

// Cursul oficial BNM al zilei (XML public, fără cheie). Cache o oră — BNM îl
// stabilește o dată pe zi. La eroare: null, blocul nu se afișează.
const CODES = ["EUR", "USD", "RON", "GBP", "UAH", "RUB"];

export interface Rate {
  code: string;
  name: string;
  value: number; // lei pentru `nominal` unități
  nominal: number;
}

export async function getBnmRates(): Promise<{ date: string; rates: Rate[] } | null> {
  const now = new Date();
  const d = now.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Chisinau" });
  try {
    const res = await fetch(`https://www.bnm.md/ro/official_exchange_rates?get_xml=1&date=${d}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const xml = new XMLParser({ ignoreAttributes: false }).parse(await res.text())?.ValCurs;
    const all = ([] as { CharCode: string; Name: string; Value: number; Nominal: number }[]).concat(xml?.Valute ?? []);
    const rates = CODES.map((code) => all.find((v) => v.CharCode === code))
      .filter((v) => v !== undefined)
      .map((v) => ({ code: v.CharCode, name: v.Name, value: Number(v.Value), nominal: Number(v.Nominal) }));
    return rates.length ? { date: String(xml["@_Date"] ?? d), rates } : null;
  } catch {
    return null;
  }
}
