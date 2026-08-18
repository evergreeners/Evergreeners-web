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
        console.log("Creating academy_waitlist table...");
        await sql`
            CREATE TABLE IF NOT EXISTS evergreeners.academy_waitlist (
                id serial PRIMARY KEY,
                email text NOT NULL UNIQUE,
                created_at timestamp DEFAULT now()
            )
        `;
        console.log("academy_waitlist table ready!");

        const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'evergreeners' AND table_name = 'academy_waitlist' ORDER BY ordinal_position`;
        console.log("Columns:", cols.map(c => c.column_name));
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await sql.end();
    }
}

main();