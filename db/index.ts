import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Connection defaults to local sqlite file if environment variable not provided
export const sqliteClient = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN, 
});

export const db = drizzle(sqliteClient, { schema });
