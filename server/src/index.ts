import './env.js'; // Trigger restart
import fastify, { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
// dotenv is loaded first via ./env.js
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { eq, and, desc, gt } from 'drizzle-orm';
import { getGithubContributions, checkQuestProgress } from './lib/github.js';
import { setupCronJobs } from './cron.js';
import { updateUserGoals } from './lib/goals.js';

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

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:8080",
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
];

server.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
});

// GitHub OAuth is handled by better-auth in separate adapter

// Auth Routes Scope (No Body Parsing for better-auth)
// Auth Routes Scope (No Body Parsing for better-auth)
server.register(async (instance) => {
    // Prevent Fastify from parsing the body so better-auth can handle the raw stream
    instance.removeContentTypeParser('application/json');
    instance.addContentTypeParser('application/json', (req, payload, done) => {
        done(null);
    });

    instance.all('/api/auth/*', async (req, reply) => {
        const origin = req.headers.origin;
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:8080",
            ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
        ];

        if (origin && allowedOrigins.includes(origin)) {
            reply.raw.setHeader("Access-Control-Allow-Origin", origin);
            reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
        }

        reply.raw.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        reply.raw.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

        return toNodeHandler(auth)(req.raw, reply.raw);
    });
});

// API Routes Scope (Standard JSON Parsing)
server.register(async (instance) => {
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
                throw new Error("Failed to fetch from GitHub");
            }
            const ghUser = await ghRes.json();
            console.log("GitHub user found:", ghUser.login);

            // 3. Fetch Contributions (Streak & Total Commits)
            const { totalCommits, currentStreak, todayCommits, yesterdayCommits, weeklyCommits, activeDays, totalProjects, projects, contributionCalendar, totalPullRequests, languages } = await getGithubContributions(ghUser.login, account[0].accessToken);

            // 4. Update User Profile
            console.log("Updating DB with streak:", currentStreak, "commits:", totalCommits);
            await db.update(schema.users)
                .set({
                    // Only update stats, preserve user's custom profile data
                    streak: currentStreak,
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
                bestRank
            };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: "Failed to sync with GitHub" });
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

        return { user: user[0] };
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
                .where(gt(schema.users.streak, 0))
                .orderBy(desc(schema.users.streak))
                .limit(50);

            console.log(`Fetching leaderboard. Found ${topUsers.length} users with streak > 0`);

            // Update best ranks asynchronously (don't block the response)
            (async () => {
                for (let i = 0; i < topUsers.length; i++) {
                    const user = topUsers[i];
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
                    isTaken: !!activeAssignment && activeAssignment.userId !== userId, // Taken by someone else
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
                return reply.status(400).send({ message: "This quest is already taken by another adventurer." });
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
                createdBy: userId,
            }).returning();

            return { quest: newQuest[0] };
        } catch (error) {
            console.error("Create quest error:", error);
            return reply.status(500).send({ message: "Failed to create quest" });
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
});

server.get('/', async (request, reply) => {
    return { hello: 'world' };
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
