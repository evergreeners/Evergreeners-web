import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function fix() {
    console.log('Manually creating missing tables...');
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "evergreeners"."community_stories" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" text REFERENCES "evergreeners"."users"("id"),
                "name" text NOT NULL,
                "handle" text NOT NULL,
                "platform" text NOT NULL,
                "role" text,
                "featured" boolean DEFAULT false,
                "quote" text NOT NULL,
                "image" text,
                "created_at" timestamp DEFAULT now()
            );
        `);
        console.log('Table community_stories created or already exists.');

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "evergreeners"."events" (
                "id" serial PRIMARY KEY NOT NULL,
                "title" text NOT NULL,
                "date" text NOT NULL,
                "time" text NOT NULL,
                "type" text NOT NULL,
                "description" text,
                "attendees" integer DEFAULT 0,
                "icon" text,
                "created_at" timestamp DEFAULT now()
            );
        `);
        console.log('Table events created or already exists.');

    } catch (err) {
        console.error('Fix failed:', err);
    }
    process.exit(0);
}

fix();
