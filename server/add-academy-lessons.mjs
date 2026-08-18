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
        console.log("Creating academy_lessons table...");
        await sql`
            CREATE TABLE IF NOT EXISTS evergreeners.academy_lessons (
                id text PRIMARY KEY,
                week integer NOT NULL,
                week_title text NOT NULL,
                title text NOT NULL,
                duration text NOT NULL,
                description text NOT NULL,
                content text NOT NULL,
                lab text NOT NULL,
                sort_order integer NOT NULL DEFAULT 0
            )
        `;
        console.log("academy_lessons table ready!");
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await sql.end();
    }
}

main();