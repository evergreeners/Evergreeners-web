import './env.js';
import fastify from 'fastify';
import cors from '@fastify/cors';
// dotenv is loaded first via ./env.js
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';
// import oauthPlugin from '@fastify/oauth2';
import { Octokit } from 'octokit';

import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { eq, and } from 'drizzle-orm';

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

// Auth Routes
server.register(async (instance) => {
    // Prevent Fastify from parsing the body so better-auth can handle the raw stream
    instance.removeContentTypeParser('application/json');
    instance.addContentTypeParser('application/json', (req, payload, done) => {
        done(null);
    });

    // Imports removed (moved to top)

    instance.all('/api/auth/*', async (req, reply) => {
        const origin = req.headers.origin;
        // Check if allow origin logic needs to be repeated or if cors plugin handles it sufficient for preflights
        // better-auth needs CORS headers on its responses too

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

    // Custom route to force-sync GitHub data
    instance.post('/api/user/sync-github', async (req, reply) => {
        const session = await auth.api.getSession({
            headers: req.headers
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

            // 3. Update User Profile
            await db.update(schema.users)
                .set({
                    username: ghUser.login,   // Force update username
                    name: ghUser.name || ghUser.login,
                    image: ghUser.avatar_url,
                    bio: ghUser.bio,
                    location: ghUser.location,
                    website: ghUser.blog,
                    updatedAt: new Date()
                })
                .where(eq(schema.users.id, userId));

            return { success: true, username: ghUser.login };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: "Failed to sync with GitHub" });
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
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
