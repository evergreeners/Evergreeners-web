import webpush from 'web-push';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const APP_URL = process.env.APP_URL || 'https://evergreeners.dev';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:noreply@evergreeners.dev';

const isVapidConfigured = () => !!vapidPublicKey && !!vapidPrivateKey;

export function getVapidPublicKey(): string | null {
    return vapidPublicKey || null;
}

export interface NotificationInput {
    type: string;   // 'goal' | 'quest' | 'badge' | 'streak' | 'leaderboard'
    title: string;
    message: string;
    link?: string;
}

function buildAbsoluteLink(link?: string): string {
    if (!link) return `${APP_URL}/dashboard`;
    return new URL(link, APP_URL).href;
}

/**
 * Create an in-app notification for a user and fan out a Web Push
 * to every device subscription the user has enabled. Never throws.
 */
export async function createNotification(userId: string, input: NotificationInput): Promise<void> {
    try {
        await db.insert(schema.notifications).values({
            userId,
            type: input.type,
            title: input.title,
            message: input.message,
            link: input.link || null,
        });
    } catch (err) {
        console.error('Failed to insert notification:', err);
    }

    if (isVapidConfigured()) {
        pushToUser(userId, input).catch((err) => console.error('Web push failed:', err));
    }
}

/**
 * Variant of createNotification that skips when a notification with the
 * exact same title already exists (used for recurring milestones/broken
 * streak events so we don't spam).
 */
export async function createNotificationIfMissing(userId: string, input: NotificationInput): Promise<void> {
    try {
        const exists = await db
            .select({ id: schema.notifications.id })
            .from(schema.notifications)
            .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.title, input.title)))
            .limit(1);
        if (exists.length) return;
    } catch (err) {
        console.error('Failed to check existing notification:', err);
        return;
    }

    await createNotification(userId, input);
}

async function pushToUser(userId: string, input: NotificationInput): Promise<void> {
    const subs = await db
        .select()
        .from(schema.pushSubscriptions)
        .where(eq(schema.pushSubscriptions.userId, userId));

    if (!subs.length) return;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
        title: input.title,
        body: input.message,
        icon: `${APP_URL}/icon.png`,
        badge: `${APP_URL}/icon.png`,
        url: buildAbsoluteLink(input.link),
    });

    await Promise.allSettled(subs.map(async (sub) => {
        try {
            await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload,
                { TTL: 86400 },
            );
        } catch (err) {
            const statusCode = (err as { statusCode?: number } | null)?.statusCode;
            if (statusCode === 404 || statusCode === 410) {
                // Subscription is no longer valid — drop it
                try {
                    await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, sub.endpoint));
                } catch (cleanupErr) {
                    console.error('Failed to remove stale push subscription:', cleanupErr);
                }
            }
        }
    }));
}