import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import { mySchema, quests, userQuests, users, accounts } from './src/db/schema.js';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema: { mySchema, quests, userQuests, users, accounts } });

async function main() {
    try {
        const allQuests = await db.select().from(quests);
        console.log("DB response", allQuests);
        process.exit(0);
    } catch(e) {
        console.error("DB error", e);
        process.exit(1);
    }
}
main();
