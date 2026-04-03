import cron from 'node-cron';
import { db } from './db/index.js';
import { users, accounts } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getGithubContributions } from './lib/github.js';
import { updateUserGoals } from './lib/goals.js';
import { sendDailyDigestEmail, sendStreakBrokenEmail } from './lib/email.js';

export function setupCronJobs() {
    console.log("Setting up cron jobs...");

    // ── Hourly GitHub sync ─────────────────────────────────────────────────────
    cron.schedule('0 * * * *', async () => {
        console.log("Running hourly GitHub sync for all users...");
        try {
            const usersWithAccounts = await db.select({ user: users, account: accounts })
                .from(users)
                .innerJoin(accounts, eq(users.id, accounts.userId))
                .where(eq(users.isGithubConnected, true));

            console.log(`Found ${usersWithAccounts.length} users to sync.`);

            for (const { user, account } of usersWithAccounts) {
                if (!account.accessToken) continue;
                try {
                    const {
                        totalCommits, currentStreak, todayCommits, yesterdayCommits,
                        weeklyCommits, activeDays, totalProjects, contributionCalendar
                    } = await getGithubContributions(user.username || "", account.accessToken);

                    await db.update(users)
                        .set({
                            streak: currentStreak,
                            totalCommits,
                            todayCommits,
                            yesterdayCommits,
                            weeklyCommits,
                            activeDays,
                            totalProjects,
                            contributionData: contributionCalendar,
                            updatedAt: new Date()
                        })
                        .where(eq(users.id, user.id));

                    await updateUserGoals(user.id, {
                        currentStreak, weeklyCommits, activeDays, totalProjects, contributionCalendar
                    });
                } catch (err) {
                    console.error(`Failed to sync user ${user.username}:`, err);
                }
            }
            console.log("Hourly sync complete.");
        } catch (error) {
            console.error("Hourly cron job error:", error);
        }
    });

    // ── Daily digest at 7 PM ──────────────────────────────────────────────────
    // Smart filtering rules:
    //   1. Only send to users who explicitly opted in (emailNotifications = true)
    //   2. Only send if user has streak >= 2 (they're actually doing streaks)
    //   3. If a user's streak is 0 but they had one yesterday (just broke it),
    //      send a one-time "streak broken" email, then disable their emails
    //      so they're not spammed. They can re-enable in Settings.
    cron.schedule('0 19 * * *', async () => {
        console.log("Running daily digest emails...");

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            // Get all GitHub-connected users who opted in
            const usersToCheck = await db.select({ user: users, account: accounts })
                .from(users)
                .innerJoin(accounts, and(
                    eq(users.id, accounts.userId),
                    eq(accounts.providerId, 'github')
                ))
                .where(and(
                    eq(users.isGithubConnected, true),
                    eq(users.emailNotifications, true)
                ));

            console.log(`Checking ${usersToCheck.length} opted-in users for daily digest.`);

            let sent = 0;
            let skipped = 0;
            let broken = 0;
            let failed = 0;

            for (const { user } of usersToCheck) {
                if (!user.email) { failed++; continue; }

                const streak = user.streak ?? 0;
                const yesterdayCommits = user.yesterdayCommits ?? 0;
                const weeklyCommits = user.weeklyCommits ?? 0;

                // ── Streak broken: had a streak, now it's gone ──
                // Condition: streak is 0 but they had commits yesterday (meaning
                // yesterday was their last day, today broke it)
                const justBrokeStreak = streak === 0 && yesterdayCommits > 0;

                if (justBrokeStreak) {
                    // Send one-time "streak broken" email, then silence them
                    try {
                        console.log(`Streak broken for ${user.email}. Sending broken email + disabling notifications.`);
                        await sendStreakBrokenEmail({
                            to: user.email,
                            name: user.name || user.username || 'Dev',
                            username: user.username || '',
                            previousStreak: yesterdayCommits, // best proxy we have without storing prev streak
                        });
                        // Auto-disable so they're not nagged again until they opt back in
                        await db.update(users)
                            .set({ emailNotifications: false, updatedAt: new Date() })
                            .where(eq(users.id, user.id));
                        broken++;
                    } catch (err) {
                        console.error(`Failed streak-broken email to ${user.email}:`, err);
                        failed++;
                    }
                    await sleep(600);
                    continue;
                }

                // ── Guard: only email users who are actually doing streaks ──
                // Require at least a 2-day streak to be worth emailing.
                // Users with streak < 2 aren't tracking streaks yet — don't spam them.
                if (streak < 2) {
                    skipped++;
                    continue;
                }

                // ── Normal daily digest for active streak users ──
                try {
                    console.log(`Sending daily digest to ${user.email} (streak: ${streak})...`);
                    await sendDailyDigestEmail({
                        to: user.email,
                        name: user.name || user.username || 'Dev',
                        username: user.username || '',
                        streak,
                        todayCommits: user.todayCommits || 0,
                        totalCommits: user.totalCommits || 0,
                        weeklyCommits,
                    });
                    sent++;
                } catch (err) {
                    console.error(`Failed to send digest to ${user.email}:`, err);
                    failed++;
                }
                await sleep(600);
            }

            console.log(`Daily digest done. Sent: ${sent}, Streak-broken emails: ${broken}, Skipped (no streak): ${skipped}, Failed: ${failed}`);
        } catch (error) {
            console.error("Daily digest cron error:", error);
        }
    });
}


