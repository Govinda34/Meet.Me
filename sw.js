const CACHE_NAME = "achait-app-v1"; // 👈 [महत्वपूर्ण] जब भी आप कोई नया बदलाव करें, तो v1 को बदलकर v2, v3 कर दें

const APP_FILES = [
    "/Meet.Me/",
    "/Meet.Me/GtoA.html",
    "/Meet.Me/AtoG.html",
    "/Meet.Me/G_manifest.json",
    "/Meet.Me/A_manifest.json"
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

// पुराना कैश तुरंत डिलीट करने का लॉजिक
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => clients.claim())
    );
});

// नेटवर्क-फर्स्ट स्ट्रेटजी (ताकि अपडेटेड पेज तुरंत दिखाई दे)
self.addEventListener('fetch', event => {
    if (event.request.method !== "GET") {
        return;
    }

    if (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html")) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
    );
});

// पुश नोटिफिकेशन हैंडलर
self.addEventListener('push', event => {
    let data = {};

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (error) {
        data = {
            title: "नया संदेश",
            body: event.data ? event.data.text() : "आपके लिए नया संदेश आया है"
        };
    }

    const title = data.notification?.title || data.title || "नया संदेश";

    const options = {
        body: data.notification?.body || data.body || "संदेश देखने के लिए क्लिक करें",
        icon: "/Meet.Me/Kiconn-192.png",
        badge: "/Meet.Me/Kiconn-192.png",
        data: {
            url: data.data?.url || data.url || "/Meet.Me/GtoA.html"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    const url = event.notification.data.url || "/Meet.Me/GtoA.html";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(windowClients => {
            for (const client of windowClients) {
                if ("focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
