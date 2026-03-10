const { config } = await import('dotenv');
config();
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
await sql`ALTER TABLE evergreeners.quests ADD COLUMN IF NOT EXISTS is_open_quest boolean NOT NULL DEFAULT false`;
console.log("Column added successfully!");
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'evergreeners' AND table_name = 'quests' ORDER BY ordinal_position`;
console.log("All columns:", cols.map(c => c.column_name));
await sql.end();
