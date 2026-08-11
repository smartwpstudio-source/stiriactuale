// Trecere completă prin pipeline FĂRĂ publicare în DB — validează RSS real,
// deduplicare, scoring, clasificare (Haiku) și generare (Sonnet) cu API-uri reale.
//
// Rulare: npm run pipeline:dry-run

import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { fetchAllSources } from "../../src/lib/pipeline/sources";
import { groupCandidates } from "../../src/lib/pipeline/dedup";
import { classifyGroup } from "../../src/lib/pipeline/classify";
import { generateArticle } from "../../src/lib/pipeline/generate";
import { computeQualityScore } from "../../src/lib/pipeline/scoring";

const CLASSIFY_TOP_N = 8;
const GENERATE_TOP_N = 2;

async function main() {
  console.log("=== 1. Fetch surse ===");
  const { candidates, failedFeeds } = await fetchAllSources();
  console.log(`  candidați bruți: ${candidates.length}`);
  console.log(`  feed-uri eșuate: ${failedFeeds.length}`);
  if (failedFeeds.length > 0) {
    for (const f of failedFeeds.slice(0, 10)) console.log(`    - ${f.id}: ${f.error}`);
    if (failedFeeds.length > 10) console.log(`    ... și încă ${failedFeeds.length - 10}`);
  }

  console.log("\n=== 2. Deduplicare / grupare ===");
  const groups = groupCandidates(candidates);
  console.log(`  grupuri: ${groups.length}`);

  const topGroups = [...groups]
    .sort((a, b) => b.sourceNames.length - a.sourceNames.length)
    .slice(0, CLASSIFY_TOP_N);

  console.log(`\n=== 3. Clasificare (Haiku) — top ${topGroups.length} după nr. de surse ===`);
  const classified = [];
  for (const group of topGroups) {
    try {
      const classification = await classifyGroup(group);
      const qualityScore = computeQualityScore(group, classification);
      classified.push({ group, classification, qualityScore });
      console.log(
        `  [${qualityScore.toString().padStart(3)}] (${group.sourceNames.length} surse) ${group.representativeTitle}`,
      );
      console.log(
        `        -> ${classification.section}${classification.locality ? "/" + classification.locality : ""}${classification.country ? "/" + classification.country : ""} | topics: ${classification.topics.join(",") || "-"} | factual:${classification.factualRichness} confidence:${classification.confidence}`,
      );
    } catch (err) {
      console.log(`  EROARE clasificare "${group.representativeTitle}": ${err}`);
    }
  }

  classified.sort((a, b) => b.qualityScore - a.qualityScore);

  console.log(`\n=== 4. Generare articol (Sonnet) — top ${GENERATE_TOP_N} după scor ===`);
  for (const candidate of classified.slice(0, GENERATE_TOP_N)) {
    try {
      const article = await generateArticle(candidate.group, candidate.classification);
      console.log(`\n--- ${article.titlu} ---`);
      console.log(`slug: ${article.slug}`);
      console.log(`meta: ${article.meta_description} (${article.meta_description.length} car.)`);
      console.log(`lead: ${article.lead}`);
      console.log(`tag-uri: ${article.tag_uri.join(", ")}`);
      console.log(`alt text imagine: ${article.alt_text_imagine}`);
      console.log(`corp_html (primele 400 car.): ${article.corp_html.slice(0, 400)}...`);
    } catch (err) {
      console.log(`  EROARE generare "${candidate.group.representativeTitle}": ${err}`);
    }
  }

  console.log("\nGata.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
