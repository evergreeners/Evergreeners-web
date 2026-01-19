
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const sql = postgres(process.env.DATABASE_URL);

        console.log("Adding is_github_connected column...");

        await sql`
            ALTER TABLE evergreeners.users 
            ADD COLUMN IF NOT EXISTS is_github_connected BOOLEAN DEFAULT false NOT NULL;
        `;

        console.log("Column added successfully.");

        console.log("Backfilling is_github_connected...");
        const result = await sql`
            UPDATE evergreeners.users
            SET is_github_connected = true
            WHERE id IN (
                SELECT user_id FROM evergreeners.accounts WHERE provider_id = 'github'
            )
        `;
        console.log(`Updated ${result.count} users.`);

        await sql.end();
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
