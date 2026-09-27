// Rularea pipeline-ului — apelat de GitHub Actions (.github/workflows/pipeline.yml).
// Local: npm run pipeline:run (cu CLAUDE_CODE_OAUTH_TOKEN etc. în .env.local).
import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { runPipeline } from "../../src/lib/pipeline/run";

runPipeline()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
