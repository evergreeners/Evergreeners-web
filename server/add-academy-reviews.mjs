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
        console.log("Creating academy_reviews table...");
        await sql`
            CREATE TABLE IF NOT EXISTS evergreeners.academy_reviews (
                id serial PRIMARY KEY,
                user_id text NOT NULL REFERENCES evergreeners.users(id) ON DELETE CASCADE,
                cert_id text NOT NULL,
                pr_url text NOT NULL,
                score integer NOT NULL,
                summary text,
                strengths jsonb,
                improvements jsonb,
                checked_at timestamp DEFAULT now() NOT NULL,
                CONSTRAINT academy_reviews_cert_id_unique UNIQUE (cert_id)
            )
        `;
        console.log("academy_reviews table ready!");
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await sql.end();
    }
}

main();