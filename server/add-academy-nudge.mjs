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
        console.log("Adding academy nudge column to users...");
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS academy_last_nudged_at timestamp`;
        console.log("Academy nudge column ready!");
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await sql.end();
    }
}

main();