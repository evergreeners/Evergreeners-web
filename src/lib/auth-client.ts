import { createAuthClient } from "better-auth/react"

const getBaseURL = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.includes("localhost") || url.includes("127.0.0.1")) return `http://${url}`;
    return `https://${url}`;
};

export const authClient = createAuthClient({
    baseURL: getBaseURL(import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")) // the base url of your auth server
})

export const { signIn, signUp, useSession, signOut } = authClient;
