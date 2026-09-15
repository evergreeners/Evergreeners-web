import cron from 'node-cron';
import { db } from './db/index.js';
import { users, accounts, lessonProgress } from './db/schema.js';
import { eq, and, lt, or, isNull, isNotNull, ne, sql } from 'drizzle-orm';
import { getGithubContributions } from './lib/github.js';
import { updateUserGoals } from './lib/goals.js';
import { sendDailyDigestEmail, sendStreakBrokenEmail, sendAcademyNudgeEmail, sendProgrammersDayEmail, sendProgrammersDayAdminApprovalEmail, getProgrammersDayToken, type AcademyTimeLeft, type DailyAcademyInfo } from './lib/email.js';
import { createNotificationIfMissing } from './lib/notifications.js';

const ACADEMY_LAUNCH_DATE = process.env.ACADEMY_LAUNCH_DATE || '2026-08-31T00:00:00Z';
const LAUNCH_MS = new Date(ACADEMY_LAUNCH_DATE).getTime();

// Streak milestones worth celebrating
const STREAK_MILESTONES = [7, 14, 30, 60, 100, 150, 200, 300, 365];

function academyTimeLeft(): AcademyTimeLeft {
    const difference = LAUNCH_MS - Date.now();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
        days: Math.floor(difference / 86400000),
        hours: Math.floor((difference / 3600000) % 24),
        minutes: Math.floor((difference / 60000) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

const academyLaunchDateLabel = new Date(ACADEMY_LAUNCH_DATE).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
});

export function isProgrammersDay(date: Date = new Date()): boolean {
    const lagosDateStr = date.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const [yearStr, monthStr, dayStr] = lagosDateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const targetDay = isLeap ? 12 : 13;

    return month === 9 && day === targetDay;
}

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

                    // Streak notifications: milestone celebration or broken-streak heads-up
                    if (currentStreak > 0 && STREAK_MILESTONES.includes(currentStreak)) {
                        await createNotificationIfMissing(user.id, {
                            type: 'streak',
                            title: `${currentStreak}-day streak! 🔥`,
                            message: `You just hit a ${currentStreak}-day streak. Keep the flame alive.`,
                            link: '/dashboard',
                        });
                    } else if (currentStreak === 0 && yesterdayCommits > 0) {
                        await createNotificationIfMissing(user.id, {
                            type: 'streak',
                            title: 'Streak broken 😔',
                            message: `Your ${yesterdayCommits}-day streak ended. Start a new one today — the leaderboard is waiting.`,
                            link: '/dashboard',
                        });
                    }
                } catch (err) {
                    console.error(`Failed to sync user ${user.username}:`, err);
                }
            }
            console.log("Hourly sync complete.");
        } catch (error) {
            console.error("Hourly cron job error:", error);
        }
    });

let programmersDayAdminNotifiedDate: string | null = null;
let dailyDigestSentDate: string | null = null;

    // ── Programmer's Day (Day 256) Check at 8:00 AM Nigerian time (Africa/Lagos) ────
    // Only runs on the 256th day of each year (Sep 13 on normal years, Sep 12 on leap years).
    // Sends the admin (muhammadadamualiyu33@gmail.com) an approval email with a secure 1-click
    // broadcast approval button.
    // GUARANTEE: NO celebration emails are sent to users until the admin explicitly approves!
    cron.schedule('0 8 * * *', async () => {
        if (!isProgrammersDay()) {
            return;
        }

        const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
        if (programmersDayAdminNotifiedDate === todayKey) {
            console.log("Admin already notified for Programmer's Day today, skipping duplicate.");
            return;
        }

        console.log("Today is Programmer's Day (Day 256)! Sending approval email to admin...");

        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'muhammadadamualiyu33@gmail.com';
            const year = parseInt(todayKey.split('-')[0], 10);
            const token = getProgrammersDayToken(year);
            const appUrl = process.env.APP_URL || 'https://evergreeners.dev';
            const approvalUrl = `${appUrl}/api/admin/approve-programmers-day?token=${token}&year=${year}`;
            const adminDashboardUrl = `${appUrl}/admin`;

            const allAccountsCount = (await db.select({ count: sql<number>`count(*)::int` })
                .from(users)
                .where(isNotNull(users.email)))[0]?.count || 0;

            await sendProgrammersDayAdminApprovalEmail({
                to: adminEmail,
                year,
                totalEligibleUsers: allAccountsCount,
                approvalUrl,
                adminDashboardUrl,
                dateLabel: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Africa/Lagos' }),
            });

            programmersDayAdminNotifiedDate = todayKey;
            console.log(`[Programmer's Day] Approval request email sent to admin (${adminEmail}). Broadcast pending approval.`);
        } catch (error) {
            console.error("Failed to send Programmer's Day admin approval notification:", error);
        }
    }, {
        timezone: 'Africa/Lagos'
    });

    // ── Daily digest at 8 PM Nigerian time (20:00 WAT / Africa/Lagos) ──────────
    // Smart filtering rules:
    //   - Only send to users who explicitly opted in (emailNotifications = true)
    //   - Only send if user has streak >= 2 (they're actually doing streaks)
    //   - If a user's streak is 0 but they had one yesterday, send a one-time broken email
    cron.schedule('0 20 * * *', async () => {
        console.log("Running daily digest emails...");

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
            if (dailyDigestSentDate === todayKey) {
                console.log("Daily digest already sent today, skipping duplicate run.");
                return;
            }

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

            // Academy progress counts (one query for the whole run)
            const progressRows = await db.select({
                userId: lessonProgress.userId,
                count: sql<number>`count(*)::int`,
            }).from(lessonProgress).groupBy(lessonProgress.userId);
            const academyProgressMap = new Map(progressRows.map((r) => [r.userId, r.count]));
            const ACADEMY_TOTAL_LESSONS = 12;

            const buildDailyAcademyInfo = (user: typeof users.$inferSelect): DailyAcademyInfo | null => {
                const isEnrolled = !!user.academyStatus && user.academyStatus !== 'none';
                const appUrl = process.env.APP_URL || 'https://evergreeners.dev';
                const href = `${appUrl}/academy${isEnrolled ? '/dashboard' : ''}`;
                const daysToLaunch = Math.max(0, Math.ceil((LAUNCH_MS - Date.now()) / 86400000));

                if (!isEnrolled) {
                    return { isEnrolled: false, daysToLaunch, launchDateLabel: academyLaunchDateLabel, timeLeft: academyTimeLeft(), href };
                }

                const completed = academyProgressMap.get(user.id) || 0;
                const daysSinceJoin = user.academyJoinedAt
                    ? Math.max(0, Math.floor((Date.now() - new Date(user.academyJoinedAt).getTime()) / 86400000))
                    : 0;
                const unlockedCount = Math.max(1, Math.min(ACADEMY_TOTAL_LESSONS, daysSinceJoin + 1));
                let lockedUntil: number | null = null;
                if (completed < ACADEMY_TOTAL_LESSONS && completed >= unlockedCount && unlockedCount < ACADEMY_TOTAL_LESSONS) {
                    lockedUntil = 1;
                }

                return {
                    isEnrolled: true,
                    lessonsCompleted: completed,
                    totalLessons: ACADEMY_TOTAL_LESSONS,
                    lockedUntil,
                    daysToLaunch,
                    launchDateLabel: academyLaunchDateLabel,
                    timeLeft: academyTimeLeft(),
                    href,
                };
            };

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
                    
                    let eyeInsight: string | null = null;
                    const isSunday = new Date().getDay() === 0;
                    if (isSunday) {
                        try {
                            const { getOrGenerateEyeInsight } = await import('./lib/eye.js');
                            eyeInsight = await getOrGenerateEyeInsight(user.id);
                        } catch (err) {
                            console.error(`Failed to get/generate Sunday AI insight for user ${user.id}:`, err);
                        }
                    }

                    await sendDailyDigestEmail({
                        to: user.email,
                        name: user.name || user.username || 'Dev',
                        username: user.username || '',
                        streak,
                        todayCommits: user.todayCommits || 0,
                        totalCommits: user.totalCommits || 0,
                        weeklyCommits,
                        eyeInsight,
                        academy: buildDailyAcademyInfo(user),
                    });
                    sent++;
                } catch (err) {
                    console.error(`Failed to send digest to ${user.email}:`, err);
                    failed++;
                }
                await sleep(600);
            }

            dailyDigestSentDate = todayKey;
            console.log(`Daily digest done. Sent: ${sent}, Streak-broken emails: ${broken}, Skipped (no streak): ${skipped}, Failed: ${failed}`);
        } catch (error) {
            console.error("Daily digest cron error:", error);
        }
    }, {
        timezone: 'Africa/Lagos'
    });

    // ── Academy nudge at 6 PM Nigerian time ────────────────────────────────────
    // Enrolled, opted-in students who've been inactive for 3+ days get a
    // gentle reminder (max once every 3 days).
    cron.schedule('0 18 * * *', async () => {
        console.log("Running academy nudge emails...");

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000);

        try {
            const enrolledUsers = await db.select()
                .from(users)
                .where(and(
                    eq(users.emailNotifications, true),
                    ne(users.academyStatus, 'none'),
                    ne(users.academyStatus, 'graduated'),
                    isNotNull(users.academyStatus),
                    isNotNull(users.email)
                ));

            const progressRows = await db.select({
                userId: lessonProgress.userId,
                count: sql<number>`count(*)::int`,
            }).from(lessonProgress).groupBy(lessonProgress.userId);

            const progressMap = new Map(progressRows.map((r) => [r.userId, r.count]));

            let sent = 0;
            for (const user of enrolledUsers) {
                const lastActive = user.academyLastActiveAt || user.academyJoinedAt;
                const inactiveTooLong = !lastActive || lastActive < threeDaysAgo;
                const notNudgedRecently = !user.academyLastNudgedAt || user.academyLastNudgedAt < threeDaysAgo;

                if (!inactiveTooLong || !notNudgedRecently || !user.email) continue;

                try {
                    const daysInactive = lastActive
                        ? Math.max(1, Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000))
                        : 3;
                    const completed = progressMap.get(user.id) || 0;

                    await sendAcademyNudgeEmail({
                        to: user.email,
                        name: user.name || user.username || 'there',
                        lessonsCompleted: completed,
                        totalLessons: 12,
                        daysInactive,
                        dashboardHref: `${process.env.APP_URL || 'https://evergreeners.dev'}/academy/dashboard`,
                    });
                    await db.update(users)
                        .set({ academyLastNudgedAt: new Date(), updatedAt: new Date() })
                        .where(eq(users.id, user.id));
                    sent++;
                } catch (err) {
                    console.error(`Failed academy nudge for ${user.email}:`, err);
                }
                await sleep(600);
            }

            console.log(`Academy nudge done. Sent: ${sent}`);
        } catch (error) {
            console.error("Academy nudge cron error:", error);
        }
    }, {
        timezone: 'Africa/Lagos'
    });
}


