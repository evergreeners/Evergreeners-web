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
