import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js"; // Drizzle instance
import * as schema from "./db/schema.js"; // Schema definition

const getBaseURL = (url: string | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.includes("localhost") || url.includes("127.0.0.1")) return `http://${url}`;
    return `https://${url}`;
};

export const auth = betterAuth({
    baseURL: getBaseURL(process.env.BETTER_AUTH_URL),
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            ...schema,
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:8080",
        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [])
    ],
    // Add other plugins or providers here (e.g., GitHub)
    user: {
        additionalFields: {
            username: { type: "string" },
            bio: { type: "string" },
            location: { type: "string" },
            website: { type: "string" },
            isPublic: { type: "boolean" },
            anonymousName: { type: "string" }
        }
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true
        }
    }
});
