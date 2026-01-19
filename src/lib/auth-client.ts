import { API_BASE_URL } from "./api-config";
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: API_BASE_URL // the base url of your auth server
})

export const { signIn, signUp, useSession, signOut } = authClient;
