// npm run cf:build — build-ul pentru Cloudflare Workers:
// 1. `opennextjs-cloudflare build` (rulează `next build` cu BUILD_TARGET=cloudflare,
//    citit în next.config.ts pentru ajustările doar-Workers);
// 2. conținutul din content/ copiat în assets (scripts/cloudflare/content-assets.ts).
// Un script Node, nu `VAR=x cmd` în package.json, ca să meargă și pe Windows.
import { execSync } from "node:child_process";

process.env.BUILD_TARGET = "cloudflare";
const run = (cmd) => execSync(cmd, { stdio: "inherit", env: process.env });
run("npx opennextjs-cloudflare build");
run("npx tsx scripts/cloudflare/content-assets.ts");
