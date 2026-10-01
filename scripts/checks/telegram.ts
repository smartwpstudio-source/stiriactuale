// Verificare rapidă a parserului de canale Telegram: npx tsx scripts/checks/telegram.ts
import assert from "node:assert/strict";
import { parseChannel, urlKey } from "../../src/lib/pipeline/telegram-signal";

const now = Date.parse("2026-10-01T18:00:00Z");
const post = (time: string, views: string, link: string, reactions = "") =>
  `<div class="tgme_widget_message_wrap"><a href="${link}">x</a>${reactions}<span class="tgme_widget_message_views">${views}</span><time datetime="${time}">`;
const html =
  post("2026-10-01T16:00:00+00:00", "5.8K", "https://www.zdg.md/stiri/abc/?utm_source=tg",
    '<span class="tgme_reaction"><i class="emoji"><b>x</b></i>51</span><span class="tgme_reaction"><i class="emoji"><b>y</b></i>12</span>') +
  post("2026-10-01T17:50:00+00:00", "120", "https://zdg.md/stiri/prea-noua") + // < 45 min: ignorată
  post("2026-10-01T10:00:00+00:00", "1.2M", "https://zdg.md/stiri/mare");

const posts = parseChannel(html, now);
assert.equal(posts.length, 2);
assert.deepEqual(posts[0], { keys: ["zdg.md/stiri/abc"], views: 5800, reactions: 63, ageMin: 120 });
assert.equal(posts[1].views, 1_200_000);
assert.equal(urlKey("https://www.Unimedia.info/stiri/x/"), "unimedia.info/stiri/x");
console.log("telegram: OK");
