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
        console.log("Adding academy columns to users table...");
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS academy_status text DEFAULT 'none'`;
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS academy_joined_at timestamp`;
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS academy_pr_url text`;
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS academy_cert_id text`;
        console.log("Academy columns added successfully!");

        const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'evergreeners' AND table_name = 'users' ORDER BY ordinal_position`;
        console.log("All users table columns:", cols.map(c => c.column_name));
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await sql.end();
    }
}

main();
