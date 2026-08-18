// ─── Badge Definitions ─────────────────────────────────────────────────────────
// Static config — no DB access. All badge logic lives here.

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface UserStats {
    // Commits
    totalCommits: number;
    lateNightCommits: number;   // commits made between 00:00–04:00

    // Streaks
    currentStreak: number;
    longestStreak: number;
    hadBrokenStreak: boolean;   // true if the user previously broke a streak ≥7

    // Quests
    questsCompleted: number;
    questsAccepted: number;
    overachieverQuests: number; // quests completed ahead of schedule

    // Goals
    goalsCompleted: number;
    goalsCompletedEarly: number; // goals marked complete before due date

    // Account / profile
    accountAgeDays: number;
    totalActiveDays: number;    // total calendar days with at least 1 commit
    isFirstDay: boolean;        // account created today
    isProfilePublic: boolean;
    isGithubConnected: boolean;
    hasBio: boolean;
    hasLocation: boolean;
    leaderboardRank: number | null;
    profileViews: number;
    fullYearGreen: boolean;     // had contributions every day for a full calendar year

    // Presence flags for secret badges
    isNewYearsCommit: boolean;         // committed on Jan 1
    isLunchBreakCommit: boolean;       // committed between 12:00 and 13:00
    isFourAmCommit: boolean;           // a commit happened between 04:00–05:00
    hasSpeedRunnerQuest: boolean;      // completed a quest in < 1 hour
    isCountryLeader: boolean;          // #1 in their country (future feature, flag for now)
    academyGraduated?: boolean;        // graduated from Evergreeners Academy
    academyLessonsCompleted?: number;  // lessons completed in the Academy (of 12)
}

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    rarity: BadgeRarity;
    category: string;
    isSecret?: boolean;
    check: (stats: UserStats) => boolean;
}

// ─── All 35 Badges ─────────────────────────────────────────────────────────────

export const BADGES: BadgeDefinition[] = [
    {
        id: 'academy_graduate',
        name: 'Academy Graduate',
        description: 'Graduated from the Evergreeners Academy by merging your first external PR.',
        rarity: 'rare',
        category: 'Academy',
        check: (s) => !!s.academyGraduated,
    },
    {
        id: 'academy_scholar',
        name: 'Academy Scholar',
        description: 'Completed every lesson in the Evergreeners Academy curriculum.',
        rarity: 'common',
        category: 'Academy',
        check: (s) => (s.academyLessonsCompleted || 0) >= 12,
    },

    // ── Onboarding (5) ──────────────────────────────────────────────────────────
    {
        id: 'first_seed',
        name: 'First Seed',
        description: 'You planted your first seed. Welcome to Evergreeners!',
        rarity: 'common',
        category: 'Onboarding',
        check: () => true, // Everyone gets this just by having an account
    },
    {
        id: 'root_system',
        name: 'Root System',
        description: 'Connected GitHub — your roots are now in the ground.',
        rarity: 'common',
        category: 'Onboarding',
        check: (s) => s.isGithubConnected,
    },
    {
        id: 'first_leaf',
        name: 'First Leaf',
        description: 'Recorded your first commit day. Growth has begun.',
        rarity: 'common',
        category: 'Onboarding',
        check: (s) => s.totalActiveDays >= 1,
    },
    {
        id: 'planted',
        name: 'Planted',
        description: 'Set your first goal. Intention becomes action.',
        rarity: 'common',
        category: 'Onboarding',
        check: (s) => s.goalsCompleted >= 0 && s.goalsCompleted + (s.goalsCompletedEarly) >= 0 && s.questsAccepted >= 0
            // Award when user has at least 1 goal of any kind — checked via goalsCompleted flag
            // The real trigger is "created a goal" which is signalled by goalsCompleted >= 1 OR goalsCompletedEarly >= 1
            // but we can't know if they only have incomplete goals; award when any goal activity exists.
            // For a simpler approach: award when goalsCompleted >= 1 (first completed goal)
            && s.goalsCompleted >= 1,
    },
    {
        id: 'sprouting',
        name: 'Sprouting',
        description: 'Profile fully filled — name, bio, location, and website all set.',
        rarity: 'common',
        category: 'Onboarding',
        check: (s) => s.isProfilePublic && s.isGithubConnected && s.hasBio && s.hasLocation,
    },

    // ── Streaks (5) ──────────────────────────────────────────────────────────────
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Maintained a 7-day coding streak.',
        rarity: 'common',
        category: 'Streaks',
        check: (s) => s.currentStreak >= 7,
    },
    {
        id: 'iron_coder',
        name: 'Iron Coder',
        description: 'Held a 30-day streak. You are relentless.',
        rarity: 'rare',
        category: 'Streaks',
        check: (s) => s.currentStreak >= 30,
    },
    {
        id: 'centurion',
        name: 'Centurion',
        description: '100 days without breaking your streak. Legendary discipline.',
        rarity: 'epic',
        category: 'Streaks',
        check: (s) => s.currentStreak >= 100,
    },
    {
        id: 'evergreener',
        name: 'Evergreener',
        description: '365 days. A full year of daily commits. You are eternal.',
        rarity: 'legendary',
        category: 'Streaks',
        check: (s) => s.currentStreak >= 365,
    },
    {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Broke your streak but bounced back to 7+ days. Resilience earned.',
        rarity: 'rare',
        category: 'Streaks',
        check: (s) => s.hadBrokenStreak && s.currentStreak >= 7,
    },

    // ── Commits (5) ──────────────────────────────────────────────────────────────
    {
        id: 'first_push',
        name: 'First Push',
        description: 'Made your first commit tracked by Evergreeners.',
        rarity: 'common',
        category: 'Commits',
        check: (s) => s.totalCommits >= 1,
    },
    {
        id: 'century_club',
        name: 'Century Club',
        description: '100 total commits. You mean business.',
        rarity: 'common',
        category: 'Commits',
        check: (s) => s.totalCommits >= 100,
    },
    {
        id: 'code_machine',
        name: 'Code Machine',
        description: '1,000 commits. You never stop shipping.',
        rarity: 'rare',
        category: 'Commits',
        check: (s) => s.totalCommits >= 1000,
    },
    {
        id: 'ten_k_club',
        name: '10K Club',
        description: '10,000 commits. An absolute legend of the craft.',
        rarity: 'epic',
        category: 'Commits',
        check: (s) => s.totalCommits >= 10000,
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Made 10+ commits between midnight and 4 AM. The code speaks at night.',
        rarity: 'rare',
        category: 'Commits',
        check: (s) => s.lateNightCommits >= 10,
    },

    // ── Quests & Goals (5) ───────────────────────────────────────────────────────
    {
        id: 'quest_taker',
        name: 'Quest Taker',
        description: 'Accepted your first quest. The adventure begins.',
        rarity: 'common',
        category: 'Quests & Goals',
        check: (s) => s.questsAccepted >= 1,
    },
    {
        id: 'goal_setter',
        name: 'Goal Setter',
        description: 'Completed your first goal. Vision meets execution.',
        rarity: 'common',
        category: 'Quests & Goals',
        check: (s) => s.goalsCompleted >= 1,
    },
    {
        id: 'quest_master',
        name: 'Quest Master',
        description: 'Completed 10 quests. The community counts on you.',
        rarity: 'epic',
        category: 'Quests & Goals',
        check: (s) => s.questsCompleted >= 10,
    },
    {
        id: 'relentless',
        name: 'Relentless',
        description: 'Completed 5 goals. You set them, you crush them.',
        rarity: 'rare',
        category: 'Quests & Goals',
        check: (s) => s.goalsCompleted >= 5,
    },
    {
        id: 'overachiever',
        name: 'Overachiever',
        description: 'Completed a goal ahead of schedule. You finish early and you do it right.',
        rarity: 'epic',
        category: 'Quests & Goals',
        check: (s) => s.goalsCompletedEarly >= 1,
    },

    // ── Social (5) ────────────────────────────────────────────────────────────────
    {
        id: 'in_the_open',
        name: 'In the Open',
        description: 'Made your profile public. Welcome to the grove.',
        rarity: 'common',
        category: 'Social',
        check: (s) => s.isProfilePublic,
    },
    {
        id: 'rising_star',
        name: 'Rising Star',
        description: 'Reached the top 100 on the leaderboard.',
        rarity: 'rare',
        category: 'Social',
        check: (s) => s.leaderboardRank !== null && s.leaderboardRank <= 100,
    },
    {
        id: 'top_10',
        name: 'Top 10',
        description: 'Cracked the top 10. You are elite.',
        rarity: 'epic',
        category: 'Social',
        check: (s) => s.leaderboardRank !== null && s.leaderboardRank <= 10,
    },
    {
        id: 'the_goat',
        name: 'The GOAT',
        description: 'Reached #1 on the leaderboard. Greatest of all time.',
        rarity: 'legendary',
        category: 'Social',
        check: (s) => s.leaderboardRank === 1,
    },
    {
        id: 'spotlight',
        name: 'Spotlight',
        description: 'Your profile has been viewed 50+ times.',
        rarity: 'rare',
        category: 'Social',
        check: (s) => s.profileViews >= 50,
    },

    // ── Digital Garden (5) ────────────────────────────────────────────────────────
    {
        id: 'seedling',
        name: 'Seedling',
        description: '7 active coding days. Roots starting to form.',
        rarity: 'common',
        category: 'Digital Garden',
        check: (s) => s.totalActiveDays >= 7,
    },
    {
        id: 'sapling',
        name: 'Sapling',
        description: '30 active coding days. Something is growing here.',
        rarity: 'common',
        category: 'Digital Garden',
        check: (s) => s.totalActiveDays >= 30,
    },
    {
        id: 'young_tree',
        name: 'Young Tree',
        description: '100 active coding days. Standing tall.',
        rarity: 'rare',
        category: 'Digital Garden',
        check: (s) => s.totalActiveDays >= 100,
    },
    {
        id: 'ancient_oak',
        name: 'Ancient Oak',
        description: '365 active coding days. Deeply rooted, unyielding.',
        rarity: 'epic',
        category: 'Digital Garden',
        check: (s) => s.totalActiveDays >= 365,
    },
    {
        id: 'full_bloom',
        name: 'Full Bloom',
        description: 'Contributed every single day for a full calendar year.',
        rarity: 'legendary',
        category: 'Digital Garden',
        check: (s) => s.fullYearGreen,
    },

    // ── Secret (5) ───────────────────────────────────────────────────────────────
    {
        id: 'new_years_commit',
        name: "New Year's Coder",
        description: "Committed code on January 1st. The new year starts with a push.",
        rarity: 'rare',
        category: 'Secret',
        isSecret: true,
        check: (s) => s.isNewYearsCommit,
    },
    {
        id: 'lunch_break_coder',
        name: 'Lunch Break Coder',
        description: 'Committed code between 12:00 and 13:00. Productivity knows no break.',
        rarity: 'rare',
        category: 'Secret',
        isSecret: true,
        check: (s) => s.isLunchBreakCommit,
    },
    {
        id: 'four_am_commit',
        name: '4AM Commit',
        description: 'Committed between 4 AM and 5 AM. Dedication beyond reason.',
        rarity: 'epic',
        category: 'Secret',
        isSecret: true,
        check: (s) => s.isFourAmCommit,
    },
    {
        id: 'speed_runner',
        name: 'Speed Runner',
        description: 'Completed a quest in under one hour.',
        rarity: 'epic',
        category: 'Secret',
        isSecret: true,
        check: (s) => s.hasSpeedRunnerQuest,
    },
    {
        id: 'country_leader',
        name: 'Country Leader',
        description: '#1 developer in your country on Evergreeners.',
        rarity: 'legendary',
        category: 'Secret',
        isSecret: true,
        check: (s) => s.isCountryLeader,
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** All non-secret badge IDs */
export const PUBLIC_BADGE_IDS = new Set(
    BADGES.filter((b) => !b.isSecret).map((b) => b.id)
);

/** Look up a badge definition by id */
export const getBadgeById = (id: string): BadgeDefinition | undefined =>
    BADGES.find((b) => b.id === id);
