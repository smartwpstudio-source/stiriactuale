// Colectare RSS manuală (aceeași ca cron-ul Vercel): npm run pipeline:collect
import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(import.meta.dirname, "..", "..", ".env.local"), quiet: true });

import { collectCandidates } from "../../src/lib/pipeline/collect";

collectCandidates()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
