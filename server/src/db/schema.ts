import { pgSchema, serial, text, timestamp, boolean, jsonb, integer, uuid, unique } from 'drizzle-orm/pg-core';

export const mySchema = pgSchema('evergreeners');

export const users = mySchema.table('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    role: text('role').default('user'), // Custom field
    username: text('username').unique(),
    bio: text('bio'),
    location: text('location'),
    website: text('website'),
    isPublic: boolean('is_public').default(true).notNull(),
    anonymousName: text('anonymous_name'),
    streak: integer('streak').default(0),
    longestStreak: integer('longest_streak').default(0), // Best streak ever achieved
    totalCommits: integer('total_commits').default(0),
    todayCommits: integer('today_commits').default(0), // New field for daily tracking
    yesterdayCommits: integer('yesterday_commits').default(0),
    weeklyCommits: integer('weekly_commits').default(0),
    activeDays: integer('active_days').default(0), // New: Days coded this week
    totalProjects: integer('total_projects').default(0), // New: Repos contributed to
    projectsData: jsonb('projects_data'), // New: List of repos contributed to
    languages: jsonb('languages_data'), // Mapped to existing column
    totalPullRequests: integer('total_prs').default(0), // Mapped to existing column

    contributionData: jsonb('contribution_data'), // Store full calendar data
    isGithubConnected: boolean('is_github_connected').default(false),
    bestRank: integer('best_rank'), // Best leaderboard rank ever achieved
    emailNotifications: boolean('email_notifications').default(false), // Streak reminder emails — opt-in
    eyeInsight: text('eye_insight'),
    eyeInsightUpdatedAt: timestamp('eye_insight_updated_at'),
    eyeInsightCount: integer('eye_insight_count').default(0),
    academyStatus: text('academy_status').default('none'), // 'none', 'audit_completed', 'enrolled', 'premium', 'graduated'
    academyJoinedAt: timestamp('academy_joined_at'),
    academyPrUrl: text('academy_pr_url'),
    academyCertId: text('academy_cert_id'),
    academyLessonsCompleted: integer('academy_lessons_completed').default(0),
    academyLastActiveAt: timestamp('academy_last_active_at'),
    academyLastNudgedAt: timestamp('academy_last_nudged_at'),
});

export const sessions = mySchema.table('sessions', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => users.id),
});

export const accounts = mySchema.table('accounts', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const verifications = mySchema.table('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
});

export const projects = mySchema.table('projects', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    content: text('content'),
    imageUrl: text('image_url'),
    featured: boolean('featured').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const galleryItems = mySchema.table('gallery_items', {
    id: serial('id').primaryKey(),
    title: text('title'),
    description: text('description'),
    images: jsonb('images'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const stories = mySchema.table('stories', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    content: text('content'),
    coverImage: text('cover_image'),
    published: boolean('published').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const communityStories = mySchema.table('community_stories', {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => users.id), // Optional: links to a registered user
    email: text('email'), // For notifications and linking
    name: text('name').notNull(),
    handle: text('handle').notNull(),
    platform: text('platform').notNull(), // 'github' or 'twitter'
    role: text('role'),
    featured: boolean('featured').default(false),
    quote: text('quote').notNull(),
    image: text('image'),
    approved: boolean('approved').default(false),
    heroFeatured: boolean('hero_featured').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const events = mySchema.table('events', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    date: text('date').notNull(),
    time: text('time').notNull(),
    type: text('type').notNull(), // 'Live Session', 'Hackathon', etc.
    description: text('description'),
    attendees: integer('attendees').default(0),
    icon: text('icon'), // Name of the icon (e.g., 'Flame', 'Calendar')
    createdAt: timestamp('created_at').defaultNow(),
});

export const goals = mySchema.table('goals', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    type: text('type').notNull(),
    target: integer('target').notNull(),
    current: integer('current').default(0).notNull(),
    dueDate: text('due_date'),
    completed: boolean('completed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const quests = mySchema.table('quests', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    repoUrl: text('repo_url').notNull(),
    tags: jsonb('tags').$type<string[]>(),
    difficulty: text('difficulty').notNull(),
    points: integer('points').default(10),
    isOpenQuest: boolean('is_open_quest').default(false),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const userQuests = mySchema.table('user_quests', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    questId: integer('quest_id').notNull().references(() => quests.id),
    status: text('status').default('active'),
    startedAt: timestamp('started_at').defaultNow(),
    completedAt: timestamp('completed_at'),
    forkUrl: text('fork_url'),
});

// ─── Badge System ───────────────────────────────────────────────────────────────

export const userBadges = mySchema.table('user_badges', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    badgeId: text('badge_id').notNull(),
    earnedAt: timestamp('earned_at').defaultNow().notNull(),
}, (table) => ({
    // Ensure a user can't earn the same badge twice
    uniqueUserBadge: unique('user_badges_user_id_badge_id_unique').on(table.userId, table.badgeId),
}));

// ─── Academy Waitlist ──────────────────────────────────────────────────────────
// Email capture shown to visitors before the Academy launch gate opens.

export const academyWaitlist = mySchema.table('academy_waitlist', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow(),
});

// Per-lesson progress (server-backed, replaces localStorage-only tracking)
export const lessonProgress = mySchema.table('lesson_progress', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (table) => ({
    uniqueLessonProgress: unique('lesson_progress_user_lesson_unique').on(table.userId, table.lessonId),
}));
// AI-generated review for a submitted capstone PR
export const academyReviews = mySchema.table('academy_reviews', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    certId: text('cert_id').notNull(),
    prUrl: text('pr_url').notNull(),
    score: integer('score').notNull(),
    summary: text('summary'),
    strengths: jsonb('strengths').$type<string[]>(),
    improvements: jsonb('improvements').$type<string[]>(),
    checkedAt: timestamp('checked_at').defaultNow().notNull(),
}, (table) => ({
    uniqueReviewCert: unique('academy_reviews_cert_id_unique').on(table.certId),
}));

// Curriculum lessons (DB-backed source of truth for the student portal)
export const academyLessons = mySchema.table('academy_lessons', {
    id: text('id').primaryKey(),       // e.g. "1.1"
    week: integer('week').notNull(),   // 1–4
    weekTitle: text('week_title').notNull(),
    title: text('title').notNull(),
    duration: text('duration').notNull(),
    description: text('description').notNull(),
    content: text('content').notNull(),
    lab: text('lab').notNull(),        // LearnGitBranching level slug
    sortOrder: integer('sort_order').notNull().default(0),
});

// ─── The Eye: Watchlist ────────────────────────────────────────────────────────

export const watchlist = mySchema.table('watchlist', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    githubUsername: text('github_username').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    addedAt: timestamp('added_at').defaultNow(),
    // Cached stats (refreshed periodically)
    cachedStats: jsonb('cached_stats'),
    lastRefreshed: timestamp('last_refreshed'),
}, (table) => ({
    uniqueWatchlistEntry: unique('watchlist_user_id_github_username_unique').on(table.userId, table.githubUsername),
}));
