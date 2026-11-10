// Parserul canalelor Telegram ca surse de știri: npx tsx scripts/checks/telegram-source.ts
import assert from "node:assert/strict";
import { parseChannelPosts } from "../../src/lib/pipeline/telegram-source";

const post = (id: number, text: string, reply = "") => `<div class="tgme_widget_message_wrap js-widget_message_wrap"><div class="tgme_widget_message" data-post="Politia_Republicii_Moldova/${id}">${reply ? `<div class="tgme_widget_message_text js-message_reply_text" dir="auto">${reply}</div>` : ""}<div class="tgme_widget_message_text js-message_text" dir="auto">${text}</div><time datetime="2026-11-10T08:00:00+00:00" class="time">10:00</time></div></div>`;
const html =
  post(1, "Accident rutier grav la Drochia. Un pieton de 40 de ani a fost lovit de un autoturism pe strada Independenței.<br/>Poliția caută martori &amp; cere informații.") +
  post(2, "Felicitări colegilor!") +
  post(3, "Polițiștii au reținut un bărbat suspectat de furt dintr-un magazin din Bălți, valoarea prejudiciului fiind de 5.000 de lei.", "citat vechi");
const items = parseChannelPosts(html, "Politia_Republicii_Moldova", "politia-tg", "Poliția Republicii Moldova");
assert.equal(items.length, 2, "postarea scurtă nu e știre");
assert.equal(items[0].title, "Accident rutier grav la Drochia.");
assert.equal(items[0].sourceUrl, "https://t.me/Politia_Republicii_Moldova/1");
assert.match(items[0].summary, /martori & cere/);
assert.ok(!items[1].summary.includes("citat vechi"), "fără textul citat");
assert.equal(items[1].publishedAt.toISOString(), "2026-11-10T08:00:00.000Z");
console.log("telegram-source: OK");
