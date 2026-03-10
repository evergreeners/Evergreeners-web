import postgres from 'postgres';
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'evergreeners' AND table_name = 'quests' ORDER BY ordinal_position`;
console.log(cols.map(c => c.column_name));
await sql.end();
