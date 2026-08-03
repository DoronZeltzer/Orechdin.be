import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Postgres connection string. In production this is the Supabase connection
// string (use the *Transaction pooler* URL on port 6543 for serverless).
// The localhost fallback keeps `next build` working when DATABASE_URL is not
// set — the build never queries the DB, and postgres-js connects lazily, so no
// connection is attempted until a real request runs a query.
const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

// Enable SSL for any real (non-local) host — Supabase requires it — so the
// DATABASE_URL can be pasted verbatim without an `?sslmode=require` suffix.
// Local fallback stays plaintext (and never actually connects during build).
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

// `prepare: false` is required for Supabase's transaction pooler (PgBouncer),
// which does not support prepared statements.
export const client = postgres(connectionString, {
  prepare: false,
  ssl: isLocal ? false : 'require',
});

export const db = drizzle(client, { schema });
