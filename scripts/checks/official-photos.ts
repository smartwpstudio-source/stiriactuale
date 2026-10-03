// Data din fluxurile instituțiilor (src/lib/pipeline/official-photos.ts).
// npx tsx scripts/checks/official-photos.ts
import assert from "node:assert";
import { feedDate, isFreshPhoto } from "../../src/lib/pipeline/official-photos";

assert.equal(new Date(feedDate("Vin, 10/02/2026 - 17:26")).toISOString(), "2026-10-02T14:26:00.000Z");
assert.equal(new Date(feedDate("Thu, 18 Dec 2025 15:23:19 +0000")).toISOString(), "2025-12-18T15:23:19.000Z");
const oct = feedDate("Sâm, 10/03/2026 - 10:00");
assert.equal(isFreshPhoto("https://www.army.md/sites/default/files/media/images/2026-07/informeaza.jpg", oct), false);
assert.equal(isFreshPhoto("https://www.army.md/sites/default/files/media/images/2026-07/drona-causeni.jpg", oct), false);
assert.equal(isFreshPhoto("https://politia.md/sites/default/files/media/images/2026-10/drona-causeni.jpg", oct), true);
assert.equal(isFreshPhoto("https://igsu.gov.md/sites/default/files/media/images/2026-09/incendiu.jpg", oct), true);
console.log("official-photos: OK");
