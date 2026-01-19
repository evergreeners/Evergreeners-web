
import postgres from './server/node_modules/postgres/src/index.js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const sql = postgres(process.env.DATABASE_URL!.replace(/"/g, ''));

async function applyMigration() {
    try {
        console.log("Applying columns...");
        await sql`ALTER TABLE "evergreeners"."users" ADD COLUMN IF NOT EXISTS "streak" integer DEFAULT 0;`;
        await sql`ALTER TABLE "evergreeners"."users" ADD COLUMN IF NOT EXISTS "total_commits" integer DEFAULT 0;`;
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sql.end();
    }
}

applyMigration();
