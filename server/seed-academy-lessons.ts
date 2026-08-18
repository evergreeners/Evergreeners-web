import './src/env.js';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { ACADEMY_LESSONS } from './src/lib/academy-lessons-data.js';

async function main() {
    let inserted = 0;
    for (const lesson of ACADEMY_LESSONS) {
        await db.insert(schema.academyLessons)
            .values({
                id: lesson.id,
                week: lesson.week,
                weekTitle: lesson.weekTitle,
                title: lesson.title,
                duration: lesson.duration,
                description: lesson.description,
                content: lesson.content,
                lab: lesson.lab,
                sortOrder: Number(lesson.id.replace('.', '')) ,
            })
            .onConflictDoUpdate({
                target: schema.academyLessons.id,
                set: {
                    week: lesson.week,
                    weekTitle: lesson.weekTitle,
                    title: lesson.title,
                    duration: lesson.duration,
                    description: lesson.description,
                    content: lesson.content,
                    lab: lesson.lab,
                    sortOrder: Number(lesson.id.replace('.', '')),
                },
            });
        inserted++;
    }
    console.log(`Seeded ${inserted} academy lessons.`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});