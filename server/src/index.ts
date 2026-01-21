import './env.js'; // Trigger restart
import fastify from 'fastify';
import cors from '@fastify/cors';
// dotenv is loaded first via ./env.js
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { eq, and, desc, gt } from 'drizzle-orm';
import { getGithubContributions } from './lib/github.js';
import { setupCronJobs } from './cron.js';

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
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (typeof value === 'string') {
                headers.set(key, value);
            }
        });

        const session = await auth.api.getSession({
            headers
        });

        if (!session) {
            return reply.status(401).send({ message: "Unauthorized" });
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
            // 2. Fetch GitHub Profile
            const ghRes = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${account[0].accessToken}`,
                    "User-Agent": "Evergreeners-App"
                }
            });

            if (!ghRes.ok) throw new Error("Failed to fetch from GitHub");
            const ghUser = await ghRes.json();

            // 3. Fetch Contributions (Streak & Total Commits)
            const { totalCommits, currentStreak, todayCommits, yesterdayCommits, weeklyCommits, contributionCalendar } = await getGithubContributions(ghUser.login, account[0].accessToken);

            // 4. Update User Profile
            await db.update(schema.users)
                .set({
                    // Only update stats, preserve user's custom profile data
                    streak: currentStreak,
                    totalCommits: totalCommits,
                    todayCommits: todayCommits,
                    yesterdayCommits: yesterdayCommits,
                    weeklyCommits: weeklyCommits,
                    contributionData: contributionCalendar,
                    isGithubConnected: true,
                    updatedAt: new Date()
                })
                .where(eq(schema.users.id, userId));

            // 5. Update User Goals based on new stats
            const userGoals = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));
            const goalsToUpdate = [];

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
                    await db.update(schema.goals)
                        .set({ current: newCurrent, completed: newCompleted, updatedAt: new Date() })
                        .where(eq(schema.goals.id, goal.id));
                }
            }

            return { success: true, username: ghUser.login, streak: currentStreak, totalCommits, todayCommits, yesterdayCommits, weeklyCommits, contributionData: contributionCalendar };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: "Failed to sync with GitHub" });
        }
    });

    // Update User Profile Route
    instance.put('/api/user/profile', async (req, reply: any) => {
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (typeof value === 'string') {
                headers.set(key, value);
            }
        });

        const session = await auth.api.getSession({
            headers
        });

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
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (typeof value === 'string') {
                headers.set(key, value);
            }
        });

        const session = await auth.api.getSession({
            headers
        });

        if (!session) {
            return reply.status(401).send({ message: "Unauthorized" });
        }

        const userId = session.session.userId;
        const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

        if (!user.length) return reply.status(404).send({ message: "User not found" });

        return { user: user[0] };
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
            })
                .from(schema.users)
                .where(gt(schema.users.streak, 0))
                .orderBy(desc(schema.users.streak))
                .limit(50);

            console.log(`Fetching leaderboard. Found ${topUsers.length} users with streak > 0`);


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
    // Goals Endpoints
    // GET /api/goals
    instance.get('/api/goals', async (req, reply) => {
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (typeof value === 'string') {
                headers.set(key, value);
            }
        });

        const session = await auth.api.getSession({ headers });
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
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (typeof value === 'string') {
                headers.set(key, value);
            }
        });

        const session = await auth.api.getSession({ headers });
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
                } else if (body.type === 'commits' && body.title.toLowerCase().includes('weekly')) {
                    current = user[0].weeklyCommits || 0;
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
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (typeof value === 'string') {
                headers.set(key, value);
            }
        });

        const session = await auth.api.getSession({ headers });
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
        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => headers.append(key, v));
            } else if (typeof value === 'string') {
                headers.set(key, value);
            }
        });

        const session = await auth.api.getSession({ headers });
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
