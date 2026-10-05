// O singură dată: publică articolele de prezentare a calculatoarelor (fără
// postare automată pe Telegram) și programează postările aprobate de editor
// în canal (scheduled_posts), câte una pe zi la 12:00 ora Chișinăului.
// npx tsx --env-file=.env.local scripts/publish-calc-promo.ts <articole.json>
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { getDb } from "../src/lib/pipeline/db/client";
import { articles, scheduledPosts } from "../src/lib/pipeline/db/schema";

const SITE = "https://stiriactuale.info";
const photos = Object.fromEntries(
  (JSON.parse(readFileSync("content/locuri/locuri.json", "utf8")) as { id: string; photos: { url: string; credit: string }[] }[]).map((p) => [p.id, p.photos]),
);
const PHOTO: Record<string, string> = {
  "salariul-net-2026-cat-ramane-in-mana": "bani-lei",
  "taxa-folosirea-drumurilor-2026-cat-platesti": "traseu-m1",
  "concediul-medical-2026-cat-primesti": "spital-coridor",
  "indemnizatia-de-maternitate-2026-cat-primesti": "copii-joaca",
};
const SOURCES: Record<string, { name: string; url: string }[]> = {
  "salariul-net-2026-cat-ramane-in-mana": [{ name: "Codul fiscal (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=155071&lang=ro" }],
  "taxa-folosirea-drumurilor-2026-cat-platesti": [{ name: "Codul fiscal, Anexa nr. 1 la Titlul IX (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=155071&lang=ro" }],
  "concediul-medical-2026-cat-primesti": [{ name: "Legea nr. 289/2004 (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=151180&lang=ro" }],
  "indemnizatia-de-maternitate-2026-cat-primesti": [{ name: "Legea nr. 289/2004 (legis.md)", url: "https://www.legis.md/cautare/getResults?doc_id=151180&lang=ro" }],
};

const POSTS = [
  `💰 <b>Cât rămâne în mână din salariul tău în 2026?</b>\n\nDin 10.000 de lei brut primești 8.305 lei. Din 15.000 — 12.309 lei. Atenție la pragul de 30.000 de lei pe lună: acolo dispare scutirea personală.\n\n🧮 Calculează-ți salariul: ${SITE}/calculatoare/salariu-net/`,
  `🚗 <b>Cât plătești taxa de drum pentru mașina ta?</b>\n\n1.6 l — 958,80 lei. 2.0 l — 1.180,80 lei. Dar la 2.001 cm³ suma sare la 1.800,90 lei.\n\n🧮 Află suma exactă: ${SITE}/calculatoare/taxa-drum/`,
  `🤒 <b>Cât primești pe concediul medical?</b>\n\nPrimele 5 zile le plătește angajatorul (75%), restul CNAS — 60%, 70% sau 90%, după stagiu.\n\n🧮 Calculează: ${SITE}/calculatoare/concediu-medical/`,
  `👶 <b>Indemnizația de maternitate 2026</b>\n\n100% din venitul mediu, 126 de zile. La un venit de 10.000 de lei — 41.447,70 lei în total.\n\n🧮 Calculează: ${SITE}/calculatoare/concediu-maternitate/`,
  `💶 <b>Cursul BNM de azi, în câteva secunde</b>\n\nLei în euro, dolari sau lei românești și invers, la cursul oficial al zilei.\n\n🧮 ${SITE}/calculatoare/convertor-valutar/`,
];
const PINNED = [
  "🧮 <b>Calculatoarele Știri Actuale — gratuite, cu valorile oficiale 2026</b>",
  "",
  `💰 <a href="${SITE}/calculatoare/salariu-net/">Salariul net</a>`,
  `🤒 <a href="${SITE}/calculatoare/concediu-medical/">Concediul medical</a>`,
  `👶 <a href="${SITE}/calculatoare/concediu-maternitate/">Indemnizația de maternitate</a>`,
  `🍼 <a href="${SITE}/calculatoare/indemnizatie-crestere-copil/">Indemnizația pentru creșterea copilului</a>`,
  `🏖 <a href="${SITE}/calculatoare/concediu-odihna/">Concediul de odihnă</a>`,
  `📋 <a href="${SITE}/calculatoare/indemnizatie-somaj/">Indemnizația de șomaj</a>`,
  `🚗 <a href="${SITE}/calculatoare/taxa-drum/">Taxa de drum</a>`,
  `🛃 <a href="${SITE}/calculatoare/vamuire-auto/">Vămuirea mașinii</a>`,
  `🏠 <a href="${SITE}/calculatoare/impozit-imobil/">Impozitul pe casă</a>`,
  `💶 <a href="${SITE}/calculatoare/convertor-valutar/">Convertor valutar BNM</a>`,
].join("\n");

// 12:00 la Chișinău (UTC+3 până la 25 octombrie) în ziua de după `start` + n
const noonChisinau = (daysAhead: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  d.setUTCHours(9, 0, 0, 0);
  return d;
};

(async () => {
  const db = getDb();
  const list = JSON.parse(readFileSync(process.argv[2], "utf8")) as {
    titlu: string; slug: string; lead: string; corp_html: string; meta_description: string; topics: string[]; alt_text_imagine: string;
  }[];
  for (const a of list) {
    const ph = photos[PHOTO[a.slug]]?.[0];
    const src = SOURCES[a.slug] ?? [];
    const r = await db
      .insert(articles)
      .values({
        slug: a.slug,
        title: a.titlu,
        leadText: a.lead,
        bodyHtml: a.corp_html,
        metaDescription: a.meta_description.slice(0, 200),
        section: "national",
        topics: a.topics,
        status: "published",
        publishedAt: new Date(),
        normalizedTitleHash: crypto.createHash("sha256").update(a.titlu.toLowerCase()).digest("hex"),
        sourceCount: src.length,
        qualityScore: 70,
        imageUrl: ph?.url,
        imageCredit: ph?.credit,
        imageAltText: a.alt_text_imagine,
        sources: src,
        sourceUrls: src.map((s) => s.url),
      })
      .onConflictDoNothing({ target: articles.slug })
      .returning({ id: articles.id });
    console.log(r.length ? `publicat ${r[0].id}: ${a.titlu}` : `exista deja: ${a.slug}`);
  }
  const rows = [...POSTS.map((text, i) => ({ runAt: noonChisinau(i + 1), text, pin: false })), { runAt: noonChisinau(POSTS.length + 1), text: PINNED, pin: true }];
  await db.insert(scheduledPosts).values(rows);
  for (const r of rows) console.log("programat", r.runAt.toISOString(), r.pin ? "(fixat)" : "", r.text.split("\n")[0]);
  process.exit(0);
})();
