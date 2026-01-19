
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const dbUrl = process.env.DATABASE_URL!.replace(/"/g, '');
const sql = postgres(dbUrl);

async function applyMigration() {
    try {
        console.log("Connecting to:", dbUrl.split('@')[1]); // Log host only for safety
        console.log("Applying columns...");
        await sql.unsafe('ALTER TABLE "evergreeners"."users" ADD COLUMN IF NOT EXISTS "streak" integer DEFAULT 0;');
        await sql.unsafe('ALTER TABLE "evergreeners"."users" ADD COLUMN IF NOT EXISTS "total_commits" integer DEFAULT 0;');
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sql.end();
    }
}

applyMigration();
