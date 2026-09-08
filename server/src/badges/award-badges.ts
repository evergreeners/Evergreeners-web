// ─── Award Engine ─────────────────────────────────────────────────────────────
// Checks every badge definition against a user's current stats,
// bulk-inserts newly qualified badges, and returns the newly awarded ones
// so the API can forward them to the frontend for toast notifications.

import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { BADGES, type BadgeDefinition, type UserStats } from './badge-definitions.js';
import { sendBadgeAwardedEmail } from '../lib/email.js';
import { createNotification } from '../lib/notifications.js';

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

    // Fetch academy status to verify graduation badge
    const userRow = await db
        .select({ academyStatus: schema.users.academyStatus })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);
    stats.academyGraduated = userRow[0]?.academyStatus === 'graduated';

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

    // 4. Send email + in-app/push notifications (Async, non-blocking)
    (async () => {
        try {
            // Get user email and notification preference
            const user = await db.query.users.findFirst({
                where: eq(schema.users.id, userId),
                columns: {
                    email: true,
                    name: true,
                    emailNotifications: true,
                }
            });

            for (const badge of newlyQualified) {
                await createNotification(userId, {
                    type: 'badge',
                    title: `New badge: ${badge.name} 🏆`,
                    message: badge.description,
                    link: '/profile',
                });
            }

            if (user?.email && user.emailNotifications) {
                for (const badge of newlyQualified) {
                    await sendBadgeAwardedEmail({
                        to: user.email,
                        name: user.name,
                        badgeName: badge.name,
                        badgeDescription: badge.description,
                        badgeRarity: badge.rarity,
                    });
                }
            }
        } catch (err) {
            console.error('Error sending badge award notifications:', err);
        }
    })();

    return newlyQualified;
}
