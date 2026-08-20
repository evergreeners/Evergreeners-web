import './env.js'; // Trigger restart
import fastify, { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { randomUUID } from 'crypto';
import { Octokit } from 'octokit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';
import { createClient } from '@supabase/supabase-js';

import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { eq, and, desc, gt, sql, ne, isNotNull, isNull } from 'drizzle-orm';
import { getGithubContributions, checkQuestProgress } from './lib/github.js';
import { setupCronJobs } from './cron.js';
import { updateUserGoals } from './lib/goals.js';
import { sendWelcomeEmail, sendAcademyWaitlistConfirmationEmail, sendAcademyGraduationEmail } from './lib/email.js';
import { getOrGenerateEyeInsight } from './lib/eye.js';
import { checkAndAwardBadges, type UserStats } from './badges/award-badges.js';
import { reviewPullRequest } from './lib/academy-review.js';
import { BADGES, getBadgeById } from './badges/badge-definitions.js';

/**
 * Helper function to get session from request.
 * Tries multiple methods in order:
 * 1. Better-auth cookie-based session (works locally and when cookies are sent properly)
 * 2. Bearer token lookup in database (fallback for production cross-origin issues)
 */
async function getSessionFromRequest(req: FastifyRequest): Promise<{ session: { userId: string } } | null> {
    // Build headers for better-auth
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
        } else if (typeof value === 'string') {
            headers.set(key, value);
        }
    });

    // Try 1: Standard better-auth session via cookies
    try {
        const session = await auth.api.getSession({ headers });
        if (session) {
            console.log("Session found via cookies");
            return session;
        }
    } catch (e) {
        console.log("Cookie-based session lookup failed:", e);
    }

    // Try 2: Bearer token lookup in database
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        console.log(`Attempting Bearer token lookup for token: ${token.substring(0, 10)}...`);

        try {
            // Look up the session directly in the database
            const sessionRecord = await db.select()
                .from(schema.sessions)
                .where(eq(schema.sessions.token, token))
                .limit(1);

            if (sessionRecord.length > 0) {
                const sess = sessionRecord[0];
                // Check if session is expired
                if (sess.expiresAt && new Date(sess.expiresAt) > new Date()) {
                    console.log("Session found via Bearer token DB lookup");
                    return { session: { userId: sess.userId } };
                } else {
                    console.log("Bearer token session found but expired");
                }
            } else {
                console.log("No session found for Bearer token");
            }
        } catch (e) {
            console.log("Bearer token DB lookup failed:", e);
        }
    }

    // No valid session found
    console.log("No valid session found by any method");
    return null;
}


const server = fastify({
    logger: true,
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024 // 5MB limit for Base64 image uploads
});

const getBaseURL = (url: string | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.includes("localhost") || url.includes("127.0.0.1")) return `http://${url}`;
    return `https://${url}`;
};

const finalBaseURL = getBaseURL(process.env.BETTER_AUTH_URL);
const allowedOrigins = [
    "https://www.evergreeners.dev",
    "https://evergreeners.dev",
    "https://evergreeners.vercel.app",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    ...(finalBaseURL ? [finalBaseURL] : []),
    ...(process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim().replace(/["']/g, ""))
        : [])
].filter(Boolean);

const isOriginAllowed = (origin: string) => {
    if (!origin) return false;
    const lowerOrigin = origin.toLowerCase();
    // Check exact list
    if (allowedOrigins.some(o => o.toLowerCase() === lowerOrigin)) return true;
    // Check regex patterns for evergreeners and vercel
    if (lowerOrigin.match(/^https?:\/\/(.*\.)?evergreeners\.dev$/)) return true;
    if (lowerOrigin.match(/^https?:\/\/.*\.vercel\.app$/)) return true;
    if (lowerOrigin.match(/^https?:\/\/localhost(:\d+)?$/)) return true;
    return false;
};

server.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
});

// ─── Academy launch gate ─────────────────────────────────────────────────────
const ACADEMY_LAUNCH_DATE = process.env.ACADEMY_LAUNCH_DATE || '2026-08-31T00:00:00Z';
const ACADEMY_LAUNCH_DATE_LABEL = new Date(ACADEMY_LAUNCH_DATE).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
});
const isAcademyOpen = () => Date.now() >= +new Date(ACADEMY_LAUNCH_DATE);

// Extremely crucial for Vercel Rewrites & cross-origin authentication
// This ensures that for ALL requests, better-auth and session handlers see the public host (e.g. evergreeners.dev)
// and NOT the internal Railway host. This fixes 401s during sync and OAuth redirect issues.
server.addHook('onRequest', async (req, reply) => {
    // Comprehensive debug logging for ALL incoming requests to help diagnose proxy issues
    console.log(`[RAW REQUEST] ${req.method} ${req.url} (Host: ${req.headers.host})`);
    if (req.url.includes('callback') || req.url.includes('gh-')) {
        console.log(`[OAUTH DEBUG] Full Params: ${JSON.stringify(req.query)}`);
        console.log(`[OAUTH DEBUG] Detailed Headers: ${JSON.stringify(req.headers)}`);
    }

    const forwardedHost = req.headers['x-forwarded-host'] || req.headers['host'];
    
    // Proactively override host if it's from Vercel to ensure Better Auth matches its baseURL
    if (req.headers['x-vercel-id']) {
        const publicHost = 'evergreeners.dev';
        req.headers.host = publicHost;
        req.raw.headers.host = publicHost;
        req.headers['x-forwarded-host'] = publicHost;
        req.raw.headers['x-forwarded-host'] = publicHost;
    } else if (typeof forwardedHost === 'string' && forwardedHost && !forwardedHost.includes('railway')) {
        req.headers.host = forwardedHost;
        req.raw.headers.host = forwardedHost;
    }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.register(multipart);
server.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/public/', // optional: default '/'
});

// Serve the LearnGitBranching study app so Academy lessons can embed it.
// Point LGB_FRONTEND_PATH at the repo root (contains index.html + build/ + assets/).
const lgbFrontendPath = process.env.LGB_FRONTEND_PATH || path.resolve(__dirname, '../../../learnGitBranching');
if (existsSync(lgbFrontendPath)) {
    server.register(fastifyStatic, {
        root: lgbFrontendPath,
        prefix: '/learn-git-branching/',
        decorateReply: false,
    });
    console.log(`Serving LearnGitBranching at /learn-git-branching from ${lgbFrontendPath}`);
} else {
    console.warn(`LearnGitBranching frontend not found at ${lgbFrontendPath}; /learn-git-branching will not be served. Set LGB_FRONTEND_PATH to enable.`);
}

// GitHub OAuth is handled by better-auth in separate adapter

// Health check to verify Vercel -> Heroku proxying
server.get('/api/health', async (req, reply) => {
    return { 
        status: 'ok', 
        github_ci_cd: 'verified_successfully',
        host: req.headers.host,
        forwardedHost: req.headers['x-forwarded-host'],
        url: req.url
    };
});

// Auth Routes Scope (No Body Parsing for better-auth)
// Auth Routes Scope (No Body Parsing for better-auth)
server.register(async (instance) => {
    // Prevent Fastify from parsing the body so better-auth can handle the raw stream
    instance.removeContentTypeParser('application/json');
    instance.addContentTypeParser('application/json', (req, payload, done) => {
        done(null);
    });


    instance.get('/api/auth/callback/github', async (req, reply) => {
        console.log(`[CALLBACK DEBUG] Hit! Method: ${req.method}, URL: ${req.url}`);
        console.log(`[CALLBACK DEBUG] Queries: ${JSON.stringify(req.query)}`);
        console.log(`[CALLBACK DEBUG] Headers: ${JSON.stringify(req.headers)}`);
        
        // Pass to better-auth manually
        return await toNodeHandler(auth)(req.raw, reply.raw);
    });

    instance.all('/api/auth/*', async (req, reply) => {
        const requestOrigin = req.headers.origin;

        // Always set CORS headers for preflight and actual requests
        reply.raw.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        reply.raw.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

        // Set origin header if allowed
        if (requestOrigin && isOriginAllowed(requestOrigin)) {
            reply.raw.setHeader("Access-Control-Allow-Origin", requestOrigin);
            reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
        } else if (!requestOrigin) {
            reply.raw.setHeader("Access-Control-Allow-Origin", "*");
        }

        // Handle preflight request
        if (req.method === 'OPTIONS') {
            return reply.status(204).send();
        }

        return toNodeHandler(auth)(req.raw, reply.raw);
    });
});

// API Routes Scope (Standard JSON Parsing)
server.register(async (instance) => {
    // GitHub Webhook Endpoint for real-time updates
    instance.post('/api/webhooks/github', async (req, reply) => {
        const payload = req.body as any;
        const githubUsername = payload?.sender?.login;

        if (!githubUsername) {
            return reply.status(400).send({ message: "Invalid payload: sender missing" });
        }

        console.log(`Webhook received for GitHub user: ${githubUsername}`);

        try {
            // 1. Find the user in our DB by their GitHub username
            const userRecord = await db.select()
                .from(schema.users)
                .where(eq(schema.users.username, githubUsername))
                .limit(1);

            if (userRecord.length === 0) {
                console.log(`No local user found for GitHub username: ${githubUsername}`);
                return reply.status(200).send({ message: "User not found locally, skipping sync" });
            }

            const userId = userRecord[0].id;

            // 2. Get the GitHub account/token for this user
            const account = await db.select().from(schema.accounts)
                .where(and(
                    eq(schema.accounts.userId, userId),
                    eq(schema.accounts.providerId, 'github')
                ))
                .limit(1);

            if (!account.length || !account[0].accessToken) {
                console.log(`No connected GitHub account/token for user: ${userId}`);
                return reply.status(200).send({ message: "No GitHub token found, skipping sync" });
            }

            // 3. Trigger a background sync (don't block the webhook response)
            // We reuse the logic from sync-github but as a background process
            (async () => {
                try {
                    console.log(`Background sync started for user ${userId} via webhook`);
                    const {
                        totalCommits, currentStreak, todayCommits, yesterdayCommits,
                        weeklyCommits, activeDays, totalProjects, projects,
                        contributionCalendar, totalPullRequests, languages
                    } = await getGithubContributions(githubUsername, account[0].accessToken!);

                    await db.update(schema.users)
                        .set({
                            streak: currentStreak,
                            totalCommits,
                            todayCommits,
                            yesterdayCommits,
                            weeklyCommits,
                            activeDays,
                            totalProjects,
                            projectsData: projects,
                            languages,
                            totalPullRequests,
                            contributionData: contributionCalendar,
                            updatedAt: new Date()
                        })
                        .where(eq(schema.users.id, userId));

                    await updateUserGoals(userId, {
                        currentStreak, weeklyCommits, activeDays, totalProjects, contributionCalendar
                    });

                    console.log(`Background sync complete for ${githubUsername}`);
                } catch (err) {
                    console.error(`Background sync failed for ${githubUsername}:`, err);
                }
            })();

            return reply.status(200).send({ message: "Webhook accepted, sync started" });
        } catch (error) {
            console.error("Webhook processing error:", error);
            return reply.status(500).send({ message: "Internal server error" });
        }
    });

    // Custom route to force-sync GitHub data
    instance.post('/api/user/sync-github', async (req, reply) => {
        console.log(`Sync-Github called. Headers: ${JSON.stringify(req.headers)}`);

        // Use the unified session helper that works with both cookies and Bearer tokens
        const session = await getSessionFromRequest(req);

        console.log(`Sync-Github session result: ${session ? 'Success' : 'FAILURE'}`);
        if (!session) {
            return reply.status(401).send({ message: "Unauthorized", debug: "No valid session found" });
        }

        const userId = session.session.userId;

        // 1. Get GitHub Account
        const account = await db.select().from(schema.accounts)
            .where(and(
                eq(schema.accounts.userId, userId),
                eq(schema.accounts.providerId, 'github')
            ))
            .limit(1);

        if (!account.length || !account[0].accessToken) {
            return reply.status(400).send({ message: "No connected GitHub account found." });
        }

        try {
            console.log("Sync started for user:", userId);
            // 2. Fetch GitHub Profile
            const ghRes = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${account[0].accessToken}`,
                    "User-Agent": "Evergreeners-App"
                }
            });

            if (!ghRes.ok) {
                const errText = await ghRes.text();
                console.error("GitHub Profile Fetch Failed:", errText);

                // If token is revoked/expired, update DB and ask user to reconnect
                if (ghRes.status === 401 || ghRes.status === 403) {
                    await db.update(schema.users)
                        .set({ isGithubConnected: false })
                        .where(eq(schema.users.id, userId));
                    return reply.status(401).send({ message: "GitHub token expired or revoked. Please reconnect your account." });
                }

                throw new Error(`Failed to fetch from GitHub: ${ghRes.status} ${errText}`);
            }
            const ghUser = await ghRes.json();
            console.log("GitHub user found:", ghUser.login);

            // 3. Fetch Contributions (Streak & Total Commits)
            let contribStats;
            try {
                if (!ghUser.login) {
                    return reply.status(400).send({ message: "GitHub user login missing." });
                }
                contribStats = await getGithubContributions(ghUser.login, account[0].accessToken);
            } catch (err: any) {
                const errMsg = err.message || String(err);
                console.error("Contributions Fetch Failed:", errMsg);

                if (errMsg.toLowerCase().includes('token') || errMsg.toLowerCase().includes('bad credentials')) {
                    await db.update(schema.users)
                        .set({ isGithubConnected: false })
                        .where(eq(schema.users.id, userId));
                    return reply.status(401).send({ message: "GitHub token expired or invalid. Please reconnect." });
                }

                if (errMsg.includes('Could not resolve to a User')) {
                    return reply.status(404).send({ message: `GitHub user "${ghUser.login}" not found.` });
                }

                throw err;
            }
            const { totalCommits, currentStreak, longestStreak: computedLongest, todayCommits, yesterdayCommits, weeklyCommits, activeDays, totalProjects, projects, contributionCalendar, totalPullRequests, languages } = contribStats;

            // Keep the true longest streak: never let it shrink, and backfill from the calendar
            const existingStreakRow = await db.select({ longestStreak: schema.users.longestStreak })
                .from(schema.users)
                .where(eq(schema.users.id, userId))
                .limit(1);
            const longestStreak = Math.max(
                existingStreakRow[0]?.longestStreak ?? 0,
                computedLongest ?? 0,
                currentStreak
            );

            // 4. Update User Profile
            console.log("Updating DB with streak:", currentStreak, "commits:", totalCommits);
            await db.update(schema.users)
                .set({
                    // Only update stats, preserve user's custom profile data
                    streak: currentStreak,
                    longestStreak,
                    totalCommits: totalCommits,
                    todayCommits: todayCommits,
                    yesterdayCommits: yesterdayCommits,
                    weeklyCommits: weeklyCommits,
                    activeDays: activeDays,
                    totalProjects: totalProjects,
                    projectsData: projects,
                    languages: languages, // New field
                    totalPullRequests: totalPullRequests, // New field, assuming it's returned by getGithubContributions
                    contributionData: contributionCalendar,
                    isGithubConnected: true,
                    updatedAt: new Date()
                })
                .where(eq(schema.users.id, userId));

            // 5. Update User Goals based on new stats
            await updateUserGoals(userId, {
                currentStreak,
                weeklyCommits,
                activeDays,
                totalProjects,
                contributionCalendar
            });

            // 5b. Check and award badges
            const currentUser = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
            const syncedUser = currentUser[0];
            const questCompletedRows = await db.select().from(schema.userQuests)
                .where(and(eq(schema.userQuests.userId, userId), eq(schema.userQuests.status, 'completed')));
            const questAcceptedRows = await db.select().from(schema.userQuests)
                .where(eq(schema.userQuests.userId, userId));
            const goalRows = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
            const completedGoals = goalRows.filter(g => g.completed);
            const accountCreated = syncedUser?.createdAt ? new Date(syncedUser.createdAt) : new Date();
            const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / 86_400_000);
            const now = new Date();
            const isNewYear = now.getMonth() === 0 && now.getDate() === 1;
            const isAnniversary = accountAgeDays > 0 && accountAgeDays % 365 === 0;

            const badgeStats = {
                totalCommits,
                lateNightCommits: 0, // tracked separately via contribution analysis
                currentStreak,
                longestStreak, // true longest streak from calendar + history
                hadBrokenStreak: false,
                questsCompleted: questCompletedRows.length,
                questsAccepted: questAcceptedRows.length,
                overachieverQuests: 0,
                goalsCompleted: completedGoals.length,
                goalsCompletedEarly: 0,
                accountAgeDays,
                totalActiveDays: activeDays,
                isFirstDay: accountAgeDays === 0,
                isProfilePublic: syncedUser?.isPublic ?? false,
                isGithubConnected: true,
                hasBio: !!syncedUser?.bio,
                hasLocation: !!syncedUser?.location,
                leaderboardRank: null,
                profileViews: 0,
                fullYearGreen: false,
                isNewYearsCommit: isNewYear,
                isLunchBreakCommit: false, // TODO: detect from commit timestamps
                isFourAmCommit: false,
                hasSpeedRunnerQuest: false,
                isCountryLeader: false,
            };
            const newBadges = await checkAndAwardBadges(userId, badgeStats);

            // 6. Calculate and update user's rank
            let currentRank: number | null = null;
            let bestRank: number | null = null;

            if (currentStreak > 0) {
                // Count how many users have a higher streak (they rank above this user)
                const higherStreakCount = await db.select({ count: schema.users.id })
                    .from(schema.users)
                    .where(gt(schema.users.streak, currentStreak));

                currentRank = higherStreakCount.length + 1;

                // Get user's current best rank
                const currentUser = await db.select({ bestRank: schema.users.bestRank })
                    .from(schema.users)
                    .where(eq(schema.users.id, userId))
                    .limit(1);

                bestRank = currentUser[0]?.bestRank || null;

                // Update best rank if current is better (lower number = better)
                if (!bestRank || currentRank < bestRank) {
                    await db.update(schema.users)
                        .set({ bestRank: currentRank })
                        .where(eq(schema.users.id, userId));
                    bestRank = currentRank;
                    console.log(`Updated best rank for ${ghUser.login}: ${currentRank}`);
                }
            }

            return {
                success: true,
                username: ghUser.login,
                streak: currentStreak,
                totalCommits,
                todayCommits,
                yesterdayCommits,
                weeklyCommits,
                projectsData: projects,
                contributionData: contributionCalendar,
                currentRank,
                bestRank,
                newBadges: newBadges.map(b => ({ id: b.id, name: b.name, rarity: b.rarity, category: b.category })),
            };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: "Failed to sync with GitHub" });
        }
    });

    // Public background sync — no auth required from caller.
    // Triggered when anyone visits a profile page so stats stay fresh.
    // Uses the profile owner's own stored GitHub token.
    instance.post('/api/user/sync-github/:username', async (req, reply) => {
        const { username } = req.params as { username: string };

        try {
            // 1. Find user by username
            const userRecord = await db.select()
                .from(schema.users)
                .where(eq(schema.users.username, username))
                .limit(1);

            if (!userRecord.length) {
                return reply.status(404).send({ message: 'User not found' });
            }

            const user = userRecord[0];
            if (!user.isPublic) {
                return reply.status(403).send({ message: 'Profile is private' });
            }

            // 2. Get their GitHub account token
            const account = await db.select()
                .from(schema.accounts)
                .where(and(
                    eq(schema.accounts.userId, user.id),
                    eq(schema.accounts.providerId, 'github')
                ))
                .limit(1);

            if (!account.length || !account[0].accessToken) {
                // No GitHub connected — nothing to sync, return current DB data without error
                return reply.status(200).send({ success: true, synced: false, message: 'No GitHub account linked' });
            }

            // 3. Fire-and-forget background sync — respond immediately so the UI doesn't block
            (async () => {
                try {
                    console.log(`[Public sync] Starting background sync for @${username}`);
                    const ghRes = await fetch('https://api.github.com/user', {
                        headers: {
                            Authorization: `Bearer ${account[0].accessToken}`,
                            'User-Agent': 'Evergreeners-App'
                        }
                    });

                    if (!ghRes.ok) throw new Error('GitHub API error');
                    const ghUser = await ghRes.json();

                    const {
                        totalCommits, currentStreak, todayCommits, yesterdayCommits,
                        weeklyCommits, activeDays, totalProjects, projects,
                        contributionCalendar, totalPullRequests, languages
                    } = await getGithubContributions(ghUser.login, account[0].accessToken!);

                    await db.update(schema.users)
                        .set({
                            streak: currentStreak,
                            totalCommits,
                            todayCommits,
                            yesterdayCommits,
                            weeklyCommits,
                            activeDays,
                            totalProjects,
                            projectsData: projects,
                            languages,
                            totalPullRequests,
                            contributionData: contributionCalendar,
                            isGithubConnected: true,
                            updatedAt: new Date()
                        })
                        .where(eq(schema.users.id, user.id));

                    await updateUserGoals(user.id, { currentStreak, weeklyCommits, activeDays, totalProjects, contributionCalendar });
                    console.log(`[Public sync] Done for @${username}`);
                } catch (err) {
                    console.error(`[Public sync] Failed for @${username}:`, err);
                }
            })();

            return reply.status(200).send({ success: true, synced: true });
        } catch (error) {
            console.error('[Public sync] Error:', error);
            return reply.status(500).send({ message: 'Failed to trigger sync' });
        }
    });

    // Update User Profile Route
    instance.put('/api/user/profile', async (req, reply: any) => {
        const session = await getSessionFromRequest(req);
        if (!session) {
            return reply.status(401).send({ message: "Unauthorized" });
        }

        const userId = session.session.userId;
        const body = req.body as any;

        try {
            const updateData: any = {
                updatedAt: new Date()
            };

            if (body.name !== undefined) updateData.name = body.name;
            if (body.username !== undefined) updateData.username = body.username;
            if (body.bio !== undefined) updateData.bio = body.bio;
            if (body.location !== undefined) updateData.location = body.location;
            if (body.website !== undefined) updateData.website = body.website;
            if (body.image !== undefined) updateData.image = body.image;
            if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

            if (body.anonymousName !== undefined) updateData.anonymousName = body.anonymousName;

            if (body.isPublic === false) {
                const currentUser = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
                if (currentUser.length && !currentUser[0].anonymousName && !body.anonymousName) {
                    const adjectives = ["Hidden", "Secret", "Silent", "Quiet", "Mysterious"];
                    const nouns = ["Tree", "Leaf", "Sprout", "Root", "Seed"];
                    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
                    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
                    const randomNumber = Math.floor(Math.random() * 1000);
                    updateData.anonymousName = `${randomAdj}${randomNoun}${randomNumber}`;
                }
            }

            await db.update(schema.users)
                .set(updateData)
                .where(eq(schema.users.id, userId));

            return {
                success: true,
                message: "Profile updated successfully",
                anonymousName: updateData.anonymousName
            };
        } catch (error) {
            console.error("Profile update error:", error);
            return reply.status(500).send({ message: "Failed to update profile", error: String(error) });
        }
    });

    // GET User Profile Route
    instance.get('/api/user/profile', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) {
            return reply.status(401).send({ message: "Unauthorized" });
        }

        const userId = session.session.userId;
        const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

        if (!user.length) return reply.status(404).send({ message: "User not found" });

        // Include notification preference in response
        return { user: { ...user[0], emailNotifications: user[0].emailNotifications ?? true } };
    });

    // GET Public User Profile by Username
    instance.get('/api/user/profile/:username', async (req, reply) => {
        const { username } = req.params as { username: string };

        try {
            const userRecord = await db.select()
                .from(schema.users)
                .where(eq(schema.users.username, username))
                .limit(1);

            if (userRecord.length === 0) {
                return reply.status(404).send({ message: "User not found" });
            }

            const userData = userRecord[0];

            if (!userData.isPublic) {
                return reply.status(403).send({ message: "This profile is private" });
            }

            // Define which fields to exclude for the public view
            const {
                email,
                emailVerified,
                role,
                emailNotifications,
                ...publicData
            } = userData;

            return { user: publicData };
        } catch (error) {
            console.error("Public profile fetch error:", error);
            return reply.status(500).send({ message: "Internal server error" });
        }
    });


    // DELETE User Account Route
    instance.delete('/api/user/account', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) {
            return reply.status(401).send({ message: "Unauthorized" });
        }

        const userId = session.session.userId;

        try {
            console.log(`Deleting account for user: ${userId}`);

            // Delete in order to respect foreign key constraints
            // 1. Delete user's quest progress
            await db.delete(schema.userQuests).where(eq(schema.userQuests.userId, userId));
            console.log("Deleted user quests");

            // 2. Delete user's goals
            await db.delete(schema.goals).where(eq(schema.goals.userId, userId));
            console.log("Deleted user goals");

            // 3. Delete user's sessions (this will log them out)
            await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
            console.log("Deleted user sessions");

            // 4. Delete user's linked accounts (GitHub, etc.)
            await db.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
            console.log("Deleted user accounts");

            // 5. Finally, delete the user record
            await db.delete(schema.users).where(eq(schema.users.id, userId));
            console.log("Deleted user record");

            return { success: true, message: "Account deleted successfully" };
        } catch (error) {
            console.error("Account deletion error:", error);
            return reply.status(500).send({ message: "Failed to delete account", error: String(error) });
        }
    });
    // Leaderboard Endpoint
    instance.get('/api/leaderboard', async (req, reply) => {
        try {
            const topUsers = await db.select({
                id: schema.users.id,
                name: schema.users.name,
                username: schema.users.username,
                image: schema.users.image,
                streak: schema.users.streak,
                totalCommits: schema.users.totalCommits,
                weeklyCommits: schema.users.weeklyCommits,
                yesterdayCommits: schema.users.yesterdayCommits,
                isPublic: schema.users.isPublic,
                anonymousName: schema.users.anonymousName,
                bestRank: schema.users.bestRank,
            })
                .from(schema.users)
                .orderBy(desc(schema.users.streak), desc(schema.users.totalCommits))
                .limit(50);

            console.log(`Fetching leaderboard. Found ${topUsers.length} users`);

            // Update best ranks asynchronously (don't block the response)
            (async () => {
                for (let i = 0; i < topUsers.length; i++) {
                    const user = topUsers[i];
                    // Only assign ranks to active streakers so inactive users never earn badges
                    if (!user.streak) continue;
                    const currentRank = i + 1;
                    // Update if this is their first rank or if current rank is better (lower number = better)
                    if (!user.bestRank || currentRank < user.bestRank) {
                        await db.update(schema.users)
                            .set({ bestRank: currentRank })
                            .where(eq(schema.users.id, user.id));
                        console.log(`Updated best rank for ${user.username}: ${user.bestRank || 'none'} -> ${currentRank}`);
                    }
                }
            })().catch(err => console.error("Error updating best ranks:", err));

            const leaderboard = topUsers.map((user, index) => {
                const isAnonymous = !user.isPublic;
                // Determine display name
                let displayName = user.username || user.name;
                if (isAnonymous) {
                    displayName = user.anonymousName || `User${user.id.substring(0, 6)}`;
                }

                // Determine avatar
                let avatar = user.image;
                if (isAnonymous) {
                    // We'll let the frontend handle the default avatar logic if null
                    avatar = null;
                }

                return {
                    rank: index + 1,
                    username: displayName,
                    avatar: avatar,
                    streak: user.streak || 0,
                    totalCommits: user.totalCommits || 0,
                    yesterdayCommits: user.yesterdayCommits || 0,
                    weeklyCommits: user.weeklyCommits || 0,
                    bestRank: user.bestRank || index + 1, // Include best rank in response
                    // We don't determine isCurrentUser here, frontend will do it by comparing username/id
                    originalUsername: user.username // Helper for frontend to identify current user if needed, though matching by string might be tricky if anonymous.
                    // Better to send ID or handle 'isCurrentUser' if we have session.
                };
            });

            return { leaderboard };
        } catch (error) {
            console.error("Leaderboard error:", error);
            return reply.status(500).send({ message: "Failed to fetch leaderboard" });
        }

    });
    // Quests Endpoints
    // GET /api/quests
    instance.get('/api/quests', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;

        try {
            const allQuests = await db.select().from(schema.quests);

            // Get all quest statuses (global) to check if taken
            const allUserQuests = await db.select().from(schema.userQuests);

            // Get all creators
            const creators = await db.select({
                id: schema.users.id,
                name: schema.users.name,
                username: schema.users.username,
                anonymousName: schema.users.anonymousName,
                isPublic: schema.users.isPublic
            }).from(schema.users);

            // Get all acceptors (users who took quests)
            const acceptors = await db.select({
                id: schema.users.id,
                name: schema.users.name,
                username: schema.users.username,
                anonymousName: schema.users.anonymousName,
                isPublic: schema.users.isPublic
            }).from(schema.users);

            const questsWithDetails = allQuests.map(q => {
                // Find creator
                const creator = creators.find(c => c.id === q.createdBy);

                // Privacy logic
                let creatorName = "Evergreener";
                if (creator) {
                    if (!creator.isPublic) {
                        creatorName = creator.username || creator.anonymousName || "Evergreener";
                    } else {
                        creatorName = creator.name || creator.username || creator.anonymousName || "Evergreener";
                    }
                }

                // Check global status
                // Is this quest currently active for anyone?
                const activeAssignment = allUserQuests.find(uq => uq.questId === q.id && (uq.status === 'active' || uq.status === 'completed'));

                let acceptedBy = null;
                let acceptedStatus = null;

                if (activeAssignment) {
                    const acceptor = acceptors.find(a => a.id === activeAssignment.userId);
                    if (acceptor) {
                        if (!acceptor.isPublic) {
                            acceptedBy = acceptor.username || acceptor.anonymousName || "Evergreener";
                        } else {
                            acceptedBy = acceptor.name || acceptor.username || acceptor.anonymousName || "Evergreener";
                        }
                    } else {
                        acceptedBy = "Evergreener";
                    }
                    acceptedStatus = activeAssignment.status;
                }

                // Status for CURRENT user
                const myStatus = allUserQuests.find(uq => uq.questId === q.id && uq.userId === userId);

                return {
                    ...q,
                    creatorName,
                    acceptedBy,
                    acceptedStatus, // 'active' or 'completed'
                    isTaken: q.isOpenQuest ? false : (!!activeAssignment && activeAssignment.userId !== userId), // Taken by someone else (unless open)
                    myStatus: myStatus ? myStatus.status : null, // 'active', 'completed', or null
                    myProgress: myStatus ? {
                        startedAt: myStatus.startedAt,
                        completedAt: myStatus.completedAt,
                        forkUrl: myStatus.forkUrl
                    } : null
                };
            });

            return { quests: questsWithDetails };

        } catch (error) {
            console.error("Fetch quests error:", error);
            return reply.status(500).send({ message: "Failed to fetch quests" });
        }
    });

    // POST /api/quests/:id/accept
    instance.post('/api/quests/:id/accept', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };
        const questId = parseInt(id);

        try {
            const quest = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);
            if (!quest.length) return reply.status(404).send({ message: "Quest not found" });

            // 1. Check if user is creator
            if (quest[0].createdBy === userId) {
                return reply.status(400).send({ message: "You cannot accept your own quest." });
            }

            // 2. Check if already active for ANYONE
            // We allow re-accepting if it was dropped (no active record), but if someone else has it 'active', block it.
            const existingActive = await db.select().from(schema.userQuests)
                .where(and(
                    eq(schema.userQuests.questId, questId),
                    eq(schema.userQuests.status, 'active')
                ));

            if (existingActive.length > 0) {
                // Check if it's me (idempotent)
                if (existingActive[0].userId === userId) {
                    return { success: true, status: 'active' };
                }

                // If it's not an Open Quest, block others from accepting it
                if (!quest[0].isOpenQuest) {
                    return reply.status(400).send({ message: "This quest is already taken by another adventurer." });
                }
            }

            // Check if I completed it before? (Optional: allow re-run? assume no for now)
            const myCompleted = await db.select().from(schema.userQuests)
                .where(and(
                    eq(schema.userQuests.questId, questId),
                    eq(schema.userQuests.userId, userId),
                    eq(schema.userQuests.status, 'completed')
                ));
            if (myCompleted.length > 0) {
                return reply.status(400).send({ message: "You have already completed this quest!" });
            }


            await db.insert(schema.userQuests).values({
                userId,
                questId: questId,
                status: 'active',
                startedAt: new Date()
            });

            return { success: true, status: 'active' };
        } catch (error) {
            console.error("Accept quest error:", error);
            return reply.status(500).send({ message: "Failed to accept quest" });
        }
    });

    // POST /api/quests/:id/drop
    instance.post('/api/quests/:id/drop', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };
        const questId = parseInt(id);

        try {
            // Delete the active record
            await db.delete(schema.userQuests)
                .where(and(
                    eq(schema.userQuests.userId, userId),
                    eq(schema.userQuests.questId, questId),
                    eq(schema.userQuests.status, 'active')
                ));

            return { success: true, message: "Quest dropped" };
        } catch (error) {
            console.error("Drop quest error:", error);
            return reply.status(500).send({ message: "Failed to drop quest" });
        }
    });

    // POST /api/quests/:id/check
    instance.post('/api/quests/:id/check', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };

        try {
            // Get quest details
            const quest = await db.select().from(schema.quests).where(eq(schema.quests.id, parseInt(id))).limit(1);
            if (!quest.length) return reply.status(404).send({ message: "Quest not found" });

            // Get user Github token
            const account = await db.select().from(schema.accounts)
                .where(and(
                    eq(schema.accounts.userId, userId),
                    eq(schema.accounts.providerId, 'github')
                ))
                .limit(1);

            if (!account.length || !account[0].accessToken) {
                return reply.status(400).send({ message: "GitHub not connected" });
            }

            // Get GitHub username from session or user profile (need to ensure we have it)
            // Ideally we should store it in users table more reliably or fetch from account
            // For now, let's fetch profile from GitHub if we don't trust local data, or use user.username

            const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
            let username = user[0].username; // This might be their app username, not GitHub.

            // Should fallback to fetching from GitHub /user to be sure
            const ghRes = await fetch("https://api.github.com/user", {
                headers: { Authorization: `Bearer ${account[0].accessToken}`, "User-Agent": "Evergreeners-App" }
            });
            if (ghRes.ok) {
                const ghData = await ghRes.json();
                username = ghData.login;
            }

            if (!username) return reply.status(400).send({ message: "Could not determine GitHub username" });

            const progress = await checkQuestProgress(username, account[0].accessToken, quest[0].repoUrl);

            if (progress.status === 'completed') {
                // Update DB
                await db.update(schema.userQuests)
                    .set({ status: 'completed', completedAt: new Date(), forkUrl: progress.forkUrl })
                    .where(and(eq(schema.userQuests.userId, userId), eq(schema.userQuests.questId, parseInt(id))));

                // Check for speed-runner badge (completed in < 1 hour)
                const myQuestRow = await db.select().from(schema.userQuests)
                    .where(and(eq(schema.userQuests.userId, userId), eq(schema.userQuests.questId, parseInt(id))))
                    .limit(1);
                const isSpeedRunner = myQuestRow[0]?.startedAt
                    ? (Date.now() - new Date(myQuestRow[0].startedAt).getTime()) < 3_600_000
                    : false;

                // Award badges after quest completion
                const completedQuestRows = await db.select().from(schema.userQuests)
                    .where(and(eq(schema.userQuests.userId, userId), eq(schema.userQuests.status, 'completed')));
                const acceptedQuestRows = await db.select().from(schema.userQuests)
                    .where(eq(schema.userQuests.userId, userId));
                const goalRows = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
                const completedGoals = goalRows.filter(g => g.completed);
                const userProfile = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
                const profile = userProfile[0];
                const accountCreated = profile?.createdAt ? new Date(profile.createdAt) : new Date();
                const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / 86_400_000);

                const badgeStats = {
                    totalCommits: profile?.totalCommits ?? 0,
                    lateNightCommits: 0,
                    currentStreak: profile?.streak ?? 0,
                    longestStreak: profile?.longestStreak ?? 0,
                    hadBrokenStreak: false,
                    questsCompleted: completedQuestRows.length,
                    questsAccepted: acceptedQuestRows.length,
                    overachieverQuests: 0,
                    goalsCompleted: completedGoals.length,
                    goalsCompletedEarly: 0,
                    accountAgeDays,
                    totalActiveDays: profile?.activeDays ?? 0,
                    isFirstDay: accountAgeDays === 0,
                    isProfilePublic: profile?.isPublic ?? false,
                    isGithubConnected: profile?.isGithubConnected ?? false,
                    hasBio: !!profile?.bio,
                    hasLocation: !!profile?.location,
                    leaderboardRank: null,
                    profileViews: 0,
                    fullYearGreen: false,
                    isNewYearsCommit: false,
                    isLunchBreakCommit: false,
                    isFourAmCommit: false,
                    hasSpeedRunnerQuest: isSpeedRunner,
                    isCountryLeader: false,
                };
                await checkAndAwardBadges(userId, badgeStats);

                // Award points/streak? For now just mark complete.
            } else if (progress.status !== 'error') {
                // status could be 'in_progress', 'not_started'
                // Update forkUrl at least
                if (progress.forkUrl) {
                    await db.update(schema.userQuests)
                        .set({ forkUrl: progress.forkUrl })
                        .where(and(eq(schema.userQuests.userId, userId), eq(schema.userQuests.questId, parseInt(id))));
                }
            }

            return { success: true, progress };

        } catch (error) {
            console.error("Check quest error:", error);
            return reply.status(500).send({ message: "Failed to check quest" });
        }
    });

    // POST /api/quests (Create Quest)
    instance.post('/api/quests', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const body = req.body as any;

        // Basic validation
        if (!body.title || !body.description || !body.repoUrl || !body.difficulty) {
            return reply.status(400).send({ message: "Missing required fields" });
        }

        if (!body.repoUrl.startsWith("https://github.com/")) {
            return reply.status(400).send({ message: "Invalid GitHub URL" });
        }

        try {
            const newQuest = await db.insert(schema.quests).values({
                title: body.title,
                description: body.description,
                repoUrl: body.repoUrl,
                difficulty: body.difficulty,
                tags: body.tags || [],
                points: body.points || 10,
                isOpenQuest: body.isOpenQuest || false,
                createdBy: userId,
            }).returning();

            // Asynchronously dispatch notifications to all users if creator is public
            (async () => {
                try {
                    const submitRows = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
                    if (!submitRows.length || !submitRows[0].isPublic) return;

                    const submitter = submitRows[0];
                    const submitterName = submitter.name || submitter.username || submitter.anonymousName || "A user";
                    const APP_URL = process.env.APP_URL || 'https://evergreeners.dev';
                    const { sendNewQuestEmail } = await import('./lib/email.js');

                    // Let's grab all users who haven't explicitly disabled emails
                    // (Assuming defaults are stored as true or null if missing)
                    const usersToNotify = await db.select().from(schema.users).where(eq(schema.users.emailNotifications, true));
                    const githubAccounts = await db.select({ userId: schema.accounts.userId }).from(schema.accounts).where(eq(schema.accounts.providerId, 'github'));

                    // Send emails sequentially with a 600ms gap to stay under
                    // Resend's rate limit of 2 requests/second.
                    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

                    for (const user of usersToNotify) {
                        if (user.id === userId || !user.email) continue;

                        const hasGithub = githubAccounts.some(acc => acc.userId === user.id);

                        try {
                            await sendNewQuestEmail({
                                to: user.email,
                                userName: user.name || user.username || "Evergreener",
                                submitterName,
                                questTitle: body.title,
                                questUrl: `${APP_URL}/quests`,
                                hasGithub
                            });
                            console.log(`New quest email queued for ${user.email}`);
                        } catch (err) {
                            console.error(`Failed to email new quest to ${user.email}:`, err);
                        }

                        // Respect Resend's 2 req/sec rate limit
                        await sleep(600);
                    }
                } catch (e) {
                    console.error("Async new quest email dispatch error:", e);
                }
            })();

            return { quest: newQuest[0] };
        } catch (error) {
            console.error("Create quest error:", error);
            return reply.status(500).send({ message: "Failed to create quest" });
        }
    });

    // DELETE /api/quests/:id (only creator can delete)
    instance.delete('/api/quests/:id', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };
        const questId = parseInt(id);

        try {
            const quest = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);

            if (!quest.length) {
                return reply.status(404).send({ message: "Quest not found" });
            }

            if (quest[0].createdBy !== userId) {
                return reply.status(403).send({ message: "Only the creator can delete this quest." });
            }

            // Cascade: remove all userQuests entries for this quest first (FK constraint)
            await db.delete(schema.userQuests).where(eq(schema.userQuests.questId, questId));

            // Now delete the quest itself
            await db.delete(schema.quests).where(eq(schema.quests.id, questId));

            return { success: true };
        } catch (error) {
            console.error("Delete quest error:", error);
            return reply.status(500).send({ message: "Failed to delete quest" });
        }
    });

    // PATCH /api/quests/:id (only creator can edit)
    instance.patch('/api/quests/:id', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };
        const questId = parseInt(id);
        const body = req.body as any;

        try {
            const quest = await db.select().from(schema.quests).where(eq(schema.quests.id, questId)).limit(1);

            if (!quest.length) return reply.status(404).send({ message: "Quest not found" });
            if (quest[0].createdBy !== userId) return reply.status(403).send({ message: "Only the creator can edit this quest." });

            const updates: Record<string, any> = {};
            if (body.title !== undefined) updates.title = body.title;
            if (body.description !== undefined) updates.description = body.description;
            if (body.repoUrl !== undefined) updates.repoUrl = body.repoUrl;
            if (body.difficulty !== undefined) {
                updates.difficulty = body.difficulty;
                updates.points = body.difficulty === 'Easy' ? 10 : body.difficulty === 'Medium' ? 30 : 50;
            }
            if (body.tags !== undefined) updates.tags = body.tags;
            if (body.isOpenQuest !== undefined) updates.isOpenQuest = body.isOpenQuest;
            updates.updatedAt = new Date();

            const updated = await db.update(schema.quests).set(updates).where(eq(schema.quests.id, questId)).returning();

            return { quest: updated[0] };
        } catch (error) {
            console.error("Edit quest error:", error);
            return reply.status(500).send({ message: "Failed to edit quest" });
        }
    });

    // GET /api/quests/:id/participants — creator-only, lists everyone who accepted
    instance.get('/api/quests/:id/participants', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };
        const questId = parseInt(id);

        try {
            const quest = await db.select().from(schema.quests)
                .where(eq(schema.quests.id, questId)).limit(1);

            if (!quest.length) return reply.status(404).send({ message: 'Quest not found' });
            if (quest[0].createdBy !== userId) {
                return reply.status(403).send({ message: 'Only the quest creator can view participants.' });
            }

            // All userQuest rows for this quest
            const rows = await db.select().from(schema.userQuests)
                .where(eq(schema.userQuests.questId, questId));

            if (!rows.length) return { participants: [] };

            // Fetch matching user profiles
            const participantIds = rows.map(r => r.userId);
            const allUsers = await db.select({
                id: schema.users.id,
                name: schema.users.name,
                username: schema.users.username,
                image: schema.users.image,
                isPublic: schema.users.isPublic,
                anonymousName: schema.users.anonymousName,
                streak: schema.users.streak,
            }).from(schema.users);

            const userMap = new Map(allUsers.map(u => [u.id, u]));

            const participants = rows.map(row => {
                const user = userMap.get(row.userId);
                let displayName = 'Evergreener';
                let avatar: string | null = null;

                if (user) {
                    if (user.isPublic) {
                        displayName = user.name || user.username || 'Evergreener';
                        avatar = user.image ?? null;
                    } else {
                        displayName = user.anonymousName || `Anonymous`;
                        avatar = null;
                    }
                }

                return {
                    userId: row.userId,
                    displayName,
                    avatar,
                    status: row.status,           // 'active' | 'completed'
                    startedAt: row.startedAt,
                    completedAt: row.completedAt,
                    forkUrl: row.forkUrl,
                    streak: user?.streak ?? 0,
                };
            });

            return { participants };
        } catch (error) {
            console.error('Participants fetch error:', error);
            return reply.status(500).send({ message: 'Failed to fetch participants' });
        }
    });

    // GitHub Proxy Route

    instance.post('/api/github/proxy', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const account = await db.select().from(schema.accounts)
            .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.providerId, 'github')))
            .limit(1);

        if (!account.length || !account[0].accessToken) {
            return reply.status(400).send({ message: "GitHub not connected" });
        }

        const { path, method, body } = req.body as any;
        const url = `https://api.github.com${path}`;

        try {
            const res = await fetch(url, {
                method: method || 'GET',
                headers: {
                    Authorization: `Bearer ${account[0].accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                    ...(body ? { 'Content-Type': 'application/json' } : {})
                },
                body: body ? JSON.stringify(body) : undefined
            });

            // GitHub sometimes returns 204 No Content for DELETE
            if (res.status === 204) return { success: true };

            const data = await res.json();
            if (!res.ok) {
                return reply.status(res.status).send(data);
            }
            return data;
        } catch (error) {
            console.error("GitHub Proxy error:", error);
            return reply.status(500).send({ message: "Failed to proxy request" });
        }
    });

    instance.get('/api/goals', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;

        try {
            const userGoals = await db.select().from(schema.goals)
                .where(eq(schema.goals.userId, userId))
                .orderBy(desc(schema.goals.createdAt));
            return { goals: userGoals };
        } catch (error) {
            console.error("Fetch goals error:", error);
            return reply.status(500).send({ message: "Failed to fetch goals" });
        }
    });

    // POST /api/goals
    instance.post('/api/goals', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const body = req.body as any;

        try {
            // Fetch user stats to initialize goal progress
            const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
            let current = body.current || 0;
            const target = parseInt(body.target);

            if (user.length) {
                if (body.type === 'streak') {
                    current = user[0].streak || 0;
                } else if (body.type === 'commits') {
                    // Default to weekly commits logic if title mentions it, or just 0 if generic
                    if (body.title.toLowerCase().includes('weekly') || body.title.toLowerCase().includes('week')) {
                        current = user[0].weeklyCommits || 0;
                    } else {
                        // Could be total commits or daily
                        current = user[0].totalCommits || 0;
                    }
                } else if (body.type === 'days') {
                    current = user[0].activeDays || 0;
                } else if (body.type === 'projects') {
                    current = user[0].totalProjects || 0;
                }
            }

            const completed = current >= target;

            console.log(`Creating goal: ${body.title}, Type: ${body.type}, Current: ${current}, Target: ${target}, Completed: ${completed}`);

            const newGoal = await db.insert(schema.goals).values({
                userId,
                title: body.title,
                type: body.type,
                target: target,
                current: current,
                dueDate: body.dueDate,
                completed: completed,
            }).returning();

            return { goal: newGoal[0] };
        } catch (error) {
            console.error("Create goal error:", error);
            return reply.status(500).send({ message: "Failed to create goal" });
        }
    });

    // PUT /api/goals/:id
    instance.put('/api/goals/:id', async (req, reply: any) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };
        const body = req.body as any;

        try {
            // Verify ownership
            const existingGoal = await db.select().from(schema.goals)
                .where(and(eq(schema.goals.id, parseInt(id)), eq(schema.goals.userId, userId)))
                .limit(1);

            if (!existingGoal.length) return reply.status(404).send({ message: "Goal not found" });
            const goal = existingGoal[0];

            const updateData: any = { updatedAt: new Date() };
            if (body.title !== undefined) updateData.title = body.title;
            if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;

            let newCurrent = goal.current;
            let newTarget = goal.target;

            if (body.current !== undefined) {
                updateData.current = body.current;
                newCurrent = body.current;
            }
            if (body.target !== undefined) {
                updateData.target = body.target;
                newTarget = body.target;
            }

            // Recalculate completed status
            const completed = newCurrent >= newTarget;
            updateData.completed = completed;

            if (body.completed !== undefined) {
                // If explicitly setting completed (e.g. manual checking?), respect it, but usually auto-calc is better for stats
                updateData.completed = body.completed;
            }

            const updatedGoal = await db.update(schema.goals)
                .set(updateData)
                .where(eq(schema.goals.id, parseInt(id)))
                .returning();

            // Award badges after goal update
            const allGoalRows = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
            const completedGoals = allGoalRows.filter(g => g.completed);
            const isCompletedEarly = updateData.completed && goal.dueDate
                ? new Date() < new Date(goal.dueDate)
                : false;
            const userProfileRows = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
            const userProfile = userProfileRows[0];
            const accountCreated = userProfile?.createdAt ? new Date(userProfile.createdAt) : new Date();
            const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / 86_400_000);
            const questRows = await db.select().from(schema.userQuests).where(eq(schema.userQuests.userId, userId));
            const completedQuestRows = questRows.filter(q => q.status === 'completed');

            const goalBadgeStats = {
                totalCommits: userProfile?.totalCommits ?? 0,
                lateNightCommits: 0,
                currentStreak: userProfile?.streak ?? 0,
                longestStreak: userProfile?.longestStreak ?? 0,
                hadBrokenStreak: false,
                questsCompleted: completedQuestRows.length,
                questsAccepted: questRows.length,
                overachieverQuests: 0,
                goalsCompleted: completedGoals.length,
                goalsCompletedEarly: isCompletedEarly ? 1 : 0,
                accountAgeDays,
                totalActiveDays: userProfile?.activeDays ?? 0,
                isFirstDay: accountAgeDays === 0,
                isProfilePublic: userProfile?.isPublic ?? false,
                isGithubConnected: userProfile?.isGithubConnected ?? false,
                hasBio: !!userProfile?.bio,
                hasLocation: !!userProfile?.location,
                leaderboardRank: null,
                profileViews: 0,
                fullYearGreen: false,
                isNewYearsCommit: false,
                isLunchBreakCommit: false,
                isFourAmCommit: false,
                hasSpeedRunnerQuest: false,
                isCountryLeader: false,
            };
            await checkAndAwardBadges(userId, goalBadgeStats);

            return { goal: updatedGoal[0] };
        } catch (error) {
            console.error("Update goal error:", error);
            return reply.status(500).send({ message: "Failed to update goal" });
        }
    });

    // DELETE /api/goals/:id
    instance.delete('/api/goals/:id', async (req, reply: any) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { id } = req.params as { id: string };

        try {
            const deleted = await db.delete(schema.goals)
                .where(and(eq(schema.goals.id, parseInt(id)), eq(schema.goals.userId, userId)))
                .returning();

            if (!deleted.length) return reply.status(404).send({ message: "Goal not found" });

            return { success: true };
        } catch (error) {
            console.error("Delete goal error:", error);
            return reply.status(500).send({ message: "Failed to delete goal" });
        }
    });

    // ─── Badge Endpoints ──────────────────────────────────────────────────────────

    // GET /api/badges — all badge definitions
    // Secret badges are hidden unless the requesting user has earned them.
    instance.get('/api/badges', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        let earnedSecretIds = new Set<string>();

        if (session) {
            const earned = await db.select({ badgeId: schema.userBadges.badgeId })
                .from(schema.userBadges)
                .where(eq(schema.userBadges.userId, session.session.userId));
            earnedSecretIds = new Set(earned.map(r => r.badgeId));
        }

        const badges = BADGES.map(badge => {
            if (badge.isSecret && !earnedSecretIds.has(badge.id)) {
                // Redact secret badge details for unearned badges
                return {
                    id: badge.id,
                    name: '???',
                    description: '???',
                    rarity: badge.rarity,
                    category: badge.category,
                    isSecret: true,
                };
            }
            const { check: _check, ...rest } = badge;
            return rest;
        });

        return { badges };
    });

    // GET /api/users/:username/badges — all badges a user has earned
    instance.get('/api/users/:username/badges', async (req, reply) => {
        const { username } = req.params as { username: string };

        try {
            // Resolve user
            const userRows = await db.select({ id: schema.users.id, isPublic: schema.users.isPublic })
                .from(schema.users)
                .where(eq(schema.users.username, username))
                .limit(1);

            if (!userRows.length) {
                return reply.status(404).send({ message: 'User not found' });
            }

            const targetUser = userRows[0];

            // Allow the owner to see their own badges even if profile is private
            const session = await getSessionFromRequest(req);
            const isOwner = session?.session.userId === targetUser.id;

            if (!targetUser.isPublic && !isOwner) {
                return reply.status(403).send({ message: 'Profile is private' });
            }

            if (isOwner) {
                const userProfileRows = await db.select().from(schema.users).where(eq(schema.users.id, targetUser.id)).limit(1);
                const profile = userProfileRows[0];
                const questRows = await db.select().from(schema.userQuests).where(eq(schema.userQuests.userId, targetUser.id));
                const completedQuestRows = questRows.filter(q => q.status === 'completed');
                const goalRows = await db.select().from(schema.goals).where(eq(schema.goals.userId, targetUser.id));
                const completedGoals = goalRows.filter(g => g.completed);
                const accountCreated = profile?.createdAt ? new Date(profile.createdAt) : new Date();
                const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / 86_400_000);

                const badgeStats = {
                    totalCommits: profile?.totalCommits ?? 0,
                    lateNightCommits: 0,
                    currentStreak: profile?.streak ?? 0,
                    longestStreak: profile?.longestStreak ?? 0,
                    hadBrokenStreak: false,
                    questsCompleted: completedQuestRows.length,
                    questsAccepted: questRows.length,
                    overachieverQuests: 0,
                    goalsCompleted: completedGoals.length,
                    goalsCompletedEarly: 0,
                    accountAgeDays,
                    totalActiveDays: profile?.activeDays ?? 0,
                    isFirstDay: accountAgeDays === 0,
                    isProfilePublic: profile?.isPublic ?? false,
                    isGithubConnected: profile?.isGithubConnected ?? false,
                    hasBio: !!profile?.bio,
                    hasLocation: !!profile?.location,
                    leaderboardRank: profile?.bestRank ?? null,
                    profileViews: 0,
                    fullYearGreen: false,
                    isNewYearsCommit: false,
                    isLunchBreakCommit: false,
                    isFourAmCommit: false,
                    hasSpeedRunnerQuest: false,
                    isCountryLeader: false,
                };
                await checkAndAwardBadges(targetUser.id, badgeStats);
            }

            // Fetch earned badge rows
            const earnedRows = await db.select()
                .from(schema.userBadges)
                .where(eq(schema.userBadges.userId, targetUser.id));

            const earnedIds = new Set(earnedRows.map(r => r.badgeId));

            // Hydrate with badge definition data; redact unearned secrets
            const badges = BADGES.map(badge => {
                const row = earnedRows.find(r => r.badgeId === badge.id);
                const earned = !!row;

                if (badge.isSecret && !earned) {
                    return {
                        id: badge.id,
                        name: '???',
                        description: '???',
                        rarity: badge.rarity,
                        category: badge.category,
                        isSecret: true,
                        earned: false,
                        earnedAt: null,
                    };
                }

                const { check: _check, ...rest } = badge;
                return {
                    ...rest,
                    earned,
                    earnedAt: row?.earnedAt ?? null,
                };
            });

            return { badges, earnedCount: earnedIds.size, totalCount: BADGES.length };
        } catch (error) {
            console.error('Fetch user badges error:', error);
            return reply.status(500).send({ message: 'Failed to fetch badges' });
        }
    });

    // GET /api/notifications (Placeholder)
    instance.get('/api/notifications', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        // For now, return empty array to silence 404s
        return { notifications: [] };
    });

    // PUT /api/user/notifications — toggle email notification preference
    instance.put('/api/user/notifications', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const body = req.body as any;

        if (typeof body.emailNotifications !== 'boolean') {
            return reply.status(400).send({ message: 'emailNotifications must be a boolean' });
        }

        try {
            await db.update(schema.users)
                .set({ emailNotifications: body.emailNotifications, updatedAt: new Date() })
                .where(eq(schema.users.id, userId));

            return { success: true, emailNotifications: body.emailNotifications };
        } catch (error) {
            console.error('Notifications update error:', error);
            return reply.status(500).send({ message: 'Failed to update notification setting' });
        }
    });

    // POST /api/user/welcome-email — called from frontend after a brand-new email sign-up
    instance.post('/api/user/welcome-email', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;

        try {
            const userRows = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
            if (!userRows.length) return reply.status(404).send({ message: 'User not found' });

            const user = userRows[0];
            if (!user.email) return reply.status(400).send({ message: 'No email address on file' });

            await sendWelcomeEmail(user.email, user.name || user.username || 'Developer');
            return { success: true };
        } catch (error) {
            console.error('Welcome email error:', error);
            // Don't fail loudly — email is best-effort
            return { success: false, message: String(error) };
        }
    });
});

server.get('/', async (request, reply) => {
    const appUrl = process.env.APP_URL || 'https://evergreeners.dev';
    return reply.redirect(appUrl);
});

// ─── Dev-only email test routes ───────────────────────────────────────────────
// ─── Dev-only email test routes ───────────────────────────────────────────────
// NOT active in production. Use these to preview emails without creating accounts.
//
//   Welcome email:
//   GET http://localhost:3000/api/dev/test-welcome?to=you@gmail.com
//
//   Daily digest (pulls your REAL stats from the DB automatically):
//   GET http://localhost:3000/api/dev/test-streak?to=you@gmail.com
//   Override stats manually:
//   GET http://localhost:3000/api/dev/test-streak?to=you@gmail.com&committed=true&streak=14
//
if (process.env.NODE_ENV !== 'production') {
    // Test welcome email
    server.get('/api/dev/test-welcome', async (req, reply) => {
        const { to, name } = req.query as { to?: string; name?: string };

        if (!to) {
            return reply.status(400).send({
                error: 'Missing ?to= query param',
                example: '/api/dev/test-welcome?to=you@gmail.com&name=Adam'
            });
        }

        try {
            // Try to find the real user name from DB
            const userRow = await db.select().from(schema.users)
                .where(eq(schema.users.email, to)).limit(1);
            const displayName = name || userRow[0]?.name || userRow[0]?.username || 'there';

            const result = await sendWelcomeEmail(to, displayName);
            return {
                success: true,
                message: `Welcome email sent to ${to}`,
                resendId: (result as any)?.data?.id
            };
        } catch (err: any) {
            return reply.status(500).send({ success: false, error: err.message });
        }
    });

    // Test daily digest — pulls REAL stats from DB when the email matches a user
    server.get('/api/dev/test-streak', async (req, reply) => {
        const query = req.query as {
            to?: string;
            committed?: string;   // 'true' to simulate a committed day
            streak?: string;      // override streak count
        };

        if (!query.to) {
            return reply.status(400).send({
                error: 'Missing ?to= query param',
                example: '/api/dev/test-streak?to=you@gmail.com'
            });
        }

        const { sendDailyDigestEmail } = await import('./lib/email.js');

        try {
            // Look up actual user stats from DB by email
            const userRow = await db.select().from(schema.users)
                .where(eq(schema.users.email, query.to)).limit(1);

            const user = userRow[0];

            // Use real DB stats if found, fall back to test defaults if not
            const realStreak = user?.streak ?? 0;
            const realToday = user?.todayCommits ?? 0;
            const realTotal = user?.totalCommits ?? 0;
            const realWeekly = user?.weeklyCommits ?? 0;
            const realName = user?.name || user?.username || 'Dev';
            const realUsername = user?.username || 'github-user';

            // Allow manual overrides via query params
            const overrideCommitted = query.committed === 'true';
            const overrideStreak = query.streak ? parseInt(query.streak) : null;

            const finalStreak = overrideStreak ?? realStreak;
            // If ?committed=true override is passed, simulate 5 commits today
            const finalToday = query.committed !== undefined
                ? (overrideCommitted ? 5 : 0)
                : realToday;

            // If user exists, dynamically get or generate their competitive AI insight to preview
            const realEyeInsight = user ? await getOrGenerateEyeInsight(user.id) : null;

            const result = await sendDailyDigestEmail({
                to: query.to,
                name: realName,
                username: realUsername,
                streak: finalStreak,
                todayCommits: finalToday,
                totalCommits: realTotal,
                weeklyCommits: realWeekly,
                eyeInsight: realEyeInsight,
            });

            return {
                success: true,
                message: `Daily digest sent to ${query.to}`,
                stats: {
                    source: user ? 'database (real stats)' : 'defaults (no user found for this email)',
                    streak: finalStreak,
                    todayCommits: finalToday,
                    totalCommits: realTotal,
                    weeklyCommits: realWeekly,
                    mode: finalToday > 0 ? 'committed — celebration email' : 'no commits — warning email'
                },
                resendId: (result as any)?.data?.id
            };
        } catch (err: any) {
            return reply.status(500).send({ success: false, error: err.message });
        }
    });

    console.log('📧 Dev email test routes active:');
    console.log('   GET /api/dev/test-welcome?to=you@email.com');
    console.log('   GET /api/dev/test-streak?to=you@email.com             ← uses your real stats');
    console.log('   GET /api/dev/test-streak?to=you@email.com&committed=true  ← simulate committed day');
    console.log('   GET /api/dev/test-streak?to=you@email.com&committed=false ← simulate no commits');
}

// ── COMMUNITY ENDPOINTS ──
server.register(async (instance) => {
    // GET /api/community/stories
    instance.get('/api/community/stories', async (req, reply) => {
        try {
            const session = await getSessionFromRequest(req);
            let isAdmin = false;

            if (session) {
                const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.session.userId)).limit(1);
                isAdmin = user?.role === 'admin';
            }

            const query = db.select().from(schema.communityStories);

            if (!isAdmin) {
                query.where(eq(schema.communityStories.approved, true));
            }

            const allStories = await query.orderBy(desc(schema.communityStories.createdAt));
            return { stories: allStories, isAdmin };
        } catch (error) {
            console.error("Fetch stories error:", error);
            return reply.status(500).send({ message: "Failed to fetch stories" });
        }
    });

    // POST /api/community/stories
    instance.post('/api/community/stories', async (req, reply) => {
        const body = req.body as any;
        if (!body.name || !body.handle || !body.platform || !body.quote) {
            return reply.status(400).send({ message: "Missing required fields" });
        }

        try {
            const session = await getSessionFromRequest(req);
            let userId = session?.session.userId;
            let email = body.email;
            let image = body.image;

            // If not logged in but email provided, try to find user to link
            if (!userId && email) {
                const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
                if (user) {
                    userId = user.id;
                    if (!image) image = user.image;
                }
            } else if (session) {
                // If logged in, get email from session if not provided
                const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId as string)).limit(1);
                if (user) {
                    email = email || user.email;
                    if (!image) image = user.image;
                }
            }

            const [newStory] = await db.insert(schema.communityStories).values({
                userId,
                email: email,
                name: body.name,
                handle: body.handle,
                platform: body.platform,
                role: body.role,
                quote: body.quote,
                image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random`,
                featured: false,
                approved: false, // Moderation required
            } as any).returning();

            // Notify Admins
            try {
                const admins = await db.select({ email: schema.users.email })
                    .from(schema.users)
                    .where(eq(schema.users.role, 'admin'));

                const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

                if (adminEmails.length > 0) {
                    const { sendAdminStorySubmittedEmail } = await import('./lib/email.js');
                    await sendAdminStorySubmittedEmail(adminEmails, body.name, body.quote);
                }
            } catch (emailErr) {
                console.error("Failed to notify admins of new story:", emailErr);
            }

            return { success: true, story: newStory };
        } catch (error) {
            console.error("Submit story error:", error);
            return reply.status(500).send({ message: "Failed to submit story" });
        }
    });

    // Admin-only moderation endpoints
    instance.register(async (adminInstance) => {
        adminInstance.addHook('preHandler', async (req, reply) => {
            const session = await getSessionFromRequest(req);
            if (!session) return reply.status(401).send({ message: "Unauthorized" });

            const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.session.userId)).limit(1);
            if (user?.role !== 'admin') return reply.status(403).send({ message: "Forbidden" });
        });

        // PATCH /api/community/stories/:id/approve
        adminInstance.patch<{ Params: { id: string } }>('/api/community/stories/:id/approve', async (req, reply) => {
            try {
                const id = parseInt(req.params.id);
                const [story] = await db.update(schema.communityStories)
                    .set({ approved: true })
                    .where(eq(schema.communityStories.id, id))
                    .returning();

                if (story && story.email) {
                    // Send notification email
                    const { sendStoryPublishedEmail } = await import('./lib/email.js');
                    await sendStoryPublishedEmail(story.email, story.name);
                }

                return { success: true, story };
            } catch (error) {
                console.error("Approve story error:", error);
                return reply.status(500).send({ message: "Failed to approve story" });
            }
        });

        // PATCH /api/community/stories/:id/toggle-hero
        adminInstance.patch<{ Params: { id: string } }>('/api/community/stories/:id/toggle-hero', async (req, reply) => {
            try {
                const id = parseInt(req.params.id);
                const [story] = await db.select().from(schema.communityStories).where(eq(schema.communityStories.id, id)).limit(1);

                if (!story) return reply.status(404).send({ message: "Story not found" });

                const [updated] = await db.update(schema.communityStories)
                    .set({ heroFeatured: !story.heroFeatured })
                    .where(eq(schema.communityStories.id, id))
                    .returning();

                return { success: true, story: updated };
            } catch (error) {
                console.error("Toggle hero error:", error);
                return reply.status(500).send({ message: "Failed to toggle hero" });
            }
        });

        // PATCH /api/community/stories/:id/toggle-featured
        adminInstance.patch<{ Params: { id: string } }>('/api/community/stories/:id/toggle-featured', async (req, reply) => {
            try {
                const id = parseInt(req.params.id);
                const [story] = await db.select().from(schema.communityStories).where(eq(schema.communityStories.id, id)).limit(1);

                if (!story) return reply.status(404).send({ message: "Story not found" });

                const [updated] = await db.update(schema.communityStories)
                    .set({ featured: !story.featured })
                    .where(eq(schema.communityStories.id, id))
                    .returning();

                return { success: true, story: updated };
            } catch (error) {
                console.error("Toggle featured error:", error);
                return reply.status(500).send({ message: "Failed to toggle featured" });
            }
        });

        // DELETE /api/community/stories/:id
        adminInstance.delete<{ Params: { id: string } }>('/api/community/stories/:id', async (req, reply) => {
            try {
                const id = parseInt(req.params.id);
                await db.delete(schema.communityStories).where(eq(schema.communityStories.id, id));
                return { success: true };
            } catch (error) {
                console.error("Delete story error:", error);
                return reply.status(500).send({ message: "Failed to delete story" });
            }
        });

        // ── Academy Management (admin) ──────────────────────────────────────

        // GET /api/admin/academy/summary — dashboard stats
        adminInstance.get('/api/admin/academy/summary', async (_req, reply) => {
            try {
                const waitlistCount = (await db.select({ count: sql<number>`count(*)::int` }).from(schema.academyWaitlist))[0]?.count || 0;
                const lessonCount = (await db.select({ count: sql<number>`count(*)::int` }).from(schema.academyLessons))[0]?.count || 0;

                const statusRows = await db.select({
                    status: schema.users.academyStatus,
                    count: sql<number>`count(*)::int`,
                })
                    .from(schema.users)
                    .where(and(
                        isNotNull(schema.users.academyStatus),
                        ne(schema.users.academyStatus, 'none'),
                        ne(schema.users.academyStatus, 'audit_completed')
                    ))
                    .groupBy(schema.users.academyStatus);

                const reviewStats = await db.select({
                    avgScore: sql<number>`round(avg(${schema.academyReviews.score}))::int`,
                    count: sql<number>`count(*)::int`,
                }).from(schema.academyReviews);

                const byStatus: Record<string, number> = {};
                for (const r of statusRows) byStatus[r.status || 'unknown'] = r.count;

                return {
                    success: true,
                    summary: {
                        waitlistCount,
                        lessonCount,
                        graduates: byStatus['graduated'] || 0,
                        enrolled: byStatus['enrolled'] || 0,
                        premium: byStatus['premium'] || 0,
                        reviewsSubmitted: reviewStats[0]?.count || 0,
                        avgReviewScore: reviewStats[0]?.avgScore || 0,
                    }
                };
            } catch (error) {
                console.error("Academy admin summary error:", error);
                return reply.status(500).send({ message: "Failed to load academy summary" });
            }
        });

        // GET /api/admin/academy/students — full cohort roster w/ progress + PR score
        adminInstance.get('/api/admin/academy/students', async (_req, reply) => {
            try {
                const lessonCount = (await db.select({ count: sql<number>`count(*)::int` }).from(schema.academyLessons))[0]?.count || 0;
                const students = await db.select({
                    id: schema.users.id,
                    name: schema.users.name,
                    email: schema.users.email,
                    username: schema.users.username,
                    image: schema.users.image,
                    academyStatus: schema.users.academyStatus,
                    academyJoinedAt: schema.users.academyJoinedAt,
                    academyPrUrl: schema.users.academyPrUrl,
                    academyCertId: schema.users.academyCertId,
                    academyLessonsCompleted: schema.users.academyLessonsCompleted,
                    academyLastActiveAt: schema.users.academyLastActiveAt,
                })
                    .from(schema.users)
                    .where(and(
                        isNotNull(schema.users.academyStatus),
                        ne(schema.users.academyStatus, 'none'),
                        ne(schema.users.academyStatus, 'audit_completed')
                    ))
                    .orderBy(desc(schema.users.academyJoinedAt));

                const reviewRows = await db.select({
                    userId: schema.academyReviews.userId,
                    score: schema.academyReviews.score,
                    checkedAt: schema.academyReviews.checkedAt,
                })
                    .from(schema.academyReviews)
                    .orderBy(desc(schema.academyReviews.checkedAt));
                const latestScore = new Map<string, number>();
                for (const r of reviewRows) {
                    if (!latestScore.has(r.userId)) latestScore.set(r.userId, r.score);
                }

                return {
                    success: true,
                    students: students.map(s => ({
                        ...s,
                        prScore: latestScore.get(s.id) ?? null,
                        totalLessons: lessonCount,
                    })),
                };
            } catch (error) {
                console.error("Academy admin students error:", error);
                return reply.status(500).send({ message: "Failed to load academy students" });
            }
        });

        // PATCH /api/admin/academy/students/:userId — update status / progress fields
        adminInstance.patch<{ Params: { userId: string } }>('/api/admin/academy/students/:userId', async (req, reply) => {
            try {
                const { userId } = req.params;
                const body = (req.body || {}) as {
                    status?: string;
                    lessonsCompleted?: number;
                    prUrl?: string | null;
                    certId?: string | null;
                };

                const allowedStatus = ['none', 'audit_completed', 'enrolled', 'premium', 'graduated'];
                if (body.status !== undefined && !allowedStatus.includes(body.status)) {
                    return reply.status(400).send({ message: "Invalid academy status" });
                }

                const set: Record<string, unknown> = { updatedAt: new Date() };
                if (body.status !== undefined) set.academyStatus = body.status;
                if (body.lessonsCompleted !== undefined) set.academyLessonsCompleted = body.lessonsCompleted;
                if (body.prUrl !== undefined) set.academyPrUrl = body.prUrl;
                if (body.certId !== undefined) set.academyCertId = body.certId;

                const [updated] = await db.update(schema.users)
                    .set(set)
                    .where(eq(schema.users.id, userId))
                    .returning({
                        id: schema.users.id,
                        name: schema.users.name,
                        academyStatus: schema.users.academyStatus,
                        academyLessonsCompleted: schema.users.academyLessonsCompleted,
                        academyPrUrl: schema.users.academyPrUrl,
                        academyCertId: schema.users.academyCertId,
                    });

                if (!updated) return reply.status(404).send({ message: "Student not found" });
                return { success: true, student: updated };
            } catch (error) {
                console.error("Academy admin student update error:", error);
                return reply.status(500).send({ message: "Failed to update student" });
            }
        });

        // GET /api/admin/academy/lessons — manage curriculum
        adminInstance.get('/api/admin/academy/lessons', async (_req, reply) => {
            try {
                const lessons = await db.select()
                    .from(schema.academyLessons)
                    .orderBy(schema.academyLessons.sortOrder);
                return { success: true, lessons };
            } catch (error) {
                console.error("Academy admin lessons error:", error);
                return reply.status(500).send({ message: "Failed to load lessons" });
            }
        });

        // POST /api/admin/academy/lessons — create a lesson
        adminInstance.post('/api/admin/academy/lessons', async (req, reply) => {
            try {
                const b = (req.body || {}) as Record<string, unknown>;
                const id = String(b.id || '').trim();
                if (!id) return reply.status(400).send({ message: "Lesson id is required" });
                if (!b.title) return reply.status(400).send({ message: "Lesson title is required" });

                await db.insert(schema.academyLessons).values({
                    id,
                    week: Number(b.week) || 1,
                    weekTitle: String(b.weekTitle || ''),
                    title: String(b.title),
                    duration: String(b.duration || ''),
                    description: String(b.description || ''),
                    content: String(b.content || ''),
                    lab: String(b.lab || ''),
                    sortOrder: Number(b.sortOrder) || 0,
                }).onConflictDoNothing();

                return { success: true };
            } catch (error) {
                console.error("Academy admin lesson create error:", error);
                return reply.status(500).send({ message: "Failed to create lesson" });
            }
        });

        // PUT /api/admin/academy/lessons/:id — update a lesson
        adminInstance.put<{ Params: { id: string } }>('/api/admin/academy/lessons/:id', async (req, reply) => {
            try {
                const { id } = req.params;
                const b = (req.body || {}) as Record<string, unknown>;

                const set: Record<string, unknown> = {};
                if (b.week !== undefined) set.week = Number(b.week);
                if (b.weekTitle !== undefined) set.weekTitle = String(b.weekTitle);
                if (b.title !== undefined) set.title = String(b.title);
                if (b.duration !== undefined) set.duration = String(b.duration);
                if (b.description !== undefined) set.description = String(b.description);
                if (b.content !== undefined) set.content = String(b.content);
                if (b.lab !== undefined) set.lab = String(b.lab);
                if (b.sortOrder !== undefined) set.sortOrder = Number(b.sortOrder);

                const [updated] = await db.update(schema.academyLessons)
                    .set(set)
                    .where(eq(schema.academyLessons.id, id))
                    .returning();
                if (!updated) return reply.status(404).send({ message: "Lesson not found" });
                return { success: true, lesson: updated };
            } catch (error) {
                console.error("Academy admin lesson update error:", error);
                return reply.status(500).send({ message: "Failed to update lesson" });
            }
        });

        // DELETE /api/admin/academy/lessons/:id — remove a lesson
        adminInstance.delete<{ Params: { id: string } }>('/api/admin/academy/lessons/:id', async (req, reply) => {
            try {
                await db.delete(schema.academyLessons).where(eq(schema.academyLessons.id, req.params.id));
                return { success: true };
            } catch (error) {
                console.error("Academy admin lesson delete error:", error);
                return reply.status(500).send({ message: "Failed to delete lesson" });
            }
        });

        // GET /api/admin/academy/waitlist — full waitlist
        adminInstance.get('/api/admin/academy/waitlist', async (_req, reply) => {
            try {
                const rows = await db.select().from(schema.academyWaitlist).orderBy(desc(schema.academyWaitlist.createdAt));
                return { success: true, waitlist: rows };
            } catch (error) {
                console.error("Academy admin waitlist error:", error);
                return reply.status(500).send({ message: "Failed to load waitlist" });
            }
        });

        // DELETE /api/admin/academy/waitlist/:id — remove a waitlist entry
        adminInstance.delete<{ Params: { id: string } }>('/api/admin/academy/waitlist/:id', async (req, reply) => {
            try {
                await db.delete(schema.academyWaitlist).where(eq(schema.academyWaitlist.id, parseInt(req.params.id)));
                return { success: true };
            } catch (error) {
                console.error("Academy admin waitlist delete error:", error);
                return reply.status(500).send({ message: "Failed to remove waitlist entry" });
            }
        });

        // GET /api/admin/academy/reviews — all AI PR reviews
        adminInstance.get('/api/admin/academy/reviews', async (_req, reply) => {
            try {
                const rows = await db.select({
                    id: schema.academyReviews.id,
                    certId: schema.academyReviews.certId,
                    prUrl: schema.academyReviews.prUrl,
                    score: schema.academyReviews.score,
                    summary: schema.academyReviews.summary,
                    strengths: schema.academyReviews.strengths,
                    improvements: schema.academyReviews.improvements,
                    checkedAt: schema.academyReviews.checkedAt,
                    userId: schema.academyReviews.userId,
                })
                    .from(schema.academyReviews)
                    .orderBy(desc(schema.academyReviews.checkedAt));

                return { success: true, reviews: rows };
            } catch (error) {
                console.error("Academy admin reviews error:", error);
                return reply.status(500).send({ message: "Failed to load reviews" });
            }
        });
    });

    // GET /api/community/events
    instance.get('/api/community/events', async (req, reply) => {
        try {
            const allEvents = await db.select()
                .from(schema.events)
                .orderBy(desc(schema.events.createdAt));
            return { events: allEvents };
        } catch (error) {
            console.error("Fetch events error:", error);
            return reply.status(500).send({ message: "Failed to fetch events" });
        }
    });

    // GET /api/community/stats
    instance.get('/api/community/stats', async (req, reply) => {
        try {
            const userStats = await db.select({
                totalUsers: sql<number>`count(${schema.users.id})`,
                totalStreakDays: sql<number>`sum(coalesce(${schema.users.streak}, 0))`,
                totalCommits: sql<number>`sum(coalesce(${schema.users.totalCommits}, 0))`,
                totalContributions: sql<number>`sum(coalesce(${schema.users.totalPullRequests}, 0))`,
            }).from(schema.users);

            const stats = [
                { icon: 'Users', value: `${(userStats[0]?.totalUsers || 0).toLocaleString()}+`, label: "Developers" },
                { icon: 'Flame', value: `${((userStats[0]?.totalStreakDays || 0) / 1000000).toFixed(1)}M+`, label: "Streak Days" },
                { icon: 'Star', value: "98%", label: "Satisfaction" },
                { icon: 'GitPullRequest', value: `${(userStats[0]?.totalContributions || 0).toLocaleString()}+`, label: "Contributions" },
            ];

            return { stats };
        } catch (error) {
            console.error("Fetch community stats error:", error);
            return reply.status(500).send({ message: "Failed to fetch community stats" });
        }
    });

    // GET /api/community/hero-avatars
    instance.get('/api/community/hero-avatars', async (req, reply) => {
        try {
            const avatars = await db.select({
                image: schema.communityStories.image,
                name: schema.communityStories.name
            })
                .from(schema.communityStories)
                .where(and(
                    eq(schema.communityStories.approved, true),
                    eq(schema.communityStories.heroFeatured, true)
                ))
                .limit(8);

            return { avatars };
        } catch (error) {
            console.error("Fetch hero avatars error:", error);
            return reply.status(500).send({ message: "Failed to fetch hero avatars" });
        }
    });

    // POST /api/community/upload
    instance.post('/api/community/upload', async (req, reply) => {
        try {
            const data = await req.file();
            if (!data) return reply.status(400).send({ message: "No file uploaded" });

            const ext = path.extname(data.filename);
            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!supabaseUrl || !supabaseServiceKey) {
                console.warn("Supabase Storage configuration missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Falling back to local disk upload.");
                const uploadPath = path.join(__dirname, '../public/uploads', filename);
                await fs.mkdir(path.dirname(uploadPath), { recursive: true });
                await fs.writeFile(uploadPath, await data.toBuffer());

                const isLocal = req.hostname.includes('localhost') || req.hostname.includes('127.0.0.1');
                const baseUrl = isLocal ? `http://${req.hostname}:3000` : '';

                return {
                    url: `${baseUrl}/public/uploads/${filename}`
                };
            }

            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const buffer = await data.toBuffer();

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('community-images')
                .upload(filename, buffer, {
                    contentType: data.mimetype,
                    upsert: true
                });

            if (uploadError) {
                console.error("Supabase storage upload error details:", uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('community-images')
                .getPublicUrl(filename);

            console.log(`Image successfully uploaded to Supabase Storage: ${publicUrl}`);

            return {
                url: publicUrl
            };
        } catch (error) {
            console.error("Upload error:", error);
            return reply.status(500).send({ message: "Upload failed" });
        }
    });

    // ─── THE EYE: Watchlist Routes ────────────────────────────────────────────

    // GET /api/eye/watchlist — fetch current user's watchlist & auto-generate daily insight
    instance.get('/api/eye/watchlist', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;
        try {
            const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
            if (!user) return reply.status(404).send({ message: 'User not found' });

            const entries = await db.select()
                .from(schema.watchlist)
                .where(eq(schema.watchlist.userId, userId))
                .orderBy(desc(schema.watchlist.addedAt));

            let currentInsight = user.eyeInsight;
            let currentInsightUpdatedAt = user.eyeInsightUpdatedAt;
            let currentCount = 0;

            if (entries.length > 0) {
                // Fetch or automatically generate/cache insight for today
                const freshInsight = await getOrGenerateEyeInsight(userId);
                if (freshInsight) {
                    const [updatedUser] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
                    if (updatedUser) {
                        currentInsight = updatedUser.eyeInsight;
                        currentInsightUpdatedAt = updatedUser.eyeInsightUpdatedAt;
                        currentCount = updatedUser.eyeInsightCount || 0;
                    }
                } else {
                    currentCount = user.eyeInsightCount || 0;
                }
            } else {
                // If watchlist is empty, clear insight
                if (currentInsight) {
                    await db.update(schema.users)
                        .set({ eyeInsight: null, eyeInsightUpdatedAt: null, eyeInsightCount: 0 })
                        .where(eq(schema.users.id, userId));
                    currentInsight = null;
                    currentInsightUpdatedAt = null;
                    currentCount = 0;
                }
            }

            const remaining = Math.max(0, 3 - currentCount);

            return { 
                watchlist: entries,
                eyeInsight: currentInsight,
                eyeInsightUpdatedAt: currentInsightUpdatedAt ? currentInsightUpdatedAt.toISOString() : null,
                eyeInsightCount: currentCount,
                eyeInsightRemaining: remaining
            };
        } catch (error) {
            console.error('Eye watchlist fetch error:', error);
            return reply.status(500).send({ message: 'Failed to fetch watchlist' });
        }
    });

    // POST /api/eye/watchlist — add a GitHub user to watchlist
    instance.post('/api/eye/watchlist', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;
        const { githubUsername } = req.body as { githubUsername: string };

        if (!githubUsername) return reply.status(400).send({ message: 'githubUsername is required' });

        // Check limit (max 15 per user)
        const existing = await db.select().from(schema.watchlist).where(eq(schema.watchlist.userId, userId));
        if (existing.length >= 15) {
            return reply.status(400).send({ message: 'Watchlist is full (max 15). Remove someone first.' });
        }

        // Verify the GitHub user exists & fetch their public profile
        try {
            const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername)}`, {
                headers: { 'User-Agent': 'Evergreeners-App', 'Accept': 'application/vnd.github+json' }
            });

            if (!ghRes.ok) {
                if (ghRes.status === 404) return reply.status(404).send({ message: `GitHub user "${githubUsername}" not found.` });
                return reply.status(400).send({ message: 'Could not verify GitHub user.' });
            }

            const ghUser = await ghRes.json() as any;

            // Insert (upsert safe)
            await db.insert(schema.watchlist).values({
                userId,
                githubUsername: ghUser.login,
                displayName: ghUser.name || ghUser.login,
                avatarUrl: ghUser.avatar_url,
                addedAt: new Date(),
            }).onConflictDoUpdate({
                target: [schema.watchlist.userId, schema.watchlist.githubUsername],
                set: {
                    displayName: ghUser.name || ghUser.login,
                    avatarUrl: ghUser.avatar_url,
                }
            });

            return { success: true, user: { login: ghUser.login, name: ghUser.name, avatarUrl: ghUser.avatar_url } };
        } catch (error) {
            console.error('Eye add watchlist error:', error);
            return reply.status(500).send({ message: 'Failed to add to watchlist' });
        }
    });

    // DELETE /api/eye/watchlist/:username — remove from watchlist
    instance.delete('/api/eye/watchlist/:username', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;
        const { username } = req.params as { username: string };

        try {
            await db.delete(schema.watchlist)
                .where(and(
                    eq(schema.watchlist.userId, userId),
                    eq(schema.watchlist.githubUsername, username)
                ));
            return { success: true };
        } catch (error) {
            console.error('Eye delete watchlist error:', error);
            return reply.status(500).send({ message: 'Failed to remove from watchlist' });
        }
    });

    // GET /api/eye/stats/:username — fetch public GitHub stats for a watched user
    // Uses the authenticated user's own token to avoid unauthenticated rate-limits
    instance.get('/api/eye/stats/:username', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;
        const { username } = req.params as { username: string };

        // Get the caller's GitHub token
        const account = await db.select().from(schema.accounts)
            .where(and(
                eq(schema.accounts.userId, userId),
                eq(schema.accounts.providerId, 'github')
            ))
            .limit(1);

        const token = account[0]?.accessToken;

        try {
            // Use the GitHub GraphQL API to fetch public contribution stats
            const query = `
                query($username: String!) {
                    user(login: $username) {
                        login
                        name
                        avatarUrl
                        bio
                        followers { totalCount }
                        following { totalCount }
                        repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
                        pullRequests(first: 0) { totalCount }
                        contributionsCollection {
                            totalCommitContributions
                            totalPullRequestContributions
                            contributionCalendar {
                                totalContributions
                                weeks {
                                    contributionDays {
                                        contributionCount
                                        date
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'Evergreeners-App',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const ghRes = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers,
                body: JSON.stringify({ query, variables: { username } }),
            });

            if (!ghRes.ok) {
                return reply.status(502).send({ message: 'GitHub API error' });
            }

            const data: any = await ghRes.json();
            if (data.errors) {
                const msg = data.errors[0]?.message || 'GitHub GraphQL error';
                if (msg.includes('Could not resolve')) return reply.status(404).send({ message: `User "${username}" not found on GitHub.` });
                return reply.status(502).send({ message: msg });
            }

            const ghUser = data.data.user;
            if (!ghUser) return reply.status(404).send({ message: `User "${username}" not found.` });

            const cal = ghUser.contributionsCollection.contributionCalendar;
            const allDays = cal.weeks.flatMap((w: any) => w.contributionDays).reverse();

            const todayStr = new Date().toISOString().split('T')[0];
            const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
            const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
            const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            const weeklyCommits = allDays
                .filter((d: any) => d.date >= sevenDaysAgo && d.date <= todayStr)
                .reduce((acc: number, d: any) => acc + d.contributionCount, 0);

            const monthlyCommits = allDays
                .filter((d: any) => d.date >= thirtyDaysAgo && d.date <= todayStr)
                .reduce((acc: number, d: any) => acc + d.contributionCount, 0);

            const todayCommits = allDays.find((d: any) => d.date === todayStr)?.contributionCount || 0;

            // Streak
            let currentStreak = 0;
            const startIndex = allDays.findIndex((d: any) => d.contributionCount > 0);
            if (startIndex !== -1) {
                const lastDate = allDays[startIndex].date;
                if (lastDate >= yesterdayStr) {
                    for (let i = startIndex; i < allDays.length; i++) {
                        if (allDays[i].contributionCount > 0) currentStreak++;
                        else break;
                    }
                }
            }

            // Last 30 days for sparkline
            const last30 = allDays
                .filter((d: any) => d.date >= thirtyDaysAgo)
                .reverse()
                .map((d: any) => ({ date: d.date, count: d.contributionCount }));

            const stats = {
                login: ghUser.login,
                name: ghUser.name,
                avatarUrl: ghUser.avatarUrl,
                bio: ghUser.bio,
                followers: ghUser.followers.totalCount,
                following: ghUser.following.totalCount,
                publicRepos: ghUser.repositories.totalCount,
                totalPRs: ghUser.pullRequests.totalCount,
                totalContributions: cal.totalContributions,
                weeklyCommits,
                monthlyCommits,
                todayCommits,
                currentStreak,
                last30,
                fetchedAt: new Date().toISOString(),
            };

            // Cache the stats in the DB
            await db.update(schema.watchlist)
                .set({ cachedStats: stats, lastRefreshed: new Date() })
                .where(and(
                    eq(schema.watchlist.userId, userId),
                    eq(schema.watchlist.githubUsername, username)
                ));

            return { stats };
        } catch (error) {
            console.error('Eye stats fetch error:', error);
            return reply.status(500).send({ message: 'Failed to fetch GitHub stats' });
        }
    });

    // POST /api/eye/analyze — AI analysis of watchlist vs user's own stats
    instance.post('/api/eye/analyze', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;

        // Fetch user from DB to check daily quota
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        if (!user) return reply.status(404).send({ message: 'User not found' });

        const todayStr = new Date().toISOString().split('T')[0];
        const lastUpdatedStr = user.eyeInsightUpdatedAt ? new Date(user.eyeInsightUpdatedAt).toISOString().split('T')[0] : null;
        const currentCount = lastUpdatedStr === todayStr ? (user.eyeInsightCount || 0) : 0;

        if (currentCount >= 3) {
            return reply.status(400).send({ 
                message: 'Daily limit reached. You can only request up to 2 manual refreshes per day (3 total AI insights).' 
            });
        }

        const { watchlistStats, myStats } = req.body as {
            watchlistStats: any[];
            myStats: {
                username: string;
                weeklyCommits: number;
                monthlyCommits?: number;
                streak: number;
                totalCommits: number;
                totalPullRequests: number;
            };
        };

        if (!watchlistStats || watchlistStats.length === 0) {
            return reply.status(400).send({ message: 'No watchlist stats provided for analysis.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return reply.status(500).send({ message: 'AI analysis is not configured.' });
        }

        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const watchlistSummary = watchlistStats.map(w =>
                `- @${w.login}: ${w.weeklyCommits} commits/week, ${w.monthlyCommits} commits/month, ${w.currentStreak}-day streak, ${w.totalPRs} total PRs`
            ).join('\n');

            const prompt = `You are an elite software engineering coach and competitive intelligence analyst for a developer productivity platform called Evergreeners.

The user @${myStats.username} is watching these GitHub developers:
${watchlistSummary}

The user's own stats:
- Weekly commits: ${myStats.weeklyCommits}
- Streak: ${myStats.streak} days
- Total commits: ${myStats.totalCommits}
- Total PRs: ${myStats.totalPullRequests}

Provide a sharp, motivating, brutally honest competitive analysis. Be direct, use personality, and make the user feel the heat of competition. Structure your response exactly like this (use markdown):

## 🧠 The Eye's Read

[1-2 sentences: Overall competitive situation - where does the user stand vs the watchlist?]

## 🔥 Threats

[Bullet points about users who are clearly outperforming or surging in activity. Be specific with numbers.]

## 📊 Your Position

[Honest assessment of the user's current momentum. Good AND bad.]

## ⚡ Intel Report

[2-3 specific, actionable things the user should do RIGHT NOW to compete. Be specific and motivating.]

Keep the total response under 300 words. Be like a hype coach mixed with a ruthless analyst. Don't soften the truth.`;

            const result = await model.generateContent(prompt);
            const analysis = result.response.text();

            const nextCount = lastUpdatedStr === todayStr ? (user.eyeInsightCount || 0) + 1 : 1;

            // Cache in users table
            await db.update(schema.users)
                .set({ 
                    eyeInsight: analysis, 
                    eyeInsightUpdatedAt: new Date(),
                    eyeInsightCount: nextCount
                })
                .where(eq(schema.users.id, userId));

            return { 
                analysis, 
                generatedAt: new Date().toISOString(),
                eyeInsightCount: nextCount,
                eyeInsightRemaining: Math.max(0, 3 - nextCount)
            };
        } catch (error) {
            console.error('Eye AI analysis error:', error);
            return reply.status(500).send({ message: 'AI analysis failed.' });
        }
    });

    // GET /api/eye/github-search/:query — search GitHub users for autocomplete
    instance.get('/api/eye/github-search/:query', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;
        const { query } = req.params as { query: string };
        if (!query || query.length < 2) return { users: [] };

        const account = await db.select().from(schema.accounts)
            .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.providerId, 'github')))
            .limit(1);

        const token = account[0]?.accessToken;
        const headers: Record<string, string> = {
            'User-Agent': 'Evergreeners-App',
            'Accept': 'application/vnd.github+json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const searchRes = await fetch(
                `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=5`,
                { headers }
            );
            if (!searchRes.ok) return { users: [] };
            const data: any = await searchRes.json();
            const users = (data.items || []).map((u: any) => ({
                login: u.login,
                avatarUrl: u.avatar_url,
            }));
            return { users };
        } catch {
            return { users: [] };
        }
    });

    // In-memory cache for suggestions to avoid hitting GitHub API on every refresh
    const suggestionsCache = new Map<string, { data: any, ts: number }>();

    // GET /api/eye/suggestions — suggest users to watch based on who the user follows on GitHub
    instance.get('/api/eye/suggestions', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: 'Unauthorized' });

        const userId = session.session.userId;

        // Check cache (5 minute TTL)
        const cached = suggestionsCache.get(`v2_${userId}`);
        if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
            return cached.data;
        }

        const account = await db.select().from(schema.accounts)
            .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.providerId, 'github')))
            .limit(1);

        const token = account[0]?.accessToken;
        if (!token) return { suggestions: [] };

        const currentWatchlist = await db.select({ githubUsername: schema.watchlist.githubUsername })
            .from(schema.watchlist)
            .where(eq(schema.watchlist.userId, userId));
        const watchedSet = new Set(currentWatchlist.map(w => w.githubUsername.toLowerCase()));

        const user = await db.select({ username: schema.users.username })
            .from(schema.users)
            .where(eq(schema.users.id, userId))
            .limit(1);
        const myUsername = user[0]?.username?.toLowerCase() || '';

        try {
            const headers: Record<string, string> = {
                'User-Agent': 'Evergreeners-App',
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
            };

            const [followingRes, followersRes] = await Promise.all([
                fetch('https://api.github.com/user/following?per_page=100', { headers }),
                fetch('https://api.github.com/user/followers?per_page=100', { headers }),
            ]);

            if (!followingRes.ok) return { suggestions: [] };

            const following: any[] = await followingRes.json();
            const followers: any[] = followersRes.ok ? await followersRes.json() : [];
            const followerSet = new Set(followers.map((f: any) => f.login.toLowerCase()));

            const candidates = following
                .filter(u => u.type === 'User')
                .filter(u => !watchedSet.has(u.login.toLowerCase()) && u.login.toLowerCase() !== myUsername);

            if (candidates.length === 0) return { suggestions: [] };

            // Batch-fetch recent activity using GraphQL
            const batch = candidates.slice(0, 40);
            const gqlHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'Evergreeners-App',
                'Authorization': `Bearer ${token}`,
            };

            const userFragments = batch.map((u, i) =>
                `u${i}: user(login: "${u.login}") { login contributionsCollection { contributionCalendar { weeks { contributionDays { contributionCount } } } } }`
            ).join('\n');

            const gqlQuery = `query { ${userFragments} }`;
            // Using a plain object instead of Map for safer serialization/access
            const activityData: Record<string, { count: number; days: number[] }> = {};

            try {
                const gqlRes = await fetch('https://api.github.com/graphql', {
                    method: 'POST',
                    headers: gqlHeaders,
                    body: JSON.stringify({ query: gqlQuery }),
                });

                if (gqlRes.ok) {
                    const gqlData: any = await gqlRes.json();
                    if (gqlData.data) {
                        Object.values(gqlData.data).forEach((u: any) => {
                            if (u?.login && u?.contributionsCollection?.contributionCalendar) {
                                const weeks = u.contributionsCollection.contributionCalendar.weeks || [];
                                const allDays = weeks.flatMap((w: any) => w.contributionDays || []);
                                // Slice last 30 days from the full year
                                const last30 = allDays.slice(-30);
                                const counts: number[] = last30.map((d: any) => d.contributionCount || 0);
                                const total = counts.reduce((a: number, b: number) => a + b, 0);
                                activityData[u.login.toLowerCase()] = { count: total, days: counts };
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("GraphQL suggestions fetch error:", e);
            }

            const suggestions = candidates.map(u => {
                const activity = activityData[u.login.toLowerCase()];
                return {
                    login: u.login,
                    avatarUrl: u.avatar_url,
                    mutual: followerSet.has(u.login.toLowerCase()),
                    recentActivity: activity?.count ?? 0,
                    activityDays: activity?.days ?? Array(30).fill(0), // Fallback to zeros instead of empty to show 'low' state
                };
            })
            .sort((a, b) => b.recentActivity - a.recentActivity);

            const response = { suggestions };
            // Save to cache with versioned key
            suggestionsCache.set(`v2_${userId}`, { data: response, ts: Date.now() });

            return response;
        } catch (e) {
            console.error("Suggestions route error:", e);
            return { suggestions: [] };
        }
    });

    // ─── Academy Endpoints ──────────────────────────────────────────────────

    // 1. GET /api/academy/status (Authenticated)
    instance.get('/api/academy/status', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const user = await db.select({
            academyStatus: schema.users.academyStatus,
            academyJoinedAt: schema.users.academyJoinedAt,
            academyPrUrl: schema.users.academyPrUrl,
            academyCertId: schema.users.academyCertId,
            name: schema.users.name,
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

        if (!user.length) return reply.status(404).send({ message: "User not found" });

        return {
            success: true,
            status: user[0].academyStatus || 'none',
            joinedAt: user[0].academyJoinedAt,
            prUrl: user[0].academyPrUrl,
            certId: user[0].academyCertId,
            name: user[0].name,
            launchDate: ACADEMY_LAUNCH_DATE,
            isLaunchOpen: isAcademyOpen()
        };
    });

    // 1.5. GET /api/academy/lessons (Authenticated — curriculum from DB)
    instance.get('/api/academy/lessons', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const rows = await db.select({
            id: schema.academyLessons.id,
            week: schema.academyLessons.week,
            weekTitle: schema.academyLessons.weekTitle,
            title: schema.academyLessons.title,
            duration: schema.academyLessons.duration,
            description: schema.academyLessons.description,
            content: schema.academyLessons.content,
            lab: schema.academyLessons.lab,
            sortOrder: schema.academyLessons.sortOrder,
        })
        .from(schema.academyLessons)
        .orderBy(schema.academyLessons.sortOrder);

        const weeks = rows.reduce<Array<{ number: number; title: string; lessons: Array<{ id: string; title: string; duration: string; description: string; content: string; lab: string }> }>>((acc, row) => {
            let week = acc.find((w) => w.number === row.week);
            if (!week) {
                week = { number: row.week, title: row.weekTitle, lessons: [] };
                acc.push(week);
            }
            week.lessons.push({
                id: row.id,
                title: row.title,
                duration: row.duration,
                description: row.description,
                content: row.content,
                lab: row.lab,
            });
            return acc;
        }, []);

        return { success: true, weeks };
    });

    // 2. GET /api/academy/progress (Authenticated)
    instance.get('/api/academy/progress', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });
        const userId = session.session.userId;

        const rows = await db.select({ lessonId: schema.lessonProgress.lessonId })
            .from(schema.lessonProgress)
            .where(eq(schema.lessonProgress.userId, userId));

        return {
            success: true,
            completed: rows.map((r) => r.lessonId),
            count: rows.length,
        };
    });

    // 3. POST /api/academy/lessons/complete (Authenticated)
    instance.post('/api/academy/lessons/complete', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });
        const userId = session.session.userId;

        const { lessonId, completed } = (req.body || {}) as { lessonId?: string; completed?: boolean };
        if (!lessonId) return reply.status(400).send({ message: "lessonId is required." });

        const user = await db.query.users.findFirst({
            where: eq(schema.users.id, userId),
            columns: { id: true, academyStatus: true },
        });
        if (!user || user.academyStatus === 'none') {
            return reply.status(403).send({ message: "You must be enrolled in the Academy to track lessons." });
        }

        if (completed) {
            await db.insert(schema.lessonProgress)
                .values({ userId, lessonId })
                .onConflictDoNothing();
        } else {
            await db.delete(schema.lessonProgress)
                .where(
                    and(eq(schema.lessonProgress.userId, userId), eq(schema.lessonProgress.lessonId, lessonId))
                );
        }

        const countRow = await db.select({ count: sql<number>`count(*)::int` })
            .from(schema.lessonProgress)
            .where(eq(schema.lessonProgress.userId, userId));
        const count = countRow[0]?.count || 0;

        await db.update(schema.users)
            .set({
                academyLessonsCompleted: count,
                academyLastActiveAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(schema.users.id, userId));

        if (completed) {
            try {
                const stats: UserStats = {
                    totalCommits: 0,
                    lateNightCommits: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    hadBrokenStreak: false,
                    questsCompleted: 0,
                    questsAccepted: 0,
                    overachieverQuests: 0,
                    goalsCompleted: 0,
                    goalsCompletedEarly: 0,
                    accountAgeDays: 0,
                    totalActiveDays: 0,
                    isFirstDay: false,
                    isProfilePublic: true,
                    isGithubConnected: true,
                    hasBio: false,
                    hasLocation: false,
                    leaderboardRank: null,
                    profileViews: 0,
                    fullYearGreen: false,
                    isNewYearsCommit: false,
                    isLunchBreakCommit: false,
                    isFourAmCommit: false,
                    hasSpeedRunnerQuest: false,
                    isCountryLeader: false,
                    academyLessonsCompleted: count,
                };
                await checkAndAwardBadges(userId, stats);
            } catch (err) {
                console.error('Error awarding academy scholar badge:', err);
            }
        }

        return { success: true, count };
    });

    // 4. GET /api/academy/waitlist/count (Public — social proof)
    instance.get('/api/academy/waitlist/count', async (_req, reply) => {
        try {
            const countRow = await db.select({ count: sql<number>`count(*)::int` })
                .from(schema.academyWaitlist);
            return { success: true, count: countRow[0]?.count || 0 };
        } catch (err) {
            console.error('Error fetching waitlist count:', err);
            return reply.status(500).send({ message: "Could not load waitlist count." });
        }
    });

    // 5. POST /api/academy/waitlist (Public — email capture before launch)
    instance.post('/api/academy/waitlist', async (req, reply) => {
        const { email, name } = (req.body || {}) as { email?: string; name?: string };
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return reply.status(400).send({ message: "A valid email address is required." });
        }

        try {
            await db.insert(schema.academyWaitlist)
                .values({ email: normalizedEmail })
                .onConflictDoNothing();

            const launchHref = `${process.env.APP_URL || 'https://evergreeners.dev'}/academy`;
            sendAcademyWaitlistConfirmationEmail({
                to: normalizedEmail,
                name: name || undefined,
                launchDateLabel: ACADEMY_LAUNCH_DATE_LABEL,
                launchHref,
            }).catch((err) => console.error('Waitlist confirmation email failed:', err.message));

            return { success: true, message: `You're on the list. We'll email you when the Academy opens on ${ACADEMY_LAUNCH_DATE_LABEL}.` };
        } catch (err: any) {
            console.error('Error saving waitlist entry:', err);
            return reply.status(500).send({ message: "Could not save your email. Please try again." });
        }
    });

    // 3. POST /api/academy/enroll (Authenticated)
    instance.post('/api/academy/enroll', async (req, reply) => {
        if (!isAcademyOpen()) {
            return reply.status(403).send({
                message: `The Academy opens on ${ACADEMY_LAUNCH_DATE_LABEL}. Check back then to enroll.`,
                launchDate: ACADEMY_LAUNCH_DATE
            });
        }

        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;

        await db.update(schema.users)
            .set({
                academyStatus: 'enrolled',
                academyJoinedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(schema.users.id, userId));

        return { success: true, status: 'enrolled' };
    });

    // 3. POST /api/academy/audit (Public Lead Magnet)
    instance.post('/api/academy/audit', async (req, reply) => {
        const { username } = req.body as { username: string };
        if (!username) return reply.status(400).send({ message: "GitHub username is required" });

        try {
            // Check if profile README exists
            const readmeRes = await fetch(`https://api.github.com/repos/${username}/${username}`, {
                headers: { 'User-Agent': 'Evergreeners-App' }
            });
            const profileReadmeExists = readmeRes.status === 200;

            // Fetch public repositories
            const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
                headers: { 'User-Agent': 'Evergreeners-App' }
            });

            if (reposRes.status === 403 || reposRes.status === 429) {
                console.warn(`GitHub API rate limited for audit: ${username}. Falling back to simulation.`);
                const mockScore = Math.floor(Math.random() * 30) + 40;
                return {
                    success: true,
                    rateLimited: true,
                    score: mockScore,
                    profileReadmeExists: Math.random() > 0.5,
                    graveyardIndex: Math.floor(Math.random() * 40) + 20,
                    pinnedReposCount: Math.floor(Math.random() * 4) + 1,
                    feedback: [
                        "Rate-limited by GitHub API, but estimated score indicates potential graveyard repos.",
                        "Consider creating a custom Profile README to stand out to recruiters.",
                        "Your repositories show mixed activity patterns; stay consistent to build trust."
                    ]
                };
            }

            if (!reposRes.ok) {
                return reply.status(400).send({ message: `Failed to fetch GitHub profile for ${username}` });
            }

            const repos: any[] = await reposRes.json();
            const totalRepos = repos.length;

            if (totalRepos === 0) {
                return {
                    success: true,
                    score: 20,
                    profileReadmeExists,
                    graveyardIndex: 0,
                    pinnedReposCount: 0,
                    feedback: [
                        "Your profile is a clean slate. No public repositories found.",
                        "Create your first repository and commit consistency.",
                        "Learn how to set up your GitHub profile in Evergreeners Academy!"
                    ]
                };
            }

            const now = Date.now();
            const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
            
            let graveyardCount = 0;
            let starCount = 0;
            let forkCount = 0;

            repos.forEach(repo => {
                starCount += repo.stargazers_count || 0;
                if (repo.fork) forkCount++;

                const updatedAt = new Date(repo.updated_at || repo.pushed_at).getTime();
                if (updatedAt < sixMonthsAgo) {
                    graveyardCount++;
                }
            });

            const graveyardIndex = Math.round((graveyardCount / totalRepos) * 100);

            let score = 100;
            const feedback: string[] = [];

            if (!profileReadmeExists) {
                score -= 15;
                feedback.push("Missing a Profile README. Make a README repository to introduce yourself to profile visitors.");
            } else {
                feedback.push("✓ Profile README exists! Excellent for presenting your skills.");
            }

            if (graveyardIndex > 50) {
                score -= 20;
                feedback.push(`High Graveyard Index (${graveyardIndex}%): More than half of your repositories haven't been updated in 6 months. Clean up or archive inactive repos.`);
            } else if (graveyardIndex > 20) {
                score -= 10;
                feedback.push(`Moderate Graveyard Index (${graveyardIndex}%): You have some stale repositories. Keep them fresh or clean them up.`);
            } else {
                feedback.push("✓ Active portfolio: Most of your repositories are updated recently.");
            }

            if (totalRepos < 5) {
                score -= 10;
                feedback.push("Low repository count: Build and share more public projects to demonstrate versatility.");
            }

            const averageStars = starCount / totalRepos;
            if (averageStars < 0.5) {
                score -= 5;
                feedback.push("Low repository engagement: Pin your best projects and write clear READMEs to invite stars and forks.");
            }

            score = Math.max(10, Math.min(100, score));

            return {
                success: true,
                score,
                profileReadmeExists,
                graveyardIndex,
                pinnedReposCount: Math.min(6, repos.filter(r => !r.fork).length),
                feedback
            };

        } catch (err: any) {
            console.error("Profile audit error:", err);
            return reply.status(500).send({ message: "Failed to perform profile audit: " + err.message });
        }
    });

    // 4. POST /api/academy/submit-pr (Authenticated)
    instance.post('/api/academy/submit-pr', async (req, reply) => {
        const session = await getSessionFromRequest(req);
        if (!session) return reply.status(401).send({ message: "Unauthorized" });

        const userId = session.session.userId;
        const { prUrl } = req.body as { prUrl: string };

        if (!prUrl) {
            return reply.status(400).send({ message: "PR URL is required" });
        }

        const prRegex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;
        const match = prUrl.match(prRegex);

        if (!match) {
            return reply.status(400).send({ message: "Invalid PR URL. Format: https://github.com/owner/repo/pull/number" });
        }

        const [_, repoOwner, repoName, prNumberStr] = match;
        const prNumber = parseInt(prNumberStr, 10);

        const account = await db.select().from(schema.accounts)
            .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.providerId, 'github')))
            .limit(1);

        if (!account.length || !account[0].accessToken) {
            return reply.status(400).send({ message: "Please connect your GitHub account in profile/settings first." });
        }

        const token = account[0].accessToken;

        try {
            let githubUsername = '';
            const ghUserRes = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "User-Agent": "Evergreeners-App"
                }
            });
            if (ghUserRes.ok) {
                const ghData = await ghUserRes.json();
                githubUsername = ghData.login;
            }

            if (!githubUsername) {
                return reply.status(400).send({ message: "Could not retrieve your GitHub username." });
            }

            const octokit = new Octokit({ auth: token });
            const { data: prDetail } = await octokit.rest.pulls.get({
                owner: repoOwner,
                repo: repoName,
                pull_number: prNumber
            });

            if (!prDetail.merged) {
                return reply.status(400).send({ message: "Verification failed: The pull request is not merged yet." });
            }

            if (prDetail.user?.login.toLowerCase() !== githubUsername.toLowerCase()) {
                return reply.status(400).send({ message: `Verification failed: The pull request was created by @${prDetail.user?.login}, but you are connected as @${githubUsername}.` });
            }

            if (repoOwner.toLowerCase() === githubUsername.toLowerCase()) {
                return reply.status(400).send({
                    message: "Verification failed: The PR is to your own repository. The capstone requires a contribution to an external repository."
                });
            }

            const certId = randomUUID();

            await db.update(schema.users)
                .set({
                    academyStatus: 'graduated',
                    academyPrUrl: prUrl,
                    academyCertId: certId,
                    updatedAt: new Date()
                })
                .where(eq(schema.users.id, userId));

            // AI review of the merged PR (advisory — does not block graduation)
            let review: Awaited<ReturnType<typeof reviewPullRequest>> = null;
            try {
                review = await reviewPullRequest(prUrl, token, githubUsername);
                if (review) {
                    await db.insert(schema.academyReviews)
                        .values({
                            userId,
                            certId,
                            prUrl,
                            score: review.score,
                            summary: review.summary,
                            strengths: review.strengths,
                            improvements: review.improvements,
                        })
                        .onConflictDoNothing();
                }
            } catch (err) {
                console.error('PR auto-review failed:', err);
            }

            // Async graduation email (non-blocking)
            const ghEmail = await db.query.users.findFirst({
                where: eq(schema.users.id, userId),
                columns: { email: true, name: true, username: true },
            });
            if (ghEmail?.email) {
                sendAcademyGraduationEmail({
                    to: ghEmail.email,
                    name: ghEmail.name || 'there',
                    username: ghEmail.username || '',
                    certId,
                    prUrl,
                    reviewScore: review?.score ?? null,
                    verifyHref: `${process.env.APP_URL || 'https://evergreeners.dev'}/academy/verify/${certId}`,
                }).catch((err) => console.error('Academy graduation email failed:', err.message));
            }

            const badgeStats = {
                totalCommits: 0,
                lateNightCommits: 0,
                currentStreak: 0,
                longestStreak: 0,
                hadBrokenStreak: false,
                questsCompleted: 0,
                questsAccepted: 0,
                overachieverQuests: 0,
                goalsCompleted: 0,
                goalsCompletedEarly: 0,
                accountAgeDays: 0,
                totalActiveDays: 0,
                isFirstDay: false,
                isProfilePublic: true,
                isGithubConnected: true,
                hasBio: true,
                hasLocation: true,
                leaderboardRank: null,
                profileViews: 0,
                fullYearGreen: false,
                isNewYearsCommit: false,
                isLunchBreakCommit: false,
                isFourAmCommit: false,
                hasSpeedRunnerQuest: false,
                isCountryLeader: false,
                academyGraduated: true
            };
            const newBadges = await checkAndAwardBadges(userId, badgeStats);

            return {
                success: true,
                message: "Pull request verified successfully! You have graduated!",
                certId,
                newBadges,
                review
            };

        } catch (err: any) {
            console.error("PR Verification Error:", err);
            return reply.status(400).send({ message: "Verification failed: Could not fetch PR details. Ensure the URL is correct and public. Error: " + err.message });
        }
    });

    // 5. GET /api/academy/certificate/:certId (Public)
    instance.get('/api/academy/certificate/:certId', async (req, reply) => {
        const { certId } = req.params as { certId: string };

        try {
            const userRecord = await db.select({
                name: schema.users.name,
                username: schema.users.username,
                academyJoinedAt: schema.users.academyJoinedAt,
                academyPrUrl: schema.users.academyPrUrl,
                updatedAt: schema.users.updatedAt
            })
            .from(schema.users)
            .where(eq(schema.users.academyCertId, certId))
            .limit(1);

            if (!userRecord.length) {
                return reply.status(404).send({ message: "Certificate not found" });
            }

            return {
                success: true,
                certificate: {
                    certId,
                    name: userRecord[0].name,
                    username: userRecord[0].username,
                    prUrl: userRecord[0].academyPrUrl,
                    date: userRecord[0].updatedAt || userRecord[0].academyJoinedAt || new Date()
                }
            };
        } catch (err: any) {
            console.error("Get Certificate Error:", err);
            return reply.status(500).send({ message: "Failed to load certificate" });
        }
    });

    // 6. GET /api/academy/certificate/:certId/og-image (Public — SVG social preview)
    instance.get('/api/academy/certificate/:certId/og-image', async (req, reply) => {
        const { certId } = req.params as { certId: string };

        const userRecord = await db.select({
            name: schema.users.name,
            prUrl: schema.users.academyPrUrl,
            updatedAt: schema.users.updatedAt,
            academyJoinedAt: schema.users.academyJoinedAt,
        })
        .from(schema.users)
        .where(eq(schema.users.academyCertId, certId))
        .limit(1);

        if (!userRecord.length) {
            return reply.status(404).send({ message: "Certificate not found" });
        }

        const escapeXml = (s: string) => s
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

        const name = escapeXml(userRecord[0].name);
        const date = new Date(userRecord[0].updatedAt || userRecord[0].academyJoinedAt || new Date())
            .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        const shortId = escapeXml(certId.slice(0, 18) + '…');

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="55%" stop-color="#0a0f0c"/>
      <stop offset="100%" stop-color="#040c08"/>
    </linearGradient>
    <linearGradient id="brd" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="nm" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="28" y="28" width="1144" height="574" rx="24" fill="none" stroke="url(#brd)" stroke-width="4" opacity="0.85"/>
  <circle cx="600" cy="150" r="52" fill="#111827" stroke="#10b981" stroke-width="3"/>
  <path d="M 580,168 L 600,130 L 620,168 Z" fill="#10b981"/>
  <circle cx="600" cy="158" r="10" fill="#10b981"/>
  <text x="600" y="252" font-family="monospace" font-size="22" fill="#10b981" font-weight="bold" letter-spacing="10" text-anchor="middle">EVERGREENERS ACADEMY</text>
  <text x="600" y="300" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="900" fill="#ffffff" letter-spacing="3" text-anchor="middle">CERTIFICATE OF GRADUATION</text>
  <text x="600" y="360" font-family="Georgia, serif" font-size="22" fill="#9ca3af" font-style="italic" text-anchor="middle">This is to certify that</text>
  <text x="600" y="420" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" fill="url(#nm)" text-anchor="middle">${name}</text>
  <text x="600" y="475" font-family="Georgia, serif" font-size="19" fill="#9ca3af" text-anchor="middle">has completed the 4-week Git, GitHub &amp; Open Source program</text>
  <line x1="400" y1="515" x2="800" y2="515" stroke="#1f2937" stroke-width="2"/>
  <text x="105" y="560" font-family="monospace" font-size="15" fill="#4b5563">VERIFIED ID: ${shortId}</text>
  <text x="105" y="584" font-family="monospace" font-size="15" fill="#4b5563">DATE: ${escapeXml(date)}</text>
  <text x="1095" y="560" font-family="Georgia, serif, cursive" font-size="30" font-style="italic" fill="#10b981" text-anchor="end">Evergreener Lead</text>
  <text x="1095" y="588" font-family="Arial, sans-serif" font-size="13" fill="#4b5563" text-anchor="end">evergreeners.dev/verify</text>
</svg>`.trim();

        reply.header('Content-Type', 'image/svg+xml');
        reply.header('Cache-Control', 'public, max-age=86400');
        return reply.send(svg);
    });

    // 7. GET /api/academy/review/:certId (Public — AI PR review)
    instance.get('/api/academy/review/:certId', async (req, reply) => {
        const { certId } = req.params as { certId: string };

        const row = await db.select({
            score: schema.academyReviews.score,
            summary: schema.academyReviews.summary,
            strengths: schema.academyReviews.strengths,
            improvements: schema.academyReviews.improvements,
            prUrl: schema.academyReviews.prUrl,
            checkedAt: schema.academyReviews.checkedAt,
        })
        .from(schema.academyReviews)
        .where(eq(schema.academyReviews.certId, certId))
        .limit(1);

        if (!row.length) {
            return { success: true, review: null };
        }

        return {
            success: true,
            review: {
                score: row[0].score,
                summary: row[0].summary,
                strengths: row[0].strengths,
                improvements: row[0].improvements,
                prUrl: row[0].prUrl,
                checkedAt: row[0].checkedAt,
            }
        };
    });

    // 8. GET /api/academy/leaderboard (Public — cohort rankings)
    instance.get('/api/academy/leaderboard', async (_req, reply) => {
        try {
            const ACADEMY_TOTAL_LESSONS = 12;

            const students = await db.select({
                id: schema.users.id,
                name: schema.users.name,
                username: schema.users.username,
                image: schema.users.image,
                academyStatus: schema.users.academyStatus,
                academyJoinedAt: schema.users.academyJoinedAt,
            })
            .from(schema.users)
            .where(and(
                isNotNull(schema.users.academyStatus),
                ne(schema.users.academyStatus, 'none'),
                ne(schema.users.academyStatus, 'audit_completed')
            ))
            .limit(200);

            const progressRows = await db.select({
                userId: schema.lessonProgress.userId,
                count: sql<number>`count(*)::int`,
            }).from(schema.lessonProgress).groupBy(schema.lessonProgress.userId);
            const progressMap = new Map(progressRows.map((r) => [r.userId, r.count]));

            // Latest PR review score per student (reviews are one-per-cert, newest first)
            const reviewRows = await db.select({
                userId: schema.academyReviews.userId,
                score: schema.academyReviews.score,
            })
            .from(schema.academyReviews)
            .orderBy(desc(schema.academyReviews.checkedAt));
            const bestScore = new Map<string, number>();
            for (const r of reviewRows) {
                if (!bestScore.has(r.userId)) bestScore.set(r.userId, r.score);
            }

            const leaderboard = students
                .map((s) => ({
                    id: s.id,
                    name: s.name,
                    username: s.username,
                    image: s.image,
                    status: s.academyStatus,
                    lessonsCompleted: progressMap.get(s.id) || 0,
                    totalLessons: ACADEMY_TOTAL_LESSONS,
                    prScore: bestScore.get(s.id) ?? null,
                    joinedAt: s.academyJoinedAt,
                }))
                .sort(
                    (a, b) =>
                        b.lessonsCompleted - a.lessonsCompleted ||
                        (b.prScore ?? 0) - (a.prScore ?? 0) ||
                        +new Date(a.joinedAt || 0) - +new Date(b.joinedAt || 0)
                )
                .slice(0, 50)
                .map((r, i) => ({ rank: i + 1, ...r }));

            return { success: true, leaderboard };
        } catch (err) {
            console.error('Error fetching academy leaderboard:', err);
            return reply.status(500).send({ message: "Could not load the leaderboard." });
        }
    });

});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on port ${port}`);

        // Start Cron Jobs
        setupCronJobs();

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
