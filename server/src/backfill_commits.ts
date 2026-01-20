
import { db } from './db/index.js'; // Ensure extension if needed
import * as schema from './db/schema.js';
import { eq, isNotNull } from 'drizzle-orm';

async function backfill() {
    console.log("Starting backfill...");
    const users = await db.select().from(schema.users).where(isNotNull(schema.users.contributionData));

    console.log(`Found ${users.length} users to check.`);

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Last 7 days including today
    const oneWeekAgoDate = new Date();
    oneWeekAgoDate.setDate(oneWeekAgoDate.getDate() - 6);
    const oneWeekAgoStr = oneWeekAgoDate.toISOString().split('T')[0];

    for (const user of users) {
        const allDays = user.contributionData as any[];
        if (!allDays || !Array.isArray(allDays)) continue;

        // Calculate Yesterday
        const yesterdayData = allDays.find((d: any) => d.date === yesterdayStr);
        const yesterdayCommits = yesterdayData ? yesterdayData.contributionCount : 0;

        // Calculate Weekly
        // contributionData might not have dates if it's too old? It should have dates "YYYY-MM-DD"
        const weeklyData = allDays.filter((d: any) => d.date >= oneWeekAgoStr && d.date <= todayStr);
        const weeklyCommits = weeklyData.reduce((acc: number, d: any) => acc + d.contributionCount, 0);

        // Update if different
        // if (user.yesterdayCommits !== yesterdayCommits || user.weeklyCommits !== weeklyCommits) {
        console.log(`Updating user ${user.username}: Yesterday ${yesterdayCommits}, Weekly ${weeklyCommits}`);
        await db.update(schema.users)
            .set({
                yesterdayCommits: yesterdayCommits,
                weeklyCommits: weeklyCommits
            })
            .where(eq(schema.users.id, user.id));
        // }
    }
    console.log("Backfill complete.");
    process.exit(0);
}

backfill().catch(err => {
    console.error(err);
    process.exit(1);
});
