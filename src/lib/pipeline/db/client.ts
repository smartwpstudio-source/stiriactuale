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
    const client = postgres(connectionString, { max: 1 });
    cachedDb = drizzle(client, { schema });
  }
  return cachedDb;
}
