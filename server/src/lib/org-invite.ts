import { Octokit } from "octokit";

export type MembershipStatus = "active" | "pending" | "none" | "not_connected" | "not_configured" | "error";

export function getOrgAdminOctokit(): Octokit | null {
    const token = process.env.GITHUB_ORG_ADMIN_TOKEN;
    if (!token) return null;
    return new Octokit({ auth: token });
}

export function getCommunityOrg(): string {
    return process.env.GITHUB_COMMUNITY_ORG || "evergreeners";
}

// In-memory cache for status checks with 5-minute TTL to preserve GitHub API rate limits
interface CacheEntry {
    status: MembershipStatus;
    role?: string;
    timestamp: number;
}
const statusCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function clearMembershipCache(username?: string) {
    if (username) {
        statusCache.delete(username.toLowerCase());
    } else {
        statusCache.clear();
    }
}

/**
 * Check a user's membership status in the GitHub organization.
 * Returns 'active', 'pending', 'none', 'not_configured', or 'error'.
 */
export async function getOrgMembershipStatus(
    username: string,
    skipCache = false
): Promise<{
    status: MembershipStatus;
    role?: string;
    error?: string;
}> {
    const cleanUsername = username.trim().toLowerCase();
    const octokit = getOrgAdminOctokit();
    if (!octokit) {
        return { status: "not_configured" };
    }

    if (!skipCache) {
        const cached = statusCache.get(cleanUsername);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return { status: cached.status, role: cached.role };
        }
    }

    const org = getCommunityOrg();
    try {
        const res = await octokit.rest.orgs.getMembershipForUser({
            org,
            username: cleanUsername,
        });
        const state = res.data.state; // 'active' or 'pending'
        const status: MembershipStatus = state === "active" ? "active" : "pending";
        statusCache.set(cleanUsername, {
            status,
            role: res.data.role,
            timestamp: Date.now(),
        });
        return { status, role: res.data.role };
    } catch (err: any) {
        if (err.status === 404) {
            statusCache.set(cleanUsername, {
                status: "none",
                timestamp: Date.now(),
            });
            return { status: "none" };
        }
        console.error(`[Org Invite] Error checking membership for ${cleanUsername}:`, err.message);
        return { status: "error", error: err.message };
    }
}

/**
 * Invite a user to the GitHub organization with base 'member' role.
 */
export async function inviteUserToOrg(username: string): Promise<{
    success: boolean;
    status: "invited" | "already_member" | "not_configured" | "failed";
    message?: string;
}> {
    const cleanUsername = username.trim().toLowerCase();
    const octokit = getOrgAdminOctokit();
    if (!octokit) {
        console.warn("[Org Invite] GITHUB_ORG_ADMIN_TOKEN not set, skipping invite.");
        return { success: false, status: "not_configured", message: "GITHUB_ORG_ADMIN_TOKEN not configured" };
    }

    const org = getCommunityOrg();
    try {
        await octokit.rest.orgs.setMembershipForUser({
            org,
            username: cleanUsername,
            role: "member",
        });
        // Update cache to pending
        statusCache.set(cleanUsername, {
            status: "pending",
            role: "member",
            timestamp: Date.now(),
        });
        console.log(`[Org Invite] Sent invitation to @${cleanUsername} for @${org}`);
        return { success: true, status: "invited" };
    } catch (err: any) {
        if (err.status === 422) {
            console.log(`[Org Invite] User @${cleanUsername} is already a member or pending invitation in @${org}.`);
            return { success: true, status: "already_member" };
        }
        console.error(`[Org Invite] Failed to invite @${cleanUsername} to @${org}:`, err.message);
        return { success: false, status: "failed", message: err.message };
    }
}

/**
 * Ensures a user is either active or invited.
 * If user has no membership/invitation, triggers an invitation automatically.
 */
export async function ensureOrgMembership(username: string): Promise<{
    status: MembershipStatus;
    invited?: boolean;
}> {
    const current = await getOrgMembershipStatus(username);
    if (current.status === "active") {
        return { status: "active" };
    }
    if (current.status === "pending") {
        return { status: "pending" };
    }
    if (current.status === "none") {
        const inviteRes = await inviteUserToOrg(username);
        if (inviteRes.success) {
            return { status: "pending", invited: true };
        }
    }
    return { status: current.status };
}

/**
 * Invites all existing users in the database who have connected GitHub or a GitHub username.
 */
export async function inviteAllExistingUsers(): Promise<{
    totalChecked: number;
    invited: number;
    alreadyMembers: number;
    failed: number;
    skipped: number;
    details: Array<{ username: string; result: string }>;
}> {
    const octokit = getOrgAdminOctokit();
    if (!octokit) {
        throw new Error("GITHUB_ORG_ADMIN_TOKEN is not configured on server");
    }

    const { db } = await import("../db/index.js");
    const schema = await import("../db/schema.js");

    const allUsers = await db.select({
        id: schema.users.id,
        username: schema.users.username,
        isGithubConnected: schema.users.isGithubConnected,
    }).from(schema.users);

    const eligible = allUsers.filter(u => !!u.username);

    let invited = 0;
    let alreadyMembers = 0;
    let failed = 0;
    const details: Array<{ username: string; result: string }> = [];

    for (const u of eligible) {
        const username = u.username!;
        try {
            const statusRes = await getOrgMembershipStatus(username, true);
            if (statusRes.status === "active" || statusRes.status === "pending") {
                alreadyMembers++;
                details.push({ username, result: statusRes.status });
                continue;
            }

            const inviteRes = await inviteUserToOrg(username);
            if (inviteRes.success) {
                if (inviteRes.status === "invited") {
                    invited++;
                    details.push({ username, result: "invited" });
                } else {
                    alreadyMembers++;
                    details.push({ username, result: "already_member" });
                }
            } else {
                failed++;
                details.push({ username, result: `failed: ${inviteRes.message}` });
            }

            // 150ms throttle delay to avoid GitHub secondary rate limits
            await new Promise(r => setTimeout(r, 150));
        } catch (e: any) {
            failed++;
            details.push({ username, result: `error: ${e.message}` });
        }
    }

    return {
        totalChecked: eligible.length,
        invited,
        alreadyMembers,
        failed,
        skipped: allUsers.length - eligible.length,
        details,
    };
}

/**
 * Checks if a user is a PUBLIC member of the GitHub organization.
 * Returns true if public (204 No Content), false if private or not a member (404).
 */
export async function checkIsPublicMember(username: string): Promise<boolean> {
    const cleanUsername = username.trim().toLowerCase();
    const org = getCommunityOrg();
    const octokit = getOrgAdminOctokit();
    if (octokit) {
        try {
            const res = await octokit.rest.orgs.checkPublicMembershipForUser({
                org,
                username: cleanUsername,
            });
            return res.status === 204;
        } catch (err: any) {
            if (err.status === 404) return false;
            console.warn(`[Org Invite] Octokit checkPublicMembershipForUser check for ${cleanUsername}:`, err.message);
        }
    }

    try {
        const headers: Record<string, string> = {
            "User-Agent": "Evergreeners-App",
            "Accept": "application/vnd.github+json",
        };
        const token = process.env.GITHUB_ORG_ADMIN_TOKEN;
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`https://api.github.com/orgs/${org}/public_members/${cleanUsername}`, {
            headers,
        });
        return res.status === 204;
    } catch (err: any) {
        console.error(`[Org Invite] Error checking public membership for ${cleanUsername}:`, err.message);
        return false;
    }
}

/**
 * Attempts to make the user's membership public on GitHub using their personal OAuth accessToken.
 * Only the authenticated user can publicize their own membership.
 */
export async function publicizeMembership(
    username: string,
    userAccessToken: string
): Promise<{ success: boolean; message?: string }> {
    const cleanUsername = username.trim().toLowerCase();
    const org = getCommunityOrg();
    try {
        const res = await fetch(`https://api.github.com/orgs/${org}/public_members/${cleanUsername}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${userAccessToken}`,
                "User-Agent": "Evergreeners-App",
                Accept: "application/vnd.github+json",
                "Content-Length": "0",
            },
        });
        if (res.status === 204) {
            console.log(`[Org Invite] Successfully publicized membership for @${cleanUsername} in @${org}`);
            return { success: true };
        }
        const text = await res.text();
        return { success: false, message: `GitHub API returned ${res.status}: ${text}` };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

/**
 * Attempts to automatically accept the organization invitation using the user's OAuth accessToken.
 * Requires user-level authorization (write:org).
 */
export async function attemptAutoAccept(
    userAccessToken: string
): Promise<{ success: boolean; message?: string }> {
    const org = getCommunityOrg();
    try {
        const res = await fetch(`https://api.github.com/user/memberships/orgs/${org}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${userAccessToken}`,
                "User-Agent": "Evergreeners-App",
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ state: "active" }),
        });
        if (res.status === 200) {
            console.log(`[Org Invite] Auto-accepted invitation for @${org}`);
            return { success: true };
        }
        return { success: false, message: `Status ${res.status}` };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

/**
 * Ensures the GitHub organization webhook is registered for real-time membership events.
 */
export async function ensureOrgWebhook(webhookUrl?: string): Promise<{
    success: boolean;
    webhookId?: number;
    created?: boolean;
    message?: string;
}> {
    const octokit = getOrgAdminOctokit();
    if (!octokit) {
        return { success: false, message: "GITHUB_ORG_ADMIN_TOKEN not configured" };
    }

    const org = getCommunityOrg();
    const targetUrl = webhookUrl || (process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/github` : "https://www.evergreeners.dev/api/webhooks/github");

    try {
        const existing = await octokit.rest.orgs.listWebhooks({ org });
        const found = existing.data.find(h => h.config.url === targetUrl);

        if (found) {
            return { success: true, webhookId: found.id, created: false, message: "Webhook already exists" };
        }

        const res = await octokit.rest.orgs.createWebhook({
            org,
            name: "web",
            active: true,
            events: ["organization", "membership"],
            config: {
                url: targetUrl,
                content_type: "json",
            },
        });

        console.log(`[Org Webhook] Created webhook ${res.data.id} for @${org} pointing to ${targetUrl}`);
        return { success: true, webhookId: res.data.id, created: true };
    } catch (err: any) {
        console.error(`[Org Webhook] Failed to ensure webhook for @${org}:`, err.message);
        return { success: false, message: err.message };
    }
}
