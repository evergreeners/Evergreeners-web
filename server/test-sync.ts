import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import { getGithubContributions, checkQuestProgress } from './src/lib/github.js';
import { checkAndAwardBadges } from './src/badges/award-badges.js';
import { updateUserGoals } from './src/lib/goals.js';

async function main() {
    console.log("Checking DB users...");
    const users = await db.select().from(schema.users).limit(10);
    console.log(`Found ${users.length} users.`);
    
    for (const u of users) {
        if (!u.isGithubConnected) continue;
        console.log(`Testing user: ${u.username}`);
        
        try {
            const accounts = await db.select().from(schema.accounts).where(eq(schema.accounts.userId, u.id));
            const ghToken = accounts.find(a => a.providerId === 'github')?.accessToken;
            if (!ghToken) continue;
            
            console.log("Fetching contributions...");
            const contrib = await getGithubContributions(u.username, ghToken);
            console.log(`Commits: ${contrib.totalCommits}, Streak: ${contrib.currentStreak}`);

            // Simulate sync logic
            const { totalCommits, currentStreak, activeDays, totalProjects, projects, contributionCalendar } = contrib;
            
            await updateUserGoals(u.id, {
                currentStreak, weeklyCommits: contrib.weeklyCommits, activeDays, totalProjects, contributionCalendar
            });

            const currentUser = await db.select().from(schema.users).where(eq(schema.users.id, u.id)).limit(1);
            const syncedUser = currentUser[0];
            const questCompletedRows = await db.select().from(schema.userQuests)
                .where(eq(schema.userQuests.userId, u.id));

            const goalRows = await db.select().from(schema.goals).where(eq(schema.goals.userId, u.id));
            const completedGoals = goalRows.filter(g => g.completed);
            const accountCreated = syncedUser?.createdAt ? new Date(syncedUser.createdAt) : new Date();

            const badgeStats = {
                totalCommits, lateNightCommits: 0, currentStreak, longestStreak: currentStreak, hadBrokenStreak: false,
                questsCompleted: questCompletedRows.filter(r => r.status === 'completed').length,
                questsAccepted: questCompletedRows.length,
                overachieverQuests: 0, goalsCompleted: completedGoals.length, goalsCompletedEarly: 0,
                accountAgeDays: 0, totalActiveDays: activeDays, isFirstDay: false, isProfilePublic: syncedUser?.isPublic ?? false,
                isGithubConnected: true, hasBio: !!syncedUser?.bio, hasLocation: !!syncedUser?.location, leaderboardRank: null,
                profileViews: 0, fullYearGreen: false, isNewYearsCommit: false, isLunchBreakCommit: false, isFourAmCommit: false,
                hasSpeedRunnerQuest: false, isCountryLeader: false,
            };
            
            console.log("Checking badges...");
            const newBadges = await checkAndAwardBadges(u.id, badgeStats);
            console.log("Badges returned:", newBadges.length);
            
            // Check rank update
            console.log("Fetching rank...");
            const higherStreakCount = await db.select({ count: schema.users.id })
                    .from(schema.users)
                    .where(eq(schema.users.id, u.id));
            console.log("Rank OK.");
        } catch(e) {
            console.error("ERROR for", u.username, ":", e);
        }
    }
    process.exit(0);
}
main().catch(console.error);
