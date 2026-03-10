import { pgTable, serial, text, boolean, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

const mySchema = pgTable('quests', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
});

async function main() {
    try {
        const res = await db.execute('SELECT * FROM evergreeners.quests LIMIT 1');
        console.log("DB response", res);
        process.exit(0);
    } catch(e) {
        console.error("DB error", e);
        process.exit(1);
    }
}
main();
