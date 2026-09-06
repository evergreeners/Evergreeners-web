/* Evergreeners push notification service worker */
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'Evergreeners', body: event.data.text() };
    }

    const options = {
        body: payload.body || '',
        icon: payload.icon || '/icon.png',
        badge: payload.badge || '/icon.png',
        data: {
            url: payload.url || '/dashboard',
        },
    };

    event.waitUntil(
        self.registration.showNotification(payload.title || 'Evergreeners', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = (event.notification.data && event.notification.data.url) || '/dashboard';

    event.waitUntil(
        (async () => {
            const windowClients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });

            for (const client of windowClients) {
                if ('focus' in client) {
                    try {
                        await client.navigate(url);
                    } catch {
                        /* ignore navigation failures */
                    }
                    return client.focus();
                }
            }

            return self.clients.openWindow(url);
        })()
    );
});

/* Keep the service worker alive during its own updates */
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});