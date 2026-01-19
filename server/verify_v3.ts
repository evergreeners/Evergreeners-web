
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL!.replace(/"/g, '');
const sql = postgres(dbUrl);

async function verify() {
    try {
        const result = await sql.unsafe('SELECT streak, total_commits FROM evergreeners.users LIMIT 1;');
        console.log("Success! Columns exist and are reachable.");
        console.log("Data:", result);
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await sql.end();
    }
}

verify();
