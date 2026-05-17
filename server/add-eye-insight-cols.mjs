import { config } from 'dotenv';
config();
import postgres from 'postgres';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not defined in environment.");
        process.exit(1);
    }

    const sql = postgres(connectionString);
    try {
        console.log("Adding columns to users table...");
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS eye_insight text`;
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS eye_insight_updated_at timestamp`;
        console.log("Columns added successfully!");

        const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'evergreeners' AND table_name = 'users' ORDER BY ordinal_position`;
        console.log("All users table columns:", cols.map(c => c.column_name));
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await sql.end();
    }
}

main();
