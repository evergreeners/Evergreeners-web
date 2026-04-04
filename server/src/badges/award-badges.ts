// ─── Award Engine ─────────────────────────────────────────────────────────────
// Checks every badge definition against a user's current stats,
// bulk-inserts newly qualified badges, and returns the newly awarded ones
// so the API can forward them to the frontend for toast notifications.

import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { BADGES, type BadgeDefinition, type UserStats } from './badge-definitions.js';

export type { UserStats } from './badge-definitions.js';

/**
 * Check all badge definitions against the provided stats for a given user,
 * award badges the user qualifies for but hasn't earned yet, and return
 * the array of newly awarded badge definitions.
 *
 * Designed to be called after any action that might trigger a badge:
 * - GitHub sync
 * - Quest completion
 * - Goal completion
 */
export async function checkAndAwardBadges(
    userId: string,
    stats: UserStats,
): Promise<BadgeDefinition[]> {
    // 1. Fetch badges the user already has
    const existingRows = await db
        .select({ badgeId: schema.userBadges.badgeId })
        .from(schema.userBadges)
        .where(eq(schema.userBadges.userId, userId));

    const alreadyEarned = new Set(existingRows.map((r) => r.badgeId));

    // 2. Find badges the user now qualifies for but hasn't been awarded yet
    const newlyQualified = BADGES.filter(
        (badge) => !alreadyEarned.has(badge.id) && badge.check(stats),
    );

    if (newlyQualified.length === 0) {
        return [];
    }

    // 3. Bulk-insert, ignoring conflicts (race-condition safety)
    const now = new Date();
    await db
        .insert(schema.userBadges)
        .values(
            newlyQualified.map((badge) => ({
                userId,
                badgeId: badge.id,
                earnedAt: now,
            })),
        )
        .onConflictDoNothing();

    return newlyQualified;
}
