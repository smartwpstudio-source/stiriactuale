// O singură dată (2026-10-27): articolele din ultimele 14 zile cu poză de stoc sau
// generată (AI) despre state, politicieni, instituții primesc cardul cu steaguri
// (src/lib/pipeline/flag-card.ts). Rulează în GitHub Actions (recard.yml); fără
// „--aplica” doar afișează ce ar schimba. „--repara slug,slug” pune la loc o poză
// de stoc unde cardul a ieșit greșit.
import { and, eq, gte, inArray, isNull, or, ilike, isNotNull } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles } from "../../src/lib/pipeline/db/schema";
import { HAIKU_MODEL, structured } from "../../src/lib/pipeline/llm";
import { SCHEMA } from "../../src/lib/pipeline/generate";
import { countryName, flagCardImage } from "../../src/lib/pipeline/flag-card";
import { copyToBlob, findArticleImage } from "../../src/lib/pipeline/image";
import { loadPlaces, matchPlacePhoto } from "../../src/lib/pipeline/places";
import { slugify } from "../../src/lib/pipeline/video-article";
import { requestRevalidate } from "../../src/lib/revalidate";
import { photosMatch } from "../../src/lib/pipeline/photo-check";
import { dropPhotoTag, hasBodyPhotos } from "../../src/lib/pipeline/media-tag";

const { card_eticheta, card_tari, card_tema, stock_query, image_prompt } = SCHEMA.properties;

// Haiku inventa uneori state care nu apar deloc în știre (un semafor la Hîncești ->
// „Atac militar [ua, ru]”): un stat rămâne pe card doar dacă textul îl pomenește.
const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const ALIAS: Record<string, string> = {
  us: "sua|americ|washington|trump|rubio|witkoff|vance",
  ru: "rus|moscov|kremlin|putin|lavrov|zaharova|peskov",
  ua: "ucrain|kiev|kyiv|zelensk|odesa|harkiv|zaporoj",
  eu: "ue|uniunea europeana|europ|bruxelles|von der leyen|kallas|kos",
  cn: "chin|beijing|xi jinping",
  ro: "romani|bucurest",
};
export const mentioned = (code: string, text: string) =>
  new RegExp(`\\b(?:${ALIAS[code] ?? norm(countryName(code)).slice(0, 5)})`).test(norm(text));

(async () => {
  const apply = process.argv.includes("--aplica");
  const fix = process.argv[process.argv.indexOf("--repara") + 1]?.split(",") ?? [];
  // de la începutul primei rulări: și articolele schimbate atunci se reîmprospătează
  const since = process.env.RECARD_SINCE || new Date().toISOString();
  const db = getDb();
  const cols = { id: articles.id, slug: articles.slug, title: articles.title, lead: articles.leadText, url: articles.imageUrl };

  // „--muta slug,slug”: articolul rescris cu altă știre (Apă-Canal -> Starlink) primește
  // adresa după titlul real, rubrica Internațional și cardul; tot site-ul se reface,
  // ca adresa veche să nu mai arate textul greșit
  // „--card slug,slug”: doar cardul, fără mutare (o sportivă cu poză de stoc cu doi bărbați)
  const cardOnly = process.argv.includes("--card");
  const flag = cardOnly ? "--card" : "--muta";
  const move = process.argv[process.argv.indexOf(flag) + 1]?.split(",") ?? [];
  if (process.argv.includes(flag)) {
    for (const r of await db.select(cols).from(articles).where(inArray(articles.slug, move))) {
      const slug = cardOnly ? r.slug : slugify(r.title.replace(/[(](VIDEO|FOTO)[)]/g, ""));
      const { card_eticheta: label, card_tari: tari, card_tema: tema } = await structured<{ card_eticheta: string; card_tari: string[]; card_tema: string }>({
        model: HAIKU_MODEL,
        system: "Decizi dacă știrea primește card în loc de poză. Răspunzi doar cu câmpurile cerute.",
        prompt: `${r.title}\n\n${r.lead}`,
        schema: { type: "object", properties: { card_eticheta, card_tari, card_tema }, required: ["card_eticheta", "card_tari", "card_tema"] },
        maxBudgetUsd: 0.05,
      });
      const img = await flagCardImage(tari.map((t) => t.toLowerCase()), label.trim().slice(0, 40) || "Știri internaționale", slug, tema);
      await db
        .update(articles)
        .set({ ...(!cardOnly && { slug, section: "international" as const, locality: null }), imageUrl: img.url, imageResourceId: null, imageCredit: img.credit, imageAltText: img.alt, updatedAt: new Date() })
        .where(eq(articles.id, r.id));
      console.log(`${r.slug} -> ${cardOnly ? "card" : `international/${slug}`}: ${img.alt}`);
    }
    console.log((await requestRevalidate({ all: true })) ? "site reîmprospătat" : "reîmprospătarea a eșuat");
    process.exit(0);
  }

  // „--simbol slug url”: un card-simbol anume (Irina Rîngaci -> Lupte, nu steaguri)
  if (process.argv.includes("--simbol")) {
    const [slug, url] = process.argv.slice(process.argv.indexOf("--simbol") + 1);
    const place = loadPlaces().flatMap((p) => p.photos).find((p) => p.url === url);
    if (!place) throw new Error(`nu e în content/locuri: ${url}`);
    await db.update(articles).set({ imageUrl: url, imageResourceId: null, imageCredit: place.credit, imageAltText: place.alt ?? null, updatedAt: new Date() }).where(eq(articles.slug, slug));
    console.log(`${slug}: ${place.alt}`);
    console.log((await requestRevalidate({ since })) ? "site reîmprospătat" : "reîmprospătarea a eșuat");
    process.exit(0);
  }

  // „--foto slug link”: postarea Telegram avea doar poze, iar articolul primise video
  // din altă poveste și „(VIDEO)”: prima poză sus, celelalte la sfârșitul textului
  if (process.argv.includes("--foto")) {
    const [slug, link] = process.argv.slice(process.argv.indexOf("--foto") + 1);
    const [r] = await db.select({ id: articles.id, title: articles.title, body: articles.bodyHtml }).from(articles).where(eq(articles.slug, slug));
    const html = await fetch(`${link.replace("/s/", "/")}?embed=1`).then((x) => x.text());
    const channel = html.match(/tgme_widget_message_owner_name"[^>]*><span[^>]*>([^<]*)/)?.[1] ?? "Telegram";
    const photos = await Promise.all(
      [...html.matchAll(/tgme_widget_message_photo_wrap[^>]+background-image:url\('([^']+)'\)/g)].map((m, i) => copyToBlob(m[1], `articole/${slug}-foto-${i + 1}.jpg`)),
    );
    if (!r || !photos.length) throw new Error("fără articol sau fără poze");
    const title = r.title.replace("(VIDEO)", "(FOTO)");
    const extra = photos.slice(1).map((u) => `<figure><img src="${u}" alt="${title.replace(/"/g, "")}" loading="lazy"><figcaption>Foto: ${channel}</figcaption></figure>`).join("");
    await db
      .update(articles)
      .set({ title, videoUrl: null, imageUrl: photos[0], imageResourceId: null, imageCredit: `Foto: ${channel}`, imageAltText: null, bodyHtml: r.body + extra, updatedAt: new Date() })
      .where(eq(articles.id, r.id));
    console.log(`${slug}: ${title}, ${photos.length} poze`);
    console.log((await requestRevalidate({ since })) ? "site reîmprospătat" : "reîmprospătarea a eșuat");
    process.exit(0);
  }

  // „--verifica-poze”: pozele din text luate din surse după 2026-10-29, trecute prin
  // verificarea din photo-check.ts; cele fără legătură ies (și din varianta rusă),
  // titlul pierde „(FOTO)” dacă nu mai rămâne niciuna. Fără „--aplica” doar afișează.
  if (process.argv.includes("--verifica-poze")) {
    const rows = await db
      .select({ id: articles.id, slug: articles.slug, title: articles.title, lead: articles.leadText, body: articles.bodyHtml, ru: articles.ru })
      .from(articles)
      .where(and(eq(articles.status, "published"), gte(articles.publishedAt, new Date("2026-10-29T21:00:00Z")), ilike(articles.bodyHtml, "%<figure>%")));
    let removed = 0;
    for (const r of rows) {
      const figs = [...r.body.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi)].map((m) => m[0]).filter((f) => /src="https:\/\/media\.stiriactuale\.info\/[^"]*-foto-/.test(f));
      if (!figs.length) continue;
      const data = await Promise.all(
        figs.map((f) => fetch(f.match(/src="([^"]+)"/)![1]).then(async (x) => (x.ok ? new Uint8Array(await x.arrayBuffer()) : null), () => null)),
      );
      const ok = await photosMatch(data.filter((d) => d !== null), `${r.title}. ${r.lead}`);
      let k = 0;
      const bad = figs.filter((_, i) => !(data[i] && ok[k++]));
      console.log(`${r.slug}: ${figs.length} poze, ${bad.length} scoase`);
      if (!bad.length) continue;
      removed += bad.length;
      if (!apply) continue;
      // după adresa pozei: în varianta rusă descrierea e tradusă
      const badSrc = new Set(bad.map((f) => f.match(/src="([^"]+)"/)![1]));
      const strip = (html: string) => html.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, (f) => (badSrc.has(f.match(/src="([^"]+)"/)?.[1] ?? "") ? "" : f));
      const body = strip(r.body);
      const ru = r.ru && { ...r.ru, bodyHtml: strip(r.ru.bodyHtml), title: hasBodyPhotos(body) ? r.ru.title : r.ru.title.replace(/\s*[(]ФОТО[)]\s*$/i, "") };
      await db
        .update(articles)
        .set({ bodyHtml: body, title: hasBodyPhotos(body) ? r.title : dropPhotoTag(r.title), ...(ru && { ru }), updatedAt: new Date() })
        .where(eq(articles.id, r.id));
    }
    console.log(`${removed} poze ${apply ? "scoase" : "de scos"}`);
    if (apply) console.log((await requestRevalidate({ since })) ? "site reîmprospătat" : "reîmprospătarea a eșuat");
    process.exit(0);
  }

  if (process.argv.includes("--repara")) {
    for (const r of await db.select(cols).from(articles).where(inArray(articles.slug, fix))) {
      const q = await structured<{ stock_query: string; image_prompt: string }>({
        model: HAIKU_MODEL,
        system: "Alegi căutarea de poză pentru o știre. Răspunzi doar cu câmpurile cerute.",
        prompt: `${r.title}\n\n${r.lead}`,
        schema: { type: "object", properties: { stock_query, image_prompt }, required: ["stock_query", "image_prompt"] },
        maxBudgetUsd: 0.05,
      });
      const img = await findArticleImage(q.stock_query, q.image_prompt, r.slug, new Set(), r.title);
      console.log(`${r.slug}: ${img?.url ?? "fără poză"}`);
      if (img) await db.update(articles).set({ imageUrl: img.url, imageResourceId: img.resourceId, imageCredit: null, imageAltText: null, updatedAt: new Date() }).where(eq(articles.id, r.id));
    }
    console.log((await requestRevalidate({ since })) ? "site reîmprospătat" : "reîmprospătarea a eșuat");
    process.exit(0);
  }

  const rows = await db
    .select(cols)
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        isNull(articles.wpId),
        gte(articles.publishedAt, new Date(Date.now() - 14 * 86400_000)),
        // doar pozele alese automat: stocul (resourceId) sau cele generate
        or(isNotNull(articles.imageResourceId), ilike(articles.imageUrl, "%/articole/ai-%")),
      ),
    );
  console.log(`${rows.length} articole cu stoc / AI`);
  const cards = loadPlaces().filter((p) => p.id.startsWith("card-"));
  const used: string[] = [];
  let changed = 0;

  async function one(r: (typeof rows)[number]) {
    const text = `${r.title}\n\n${r.lead}`;
    const { card_eticheta: label, card_tari: tari, card_tema: tema } = await structured<{ card_eticheta: string; card_tari: string[]; card_tema: string }>({
      model: HAIKU_MODEL,
      system: "Decizi dacă știrea primește card în loc de poză. Răspunzi doar cu câmpurile cerute.",
      prompt: text,
      schema: { type: "object", properties: { card_eticheta, card_tari, card_tema }, required: ["card_eticheta", "card_tari", "card_tema"] },
      maxBudgetUsd: 0.05,
    }).catch(() => ({ card_eticheta: "", card_tari: [] as string[], card_tema: "" }));
    if (!label.trim()) return;
    const all = tari.map((t) => t.toLowerCase());
    const codes = all.filter((t) => t === "md" || mentioned(t, text));
    if (all.some((t) => t !== "md" && !codes.includes(t))) return console.log(`sărit ${r.slug}: [${all.join(", ")}] nepomenite`);
    // ca în pipeline: cu un stat străin, steagurile; doar Moldova: cardul instituției
    // sau al regiunii (Transnistria, Găgăuzia…), altfel poza rămâne
    const foreign = codes.some((t) => t !== "md");
    // rotația celor 3 variante: ultimele 2 folosite nu se repetă
    const card = foreign ? null : await matchPlacePhoto(`${r.title}. ${r.lead}`, cards, undefined, used.slice(0, 2));
    if (card) used.unshift(card.url);
    if (!foreign && !card) return;
    console.log(`${r.slug}: ${foreign ? `${label} [${codes.join(", ")}] ${tema}` : card!.alt}`);
    changed++;
    if (!apply) return;
    const img = foreign ? await flagCardImage(codes, label.trim().slice(0, 40), r.slug, tema) : { url: card!.url, credit: card!.credit, alt: card!.alt ?? null };
    await db
      .update(articles)
      .set({ imageUrl: img.url, imageResourceId: null, imageCredit: img.credit, imageAltText: img.alt, updatedAt: new Date() })
      .where(eq(articles.id, r.id));
  }

  // câte 4 deodată (o rulare la rând nu încăpea în 2 ore); site-ul se reîmprospătează
  // la fiecare 40, ca o oprire la jumătate să nu lase pagini vechi
  for (let i = 0; i < rows.length; i += 4) {
    await Promise.all(rows.slice(i, i + 4).map(one));
    if (apply && (i + 4) % 40 === 0) await requestRevalidate({ since });
  }
  console.log(`${changed} ${apply ? "schimbate" : "de schimbat"}`);
  if (apply) console.log((await requestRevalidate({ since })) ? "site reîmprospătat" : "reîmprospătarea a eșuat");
  process.exit(0); // conexiunea la bază ține procesul deschis
})();
