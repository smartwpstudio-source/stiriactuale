import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Acceptă DATABASE_URL (Neon direct) sau POSTGRES_URL (variabila injectată
// automat de integrarea Vercel Postgres) — vezi .env.example.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL / POSTGRES_URL lipsește — provizionează o bază Postgres " +
        "(Vercel Postgres sau Neon) și adaug-o în .env.local înainte de a rula pipeline-ul.",
    );
  }
  if (!cachedDb) {
    const client = postgres(connectionString, { max: 1 });
    cachedDb = drizzle(client, { schema });
  }
  return cachedDb;
}
