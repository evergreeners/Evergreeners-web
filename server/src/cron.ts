import cron from 'node-cron';
import { db } from './db/index.js';
import { users, accounts } from './db/schema.js';
import { eq } from 'drizzle-orm';

// We need to import the helper, but since it's not exported, we'll redefine it or move it to a shared file.
// Ideally, refactor getGithubContributions to a utils file.
// For now, I will inline the fetch logic or import if I can refactor.
// To avoid breaking existing code heavily, I'll copy the simplified logic or try to export it from index.ts IF I can.
// But index.ts is the entry point. best to create `src/lib/github.ts` and move it there.
// For now, let's keep it simple and just do the cron setup here and import `getGithubContributions` if we export it, OR copy it.
// Actually, safely refactoring `getGithubContributions` to a separate file is the best engineering practice.

import { getGithubContributions } from './lib/github.js';

export function setupCronJobs() {
    console.log("Setting up cron jobs...");

    // Run every hour: '0 * * * *'
    cron.schedule('0 * * * *', async () => {
        console.log("Running hourly GitHub sync for all users...");
        try {
            // Fetch all users who have a GitHub account linked
            // We need to join users and accounts to get the token
            // Drizzle join:
            const usersWithAccounts = await db.select({
                user: users,
                account: accounts
            })
                .from(users)
                .innerJoin(accounts, eq(users.id, accounts.userId))
                .where(eq(users.isGithubConnected, true)); // Ensure we only try if connected

            console.log(`Found ${usersWithAccounts.length} users to sync.`);

            for (const { user, account } of usersWithAccounts) {
                if (!account.accessToken) continue;

                try {
                    // console.log(`Syncing user: ${user.username}`);
                    const { totalCommits, currentStreak, todayCommits, yesterdayCommits, weeklyCommits, contributionCalendar } = await getGithubContributions(user.username || "", account.accessToken);

                    await db.update(users)
                        .set({
                            streak: currentStreak,
                            totalCommits: totalCommits,
                            todayCommits: todayCommits,
                            yesterdayCommits: yesterdayCommits,
                            weeklyCommits: weeklyCommits,
                            contributionData: contributionCalendar,
                            updatedAt: new Date()
                        })
                        .where(eq(users.id, user.id));

                    // Update User Goals based on new stats
                    // Ideally this logic should be a shared function but for now inline to ensure it works
                    // Need to import goals schema first
                    // Assuming goals is exported from db/schema.js
                    const { goals } = await import('./db/schema.js');

                    const userGoals = await db.select().from(goals).where(eq(goals.userId, user.id));

                    for (const goal of userGoals) {
                        let newCurrent = goal.current;

                        if (goal.type === 'streak') {
                            newCurrent = currentStreak;
                        } else if (goal.type === 'commits' && goal.title.toLowerCase().includes('weekly')) {
                            newCurrent = weeklyCommits;
                        } else {
                            continue;
                        }

                        const newCompleted = newCurrent >= goal.target;

                        if (newCurrent !== goal.current || newCompleted !== goal.completed) {
                            await db.update(goals)
                                .set({ current: newCurrent, completed: newCompleted, updatedAt: new Date() })
                                .where(eq(goals.id, goal.id));
                        }
                    }

                } catch (err) {
                    console.error(`Failed to sync user ${user.username}:`, err);
                }
            }
            console.log("Hourly sync complete.");

        } catch (error) {
            console.error("Cron job error:", error);
        }
    });
}
