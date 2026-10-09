// Rularea pipeline-ului — apelat de GitHub Actions (.github/workflows/pipeline.yml).
// Local: npm run pipeline:run (cu CLAUDE_CODE_OAUTH_TOKEN etc. în .env.local).
import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { runPipeline } from "../../src/lib/pipeline/run";
import { requestRevalidate } from "../../src/lib/revalidate";

const since = new Date().toISOString();
runPipeline()
  .then(async (summary) => {
    console.log(JSON.stringify(summary, null, 2));
    // paginile nu se mai refac după ceas: site-ul arată acum știrile noi
    console.log((await requestRevalidate({ since })) ? "site reîmprospătat" : "reîmprospătarea site-ului a eșuat (se reface în max. o oră)");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
