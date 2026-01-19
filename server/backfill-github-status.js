
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const sql = postgres(process.env.DATABASE_URL);

        console.log("Backfilling is_github_connected...");

        // Set is_github_connected = true for all users who have a github account linked
        const result = await sql`
            UPDATE evergreeners.users
            SET is_github_connected = true
            WHERE id IN (
                SELECT user_id FROM evergreeners.accounts WHERE provider_id = 'github'
            )
        `;

        console.log(`Updated ${result.count} users.`);

        // Fix potential nulls for others to false
        await sql`
            UPDATE evergreeners.users
            SET is_github_connected = false
            WHERE is_github_connected IS NULL
        `;

        console.log("Backfill complete.");
        await sql.end();
    } catch (err) {
        console.error('Error:', err);
    }
};

run();
