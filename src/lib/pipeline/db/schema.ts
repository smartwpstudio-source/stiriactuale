import type { Impact } from "../../impact";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  real,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const sectionEnum = pgEnum("section", [
  "regiuni",
  "national",
  "international",
  "diaspora",
]);

export const articleStatusEnum = pgEnum("article_status", ["draft", "published"]);

// Un rând per articol publicat de pipeline. `status` pornește pe "draft" —
// vezi plan-implementare-agregator-stiri-ai.md secțiunea 3.8: primele 2-4
// săptămâni, review manual înainte de auto-publish.
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),

  title: text("title").notNull(),
  leadText: text("lead_text").notNull(),
  bodyHtml: text("body_html").notNull(),
  metaDescription: varchar("meta_description", { length: 200 }).notNull(),

  section: sectionEnum("section").notNull(),
  locality: varchar("locality", { length: 100 }), // doar pentru section = regiuni
  country: varchar("country", { length: 100 }), // doar pentru section = diaspora
  topics: jsonb("topics").$type<string[]>().notNull().default([]),

  status: articleStatusEnum("status").notNull().default("draft"),

  // titlu normalizat (fără diacritice/majuscule) — folosit la verificarea
  // contra republicării aceluiași eveniment în rulările următoare (3.2)
  normalizedTitleHash: varchar("normalized_title_hash", { length: 64 }).notNull(),

  sourceCount: integer("source_count").notNull(),
  qualityScore: real("quality_score").notNull(),

  imageUrl: text("image_url"),
  imageAltText: text("image_alt_text"),
  // autorul pozei reale (ex. „IGSU”), afișat „Foto: …”; gol = poză ilustrativă
  imageCredit: text("image_credit"),
  // adresa originală a pozei unui comunicat (nu se refolosește la alt articol)
  imageSource: text("image_source"),

  // sursele originale (nu yam.md ca și canal) care au raportat evenimentul —
  // pentru atribuire în articol, cf. plan-implementare-agregator-stiri-ai.md 3.1
  sourceUrls: jsonb("source_urls").$type<string[]>().notNull().default([]),
  // aceleași surse, cu nume — afișate ca linkuri "Surse:" sub articol
  sources: jsonb("sources").$type<{ name: string; url: string }[]>().notNull().default([]),

  // id-ul resursei de stock Magnific — evită aceeași poză la articole diferite
  imageResourceId: integer("image_resource_id"),
  // mesajul din canalul Telegram — ca retragerea să-l poată șterge și ca
  // republicarea să nu dubleze postarea
  telegramMessageId: integer("telegram_message_id"),
  // postarea de pe pagina de Facebook — aceleași motive ca la Telegram
  facebookPostId: varchar("facebook_post_id", { length: 64 }),
  // playerul YouTube/Facebook al video-ului din sursă (src/lib/video.ts)
  videoUrl: text("video_url"),
  // postarea unei instituții cu pozele de la fața locului (Facebook/Telegram), încorporată
  postUrl: text("post_url"),
  // "stire" (normal), "pe-scurt" (puțin material — se actualizează când apar
  // detalii), "analiza" (comandată de editor din admin)
  kind: varchar("kind", { length: 20 }).notNull().default("stire"),
  // ultima actualizare a conținutului (știre pe scurt extinsă) — afișată
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  // articolul anterior din aceeași poveste (continuare) — caseta „Context”
  continuesId: integer("continues_id"),
  // blocul „Ce înseamnă pentru tine” (src/lib/impact.ts); null = fără bloc
  impact: jsonb("impact").$type<Impact>(),
  // id-ul articolului din WordPress, doar pentru arhiva importată
  wpId: integer("wp_id").unique(),
  // articol de arhivă preluat de la altă redacție: doar rezumat + link spre
  // sursă, noindex, fără reclame, exclus din liste și sitemap
  archived: boolean("archived").notNull().default(false),

  // notificare push: propusă de clasificator (știri de rezonanță națională),
  // editabilă în /admin; trimisă o singură dată, la publicare
  // afișări pe site (beacon din pagina de articol) — "Cele mai citite"
  views: integer("views").notNull().default(0),
  // fixat de editor în prim-planul primei pagini până la această oră
  featuredUntil: timestamp("featured_until", { withTimezone: true }),
  pushWorthy: boolean("push_worthy").notNull().default(false),
  pushSentAt: timestamp("push_sent_at", { withTimezone: true }),

  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Știri brute preluate din RSS la fiecare 30 de minute (fără AI). Feed-urile
// țin doar ultimele 2-12 ore — colectarea continuă garantează că nu se pierde
// nimic între rulările de generare. `manual` = link adăugat de editor din
// /admin, procesat obligatoriu la următoarea rulare, indiferent de scor.
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  sourceName: varchar("source_name", { length: 100 }).notNull(),
  feedId: varchar("feed_id", { length: 50 }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  manual: boolean("manual").notNull().default(false),
  // tipul cerut de editor pentru linkul manual: "stire" sau "analiza"
  kind: varchar("kind", { length: 20 }).notNull().default("stire"),
  // poza și postarea atașate de editor la adăugarea linkului (intră în articol)
  imageUrl: text("image_url"),
  imageCredit: text("image_credit"),
  postUrl: text("post_url"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  // interesul public de pe canalul Telegram al sursei (telegram-signal.ts):
  // vizualizări, reacții și raportul față de media canalului (1 = obișnuit)
  tgViews: integer("tg_views"),
  tgReactions: integer("tg_reactions"),
  tgInterest: real("tg_interest"),
});

// Abonații la notificări push (Web Push, chei VAPID proprii, fără serviciu
// extern). Abonamentele expirate (404/410 la trimitere) se șterg automat.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Un rând per rulare de pipeline — audit/observabilitate, nu blochează nimic
// funcțional. Util ca să vezi rapid câte candidați au fost evaluați vs.
// publicați per rulare, și cât a costat.
export const pipelineRuns = pgTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  candidatesFetched: integer("candidates_fetched").notNull().default(0),
  candidatesClassified: integer("candidates_classified").notNull().default(0),
  articlesPublished: integer("articles_published").notNull().default(0),
  // echivalent consumat din creditul Agent SDK — baza plafonului lunar din run.ts
  costUsd: real("cost_usd").notNull().default(0),
  errorMessage: text("error_message"),
});

// Setări schimbate din /admin (ex. pipeline_enabled = "0" / "1").
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: text("value").notNull(),
});

// Postări programate în canalul Telegram (ex. prezentarea calculatoarelor, câte
// una pe zi) — trimise de /api/cron/scheduled; textul e aprobat de editor.
export const scheduledPosts = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull(),
  text: text("text").notNull(), // HTML Telegram
  pin: boolean("pin").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});
