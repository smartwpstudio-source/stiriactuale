// Potrivirea știre -> ghid (src/lib/content/related-guide.ts) pe exemple reale.
// npx tsx scripts/checks/related-guide.ts
import assert from "node:assert";
import { bestGuide, pickGuide } from "../../src/lib/content/related-guide";
import type { Guide } from "../../src/lib/content/guides";

const g = (slug: string, title: string, description = ""): Guide =>
  ({ slug, title, description, category: "bani", updated: "", sources: [], bodyHtml: "" }) as Guide;
const guides = [
  g("rca", "RCA și Cartea Verde: ce acoperă și cum le cumperi"),
  g("compensatii", "Compensații pentru încălzire în Moldova: cine are dreptul și cum le ceri"),
  g("gaz", "Prețul gazului în Moldova: cum se stabilește tariful", "Tariful la gaze naturale aprobat de ANRE"),
];
assert.equal(bestGuide("Șoferii vor plăti mai mult pentru RCA din 4 octombrie", guides)?.slug, "rca");
assert.equal(bestGuide("Compensații: deținătorii de mașini noi ar putea pierde dreptul la compensații pentru încălzire", guides)?.slug, "compensatii");
assert.equal(bestGuide("Gaze la 26 de lei: ANRE explică de ce tariful s-a dublat", guides)?.slug, "gaz");
assert.equal(bestGuide("Judo: un avocat din Moldova, campion mondial la 70 de ani", guides), undefined);
const cahul = { ...g("cahul-primaria-spitalul-asp-transportul", "Cahul: primăria, spitalul, ASP și transportul", "spitalului raional, poliției"), category: "orase" } as Guide;
const accident = "Mărinești: doi răniți transportați la spitalul raional, au intervenit poliției";
assert.equal(pickGuide(accident, "sangerei", [...guides, cahul]), undefined);
assert.equal(pickGuide(accident, "cahul", [...guides, cahul])?.slug, cahul.slug);
console.log("related-guide: OK");
