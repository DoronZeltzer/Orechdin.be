import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit config for the Supabase (Postgres) database.
 *
 * - `npm run db:generate` — emit SQL migrations from db/schema into db/migrations
 * - `npm run db:migrate`  — apply pending migrations to DATABASE_URL
 * - `npm run db:push`     — push the schema straight to DATABASE_URL (no migration files)
 *
 * DATABASE_URL must point at the Supabase Postgres instance. For running
 * migrations, prefer the *direct* connection string (port 5432); the
 * transaction pooler (6543) is for the app's serverless runtime.
 */
export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
