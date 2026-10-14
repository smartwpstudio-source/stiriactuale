import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!cachedDb) {
    // Citit la apel, nu la nivel de modul — scripturile standalone (dotenv)
    // setează process.env DUPĂ ce modulul e importat; o valoare capturată
    // static la import ar rămâne goală chiar dacă env-ul se populează ulterior.
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL / POSTGRES_URL lipsește — provizionează o bază Postgres " +
          "(Vercel Postgres sau Neon) și adaug-o în .env.local înainte de a rula pipeline-ul.",
      );
    }
    // max > 1: etapa de publicare a pipeline-ului rulează cu concurență
    // (vezi run.ts) — un singur connection ar serializa scrierile în DB și
    // ar anula o parte din câștigul de timp obținut prin paralelizare.
    const client = postgres(...nodeConnection(connectionString));
    cachedDb = drizzle(client, { schema });
  }
  return cachedDb;
}

// Supabase: Node (pipeline, build) prin Transaction pooler (portul 6543, sute de
// clienți), nu prin Session pooler (15 clienți în total, împărțiți cu Hyperdrive).
// Același secret DATABASE_URL (portul 5432); în modul tranzacție fără prepared statements.
function nodeConnection(url: string): [string, postgres.Options<Record<string, postgres.PostgresType>>] {
  const u = new URL(url);
  if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "5432") {
    u.port = "6543";
    return [u.toString(), { max: 4, prepare: false }];
  }
  return [url, { max: 4 }];
}
