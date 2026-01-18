import fastify from 'fastify';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const server = fastify({
    logger: true,
    trustProxy: true
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
