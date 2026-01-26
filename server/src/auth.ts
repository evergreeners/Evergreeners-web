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

const finalBaseURL = getBaseURL(process.env.BETTER_AUTH_URL);
console.log("Better Auth Base URL:", finalBaseURL); // Debugging line

export const auth = betterAuth({
    baseURL: finalBaseURL,
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
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
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
            anonymousName: { type: "string" },
            streak: { type: "number" },
            totalCommits: { type: "number" },
            todayCommits: { type: "number" }, // Field for daily stats
            isGithubConnected: { type: "boolean" },
            bestRank: { type: "number" }
        }
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            mapProfileToUser: (profile) => {
                // This only runs for NEW user signups - existing users are not affected
                // Users can manually update their profile anytime via Settings
                return {
                    name: profile.name || profile.login, // Full name, fallback to username
                    username: profile.login,             // GitHub username
                    image: profile.avatar_url,           // Profile picture
                    bio: profile.bio || null,            // GitHub bio
                    location: profile.location || null,  // Location
                    website: profile.blog || null,       // Website/blog URL
                    isGithubConnected: true
                }
            }
        }
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true
        }
    }
});
