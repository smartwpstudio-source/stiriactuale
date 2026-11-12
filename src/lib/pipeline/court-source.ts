import { decodeEntities } from "@/lib/html-entities";
import type { RawCandidate } from "./types";

// Hotărârile judecătoriilor (instante.justice.md), ca Studio-L la Căușeni (editorul, 2026-11-12:
// „începem cu Drochia, învățăm să publicăm corect, apoi extindem”). Doar în pipeline-ul din
// GitHub (citirea PDF-urilor nu are ce căuta pe Worker). Rezumatul = faptele + decizia din
// hotărâre; numele nu se publică (regula e în generate.ts, COURT_RULES).
export const COURTS = [{ id: "jud-drochia", instance: 11, name: "Judecătoria Drochia" }];
export const COURT_HOST = "instante.justice.md";
const BASE = "https://instante.justice.md/ro/";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36";
const TYPES = [2, 3]; // contravențional, penal (civilul — divorțuri, datorii — nu)
// contravențiile care spun ceva oamenilor din raion; penalul intră tot
const INTERESTING =
  /violen|fals\w* a serviciilor|ebriet|alcool|dreptul de a conduce|fara permis|arm|muniti|braconaj|vanat|pescuit|furt|sustrager|huligan|intretinere|copil|minor|taier|arbori|cruzime|animal|drog|stupefiant|psihotrop|incendi|maltrat|amenint|vatamar|escrocher|contraband|corupt/i;

const strip = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");

export interface CourtRow {
  number: string;
  subject: string; // tematica dosarului, fără numele persoanei
  type: string;
  published: string; // AAAA-L-Z
  pdf: string;
}

export function parseCourtList(html: string): CourtRow[] {
  const body = html.slice(html.indexOf("<tbody"), html.indexOf("</tbody>"));
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].flatMap(([, r]) => {
    const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, c]) => decodeEntities(c.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim());
    const pdf = r.match(/href="([^"]*pigd_integration\/pdf\/[^"]+)"/)?.[1];
    if (cells.length < 8 || !pdf) return [];
    return [{ number: cells[1], subject: cells[7], type: cells[6], published: cells[5], pdf: new URL(pdf, BASE).toString() }];
  });
}

// Din hotărâre: sediul, faptele constatate și dispozitivul — fără considerentele juridice lungi
export function courtSummary(text: string): string {
  const t = text.replace(/\s+/g, " ");
  const seat = t.match(/Judecătoria [A-ZĂÂÎȘȚ][\wăâîșțşţ-]+(, sediul [A-ZĂÂÎȘȚ][\wăâîșțşţ-]+)?/)?.[0] ?? "";
  const date = t.match(/\b\d{1,2} (ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie) 20\d\d\b/)?.[0] ?? "";
  // „a c o n s t a t a t” (rărit) sau „A CONSTATAT” e începutul faptelor; „a constatat că” apare și în
  // mijlocul declarațiilor martorilor, deci vine doar ca ultimă variantă
  const factsAt = [/a c o n s t a t a t/i, /A\s?C\s?O\s?N\s?S\s?T\s?A\s?T\s?A\s?T/, /\b(învinuit|inculpat)\w* (de|în) comiterea/i, /a constatat/i]
    .map((re) => t.search(re))
    .find((i) => i >= 0) ?? -1;
  const facts = factsAt >= 0 ? t.slice(factsAt, factsAt + 3000) : t.slice(0, 3000);
  const verdicts = [...t.matchAll(/h\s?o\s?t\s?[aă]\s?r\s?[aă]\s?[sșş]\s?t\s?e|c\s?o\s?n\s?d\s?a\s?m\s?n\s?[aă]/gi)];
  const verdictAt = verdicts.at(-1)?.index ?? -1;
  const verdict = verdictAt >= 0 ? t.slice(verdictAt, verdictAt + 1300) : t.slice(-1300);
  return `HOTĂRÂRE JUDECĂTOREASCĂ (${seat}${date ? `, ${date}` : ""}).\nFAPTELE: ${facts}\nDECIZIA: ${verdict}`;
}

async function pdfText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(await res.arrayBuffer()), { mergePages: true });
  return text as string;
}

// known = adresele PDF deja în candidați (nu le mai descărcăm)
export async function fetchCourtDecisions(known: (urls: string[]) => Promise<Set<string>>): Promise<RawCandidate[]> {
  const out: RawCandidate[] = [];
  const recent = new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10);
  for (const court of COURTS) {
    const rows: CourtRow[] = [];
    for (const type of TYPES) {
      const res = await fetch(`${BASE}hotaririle-instantei?Instance=${court.instance}&Tipul_dosarului=${type}`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`${court.name}: ${res.status}`);
      rows.push(...parseCourtList(await res.text()));
    }
    const fresh = rows.filter((r) => {
      const [y, m, d] = r.published.split("-").map(Number);
      const iso = y && m && d ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
      return iso >= recent && (/penal/i.test(r.type) || INTERESTING.test(strip(r.subject)));
    });
    const seen = await known(fresh.map((r) => r.pdf));
    for (const r of fresh.filter((x) => !seen.has(x.pdf)).slice(0, 8)) {
      const text = await pdfText(r.pdf).catch(() => "");
      if (text.length < 800) continue;
      // titlul de lucru, fără numele din lista instanței
      const cleaned = r.subject.replace(/^(Articolul|art\.?)\s*[\d[\]().,/ alin]*\.?\s*/i, "").replace(/\s*(CC|CCo)( al)? RM\.?$/i, "");
      // la penal, tematica e des doar „CP al RM”: atunci titlul spune doar tipul hotărârii
      const subject = /[a-zăâîșț]{6,}/i.test(cleaned) && !/^(t\.|lit\.|CP\b|Cod)/i.test(cleaned) ? cleaned : "";
      out.push({
        title: `${court.name}: ${subject || "hotărâre"} (${r.type.toLowerCase()})`,
        summary: courtSummary(text),
        sourceName: court.name,
        sourceUrl: r.pdf,
        publishedAt: new Date(), // lista dă doar ziua; adresa PDF-ului ține loc de cheie unică
        feedId: court.id,
      });
    }
  }
  return out;
}
