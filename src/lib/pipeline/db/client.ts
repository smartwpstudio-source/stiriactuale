import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import { onWorkers } from "../../content/store";
import * as schema from "./schema";

// Două drivere, după platformă (același schema, aceleași interogări Drizzle):
// - Node (Vercel, scripturile pipeline-ului din GitHub Actions): postgres.js, pool TCP.
// - Cloudflare Workers: Neon prin HTTP (@neondatabase/serverless). Un pool TCP global
//   nu supraviețuiește între cereri în workerd („Worker's code had hung”); clientul HTTP
//   nu ține conexiuni, deci poate rămâne o dată pe izolat. Limită: fără db.transaction()
//   interactiv (nu e folosit în cod).
// Tipul expus rămâne cel postgres.js: cele două se comportă la fel pentru
// select/insert/update/delete/returning, singurele forme folosite.
type Db = PostgresJsDatabase<typeof schema>;

let cachedDb: Db | null = null;
let cachedHttpDb: Db | null = null;

function connectionString(): string {
  // Citit la apel, nu la nivel de modul — scripturile standalone (dotenv)
  // setează process.env DUPĂ ce modulul e importat; o valoare capturată
  // static la import ar rămâne goală chiar dacă env-ul se populează ulterior.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL / POSTGRES_URL lipsește — provizionează o bază Postgres " +
        "(Vercel Postgres sau Neon) și adaug-o în .env.local înainte de a rula pipeline-ul.",
    );
  }
  return url;
}

export function getDb(): Db {
  if (onWorkers()) {
    cachedHttpDb ??= drizzleNeonHttp(neon(connectionString()), { schema }) as unknown as Db;
    return cachedHttpDb;
  }
  if (!cachedDb) {
    // max > 1: etapa de publicare a pipeline-ului rulează cu concurență
    // (vezi run.ts) — un singur connection ar serializa scrierile în DB și
    // ar anula o parte din câștigul de timp obținut prin paralelizare.
    const client = postgres(connectionString(), { max: 6 });
    cachedDb = drizzlePostgres(client, { schema });
  }
  return cachedDb;
}
