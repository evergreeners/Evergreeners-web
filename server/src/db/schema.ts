import { pgSchema, serial, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

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
    totalCommits: integer('total_commits').default(0),
    todayCommits: integer('today_commits').default(0), // New field for daily tracking
    yesterdayCommits: integer('yesterday_commits').default(0),
    weeklyCommits: integer('weekly_commits').default(0),
    activeDays: integer('active_days').default(0), // New: Days coded this week
    totalProjects: integer('total_projects').default(0), // New: Repos contributed to
    projectsData: jsonb('projects_data'), // New: List of repos contributed to
    contributionData: jsonb('contribution_data'), // Store full calendar data
    isGithubConnected: boolean('is_github_connected').default(false),
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
