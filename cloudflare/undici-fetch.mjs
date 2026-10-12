// Doar în build-ul Cloudflare (next.config.ts, turbopack.resolveAlias): @vercel/blob
// importă `fetch` din pachetul undici, al cărui client HTTP compilează WebAssembly la
// încărcare — interzis pe Workers („Wasm code generation disallowed by embedder”), deci
// upload-urile în Blob ar eșua. Pe Workers fetch-ul global e cel nativ; la fel face și
// varianta pentru browser a @vercel/blob (dist/undici-browser.js).
export const fetch = globalThis.fetch.bind(globalThis);
