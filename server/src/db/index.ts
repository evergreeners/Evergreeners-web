import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

// dotenv config is handled in index.ts/env.ts

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });
