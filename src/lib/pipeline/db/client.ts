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
    const client = postgres(connectionString, { max: 4 }); // pool-ul Supabase (session) are 15 conexiuni în total
    cachedDb = drizzle(client, { schema });
  }
  return cachedDb;
}
