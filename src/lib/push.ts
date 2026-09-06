import { getApiUrl } from "@/lib/api-config";

export function isPushSupported(): boolean {
    return typeof window !== "undefined"
        && "serviceWorker" in navigator
        && "PushManager" in window
        && "Notification" in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) return null;
    try {
        return await navigator.serviceWorker.register("/sw.js");
    } catch (err) {
        console.error("Service worker registration failed:", err);
        return null;
    }
}

async function getVapidPublicKey(): Promise<string | null> {
    try {
        const res = await fetch(getApiUrl("/api/push/vapid-public-key"), {
            credentials: "include",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.publicKey || null;
    } catch (err) {
        console.error("Failed to fetch VAPID public key:", err);
        return null;
    }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
    const reg = await registerServiceWorker();
    if (!reg) return null;
    try {
        return await reg.pushManager.getSubscription();
    } catch {
        return null;
    }
}

export async function enablePushNotifications(): Promise<boolean> {
    if (!isPushSupported()) return false;

    const reg = await registerServiceWorker();
    if (!reg) return false;

    try {
        // Already subscribed?
        const existing = await reg.pushManager.getSubscription();
        if (existing) return true;

        // Ask for permission only when needed
        if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return false;
        } else if (Notification.permission !== "granted") {
            return false;
        }

        const publicKey = await getVapidPublicKey();
        if (!publicKey) return false;

        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await sendSubscriptionToServer(subscription);
        return true;
    } catch (err) {
        console.error("Push subscription failed:", err);
        return false;
    }
}

export async function disablePushNotifications(): Promise<void> {
    if (!isPushSupported()) return;

    const reg = await registerServiceWorker();
    const subscription = reg ? await reg.pushManager.getSubscription() : null;

    if (subscription) {
        try {
            await fetch(getApiUrl("/api/push/unsubscribe"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ endpoint: subscription.endpoint }),
            });
        } catch (err) {
            console.error("Failed to notify server about unsubscription:", err);
        }
        await subscription.unsubscribe();
    } else {
        try {
            await fetch(getApiUrl("/api/push/unsubscribe"), {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error("Failed to clear server subscriptions:", err);
        }
    }
}

export async function sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
        const res = await fetch(getApiUrl("/api/push/subscribe"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(subscription.toJSON()),
        });
        return res.ok;
    } catch (err) {
        console.error("Failed to save push subscription:", err);
        return false;
    }
}

/**
 * Ensure a subscription exists if the user already granted permission
 * (heals devices that were never subscribed or lost their subscription).
 */
export async function ensurePushSubscription(): Promise<boolean> {
    if (!isPushSupported()) return false;
    if (Notification.permission !== "granted") return false;

    const existing = await getCurrentSubscription();
    if (existing) return true;

    return enablePushNotifications();
}