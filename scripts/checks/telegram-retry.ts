// Mesajul către editor nu se pierde la o eroare de rețea: npx tsx scripts/checks/telegram-retry.ts
import assert from "node:assert/strict";
import { notifyEditor } from "../../src/lib/telegram";

process.env.TELEGRAM_BOT_TOKEN = "test";
process.env.TELEGRAM_ADMIN_CHAT_ID = "1";
const a = { id: 1, title: "Titlu", lead: "Lead" };
const ok = () => new Response(JSON.stringify({ ok: true, result: {} }));
const fail = (status: number, extra = {}) => new Response(JSON.stringify({ ok: false, description: `eroare ${status}`, ...extra }), { status });
const quiet = console.error;
console.error = () => {};

async function calls(answers: (() => Response)[]) {
  let n = 0;
  globalThis.fetch = (async () => {
    const answer = answers[n++];
    return answer();
  }) as typeof fetch;
  await notifyEditor("publicat-auto", a);
  return n;
}
const network = () => {
  throw new TypeError("fetch failed");
};

void (async () => {
  assert.equal(await calls([ok]), 1, "reușit din prima");
  assert.equal(await calls([network, ok]), 2, "rețea: se reia");
  assert.equal(await calls([() => fail(429, { parameters: { retry_after: 1 } }), ok]), 2, "429: se reia");
  assert.equal(await calls([() => fail(400)]), 1, "400: nu se reia");
  assert.equal(await calls([network, network, network]), 3, "cel mult 3 încercări");

  console.error = quiet;
  console.log("telegram-retry: OK");
})();
