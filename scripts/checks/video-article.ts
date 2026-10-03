// Știrea video scurtă (src/lib/pipeline/video-article.ts) și citirea câmpului
// shortDescription (src/lib/video-source.ts). npx tsx scripts/checks/video-article.ts
import assert from "node:assert";
import { shortVideoArticle, slugify } from "../../src/lib/pipeline/video-article";
import { jsonStringField } from "../../src/lib/video-source";
import type { CandidateGroup } from "../../src/lib/pipeline/types";

assert.equal(slugify("Câte ore petrec moldovenii la serviciu?"), "cate-ore-petrec-moldovenii-la-serviciu");
const group = {
  items: [{
    sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    sourceName: "TV8",
    title: "Ploi <torențiale> în nord",
    summary: "Ploile au inundat drumuri. Salvatorii intervin. A treia frază. A patra.\nhttps://tv8.md\n#stiri",
  }],
} as unknown as CandidateGroup;
const a = shortVideoArticle(group)!;
assert.equal(a.titlu, "Video: Ploi <torențiale> în nord");
assert.equal(a.lead, "Ploile au inundat drumuri. Salvatorii intervin.");
assert.ok(a.corp_html.includes("A treia frază.") && !a.corp_html.includes("A patra") && !a.corp_html.includes("http"));
assert.equal(a.video_url, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
assert.equal(shortVideoArticle({ items: [{ sourceUrl: "https://tv8.md/x", sourceName: "x", title: "t", summary: "" }] } as unknown as CandidateGroup), null);

const bs = String.fromCharCode(92); // backslash, ca în JSON-ul din pagina YouTube
const html = `x"shortDescription":"Linia 1${bs}nCu ${bs}"ghilimele${bs}" aici","other":1`;
assert.equal(jsonStringField(html, "shortDescription"), 'Linia 1\nCu "ghilimele" aici');
console.log("video-article: OK");
