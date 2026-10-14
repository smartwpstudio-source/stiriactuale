// Verifică adresele bazei fără să le afișeze (rulat din .github/workflows/db-move.yml, pas „verificare”):
// se pot citi ca URL (cum le citește postgres.js)? ce fel de caractere are parola?
for (const [k, v] of [["DATABASE_URL", process.env.A], ["SUPABASE_DATABASE_URL", process.env.B]]) {
  const raw = v || "";
  try {
    const u = new URL(raw);
    const pw = decodeURIComponent(u.password);
    const special = [...new Set(pw.replace(/[A-Za-z0-9]/g, ""))].length > 0;
    console.log(k, "OK", "host:", u.hostname, "port:", u.port, "user:", u.username, "db:", u.pathname, "parola:", pw.length, "caractere, speciale:", special ? "DA" : "nu");
  } catch (e) {
    console.log(k, "INVALID:", e.message, "| lungime:", raw.length, "| incepe cu postgresql://:", raw.startsWith("postgresql://"),
      "| spatii:", /\s/.test(raw), "| ghilimele:", /["']/.test(raw), "| @ de", (raw.match(/@/g) || []).length, "ori",
      "| [ ]:", /[[\]]/.test(raw), "| # :", raw.includes("#"), "| ? :", raw.includes("?"), "| % :", raw.includes("%"));
  }
}
console.log("aceeasi adresa:", process.env.A === process.env.B);
