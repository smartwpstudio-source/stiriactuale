// Sursa din harta Google News (sitemap-source.ts): npx tsx scripts/checks/sitemap-source.ts
import assert from "node:assert/strict";
import { parseNewsSitemap } from "../../src/lib/pipeline/sitemap-source";

const xml = `<urlset><url><loc>https://www.studio-l.online/ro/minor-amendat/</loc><news:news><news:publication><news:name>Studio-L</news:name><news:language>ro</news:language></news:publication><news:publication_date>2026-11-12T11:44:00+00:00</news:publication_date><news:title><![CDATA[Minor din raionul Căușeni, amendat cu 3.000 de lei &amp; altele]]></news:title></news:news></url>
<url><loc>https://www.studio-l.online/ru/x/</loc><news:news><news:publication><news:language>ru</news:language></news:publication><news:publication_date>2026-11-12T11:00:00+00:00</news:publication_date><news:title>Новость</news:title></news:news></url></urlset>`;
const items = parseNewsSitemap(xml, "studio-l", "Studio-L", "ro");
assert.equal(items.length, 1, "doar româna");
assert.equal(items[0].title, "Minor din raionul Căușeni, amendat cu 3.000 de lei & altele");
assert.equal(items[0].sourceUrl, "https://www.studio-l.online/ro/minor-amendat/");
assert.equal(items[0].publishedAt.toISOString(), "2026-11-12T11:44:00.000Z");
console.log("sitemap-source: OK");
