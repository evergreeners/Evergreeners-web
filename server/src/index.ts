import fastify from 'fastify';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

import { db } from "./db/index.js";
import { users, accounts } from "./db/schema.js";
import { eq, and } from "drizzle-orm";

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
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:8080",
            ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
        ];

        console.log('Incoming Origin:', origin);
        if (origin && allowedOrigins.includes(origin)) {
            reply.raw.setHeader("Access-Control-Allow-Origin", origin);
            reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
        }

        reply.raw.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        reply.raw.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

        return toNodeHandler(auth)(req.raw, reply.raw);
    });

});

server.put('/api/user/profile', async (req, reply) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as any
        });

        if (!session) {
            reply.code(401).send({ message: "Unauthorized" });
            return;
        }

        const body = req.body as any;
        if (!body) {
            reply.code(400).send({ message: "Missing body" });
            return;
        }

        const { name, username, bio, location, website, isPublic, image } = body;

        // Check username uniqueness if changing
        if (username) {
            const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
            if (existing.length > 0 && existing[0].id !== session.user.id) {
                reply.code(409).send({ message: "Username already taken" });
                return;
            }
        }

        // Logic for Anonymous Name
        let anonymousName = (session.user as any).anonymousName;
        if (isPublic === false && !anonymousName) {
            const animals = ["Axolotl", "Bear", "Cat", "Dog", "Elephant", "Fox", "Giraffe", "Hedgehog", "Iguana", "Jaguar", "Koala", "Lion", "Monkey", "Narwhal", "Octopus", "Penguin", "Quokka", "Rabbit", "Squirrel", "Tiger", "Unicorn", "Wolf", "Zebra"];
            const adjectives = ["Anonymous", "Brave", "Calm", "Daring", "Eager", "Fantastic", "Gentle", "Happy", "Jolly", "Kind", "Lucky", "Mighty", "Neon", "Quiet", "Royal", "Super", "Tiny", "Violet", "Wild", "Yellow", "Zealous"];
            anonymousName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
        }

        await db.update(users).set({
            name,
            username,
            bio,
            location,
            website,
            isPublic,
            anonymousName,
            image,
            updatedAt: new Date()
        }).where(eq(users.id, session.user.id));

        return { success: true, anonymousName };
    } catch (error: any) {
        console.error("Profile update error:", error);
        reply.code(500).send({ message: "Internal server error", error: error.message });
    }
});

server.get('/api/user/profile', async (req, reply) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers as any
        });

        if (!session) {
            reply.code(401).send({ message: "Unauthorized" });
            return;
        }

        const linkedAccounts = await db.select().from(accounts).where(and(
            eq(accounts.userId, session.user.id),
            eq(accounts.providerId, "github")
        ));

        const isGithubConnected = linkedAccounts.length > 0;

        return {
            user: session.user,
            isGithubConnected
        };
    } catch (error: any) {
        console.error("Profile fetch error:", error);
        reply.code(500).send({ message: "Internal server error", error: error.message });
    }
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
