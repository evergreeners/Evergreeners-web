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
        console.log("Adding academy progress columns to users...");
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS academy_lessons_completed integer DEFAULT 0`;
        await sql`ALTER TABLE evergreeners.users ADD COLUMN IF NOT EXISTS academy_last_active_at timestamp`;

        console.log("Creating lesson_progress table...");
        await sql`
            CREATE TABLE IF NOT EXISTS evergreeners.lesson_progress (
                id serial PRIMARY KEY,
                user_id text NOT NULL REFERENCES evergreeners.users(id) ON DELETE CASCADE,
                lesson_id text NOT NULL,
                completed_at timestamp DEFAULT now() NOT NULL,
                CONSTRAINT lesson_progress_user_lesson_unique UNIQUE (user_id, lesson_id)
            )
        `;
        console.log("Academy progress migration complete!");
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await sql.end();
    }
}

main();