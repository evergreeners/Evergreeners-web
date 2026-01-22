import { API_BASE_URL } from "./api-config";
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
<<<<<<< HEAD
    baseURL: API_BASE_URL // the base url of your auth server
=======
    baseURL: getBaseURL(import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")) // the base url of your auth server
>>>>>>> 9b9ba8de551d35c0db828a478388ac455960594b
})

export const { signIn, signUp, useSession, signOut } = authClient;
