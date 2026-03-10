import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Load .env manually
const { config } = await import('dotenv');
config();

import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'evergreeners' AND table_name = 'quests' ORDER BY ordinal_position`;
console.log("Columns:", cols.map(c => c.column_name));
await sql.end();
