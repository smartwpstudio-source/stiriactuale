// Regula „știre cu ghid” pe știri deja publicate — DOAR citire (nu scrie în DB,
// nu publică): câte ar trece în modul strict, câte ar cădea, ce teme lipsesc.
// npx tsx scripts/pipeline/guide-rule-dry.ts [număr=15]
import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../src/lib/pipeline/db/client";
import { articles, guideChecks } from "../../src/lib/pipeline/db/schema";
import { checkGuide, guideDecision, guideExempt } from "../../src/lib/pipeline/guide-rule";
import { spentUsd } from "../../src/lib/pipeline/llm";

async function main() {
  const n = Number(process.argv[2] ?? 15);
  const db = getDb();
  const [{ checks }] = await db.select({ checks: count() }).from(guideChecks); // tabelul există (migrarea 0025)
  const rows = await db
    .select({ id: articles.id, title: articles.title, lead: articles.leadText, section: articles.section, topics: articles.topics, pushWorthy: articles.pushWorthy, kind: articles.kind })
    .from(articles)
    .where(and(eq(articles.status, "published"), isNull(articles.wpId), eq(articles.archived, false)))
    .orderBy(desc(articles.publishedAt))
    .limit(n);
  let pass = 0;
  let fail = 0;
  const missing: string[] = [];
  for (const a of rows) {
    const input = { title: a.title, summary: a.lead, section: a.section, topics: a.topics };
    const exempt = guideExempt({ pushWorthy: a.pushWorthy, ...input });
    const check = await checkGuide(input);
    const { publish } = guideDecision("strict", check, exempt);
    if (publish) pass++;
    else fail++;
    if (!check.tool && !exempt) missing.push(check.topic ?? "(fără temă)");
    console.log(
      `${publish ? "TRECE" : "CADE "} [${a.section}] ${a.title.slice(0, 90)}\n    -> ${check.tool ?? "—"} (${check.via}${exempt ? ", scutită: urgență/lege" : ""})${check.topic ? ` tema lipsă: ${check.topic}` : ""}${check.reason ? `\n    ${check.reason}` : ""}`,
    );
  }
  console.log(`\n${rows.length} știri: ${pass} ar trece în strict, ${fail} ar cădea. Teme lipsă: ${missing.join("; ") || "—"}`);
  console.log(`guide_checks: ${checks} rânduri. Consum AI (echivalent API): $${spentUsd().toFixed(3)}`);
}

main().then(
  () => process.exit(0),
  (err) => (console.error(err), process.exit(1)),
);
