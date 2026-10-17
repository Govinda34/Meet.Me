const CACHE_NAME = "achait-app-v2"; // जब भी कोई नया बदलाव करें, तो v2 को बदलकर v3, v4 कर दें

const APP_FILES = [
    "./",
    "./index.html",
    "./GtoA.html",
    "./AtoG.html",
    "./G_manifest.json",
    "./A_manifest.json",
    "./config.js",
    "./Kiconn-192.png",
    "./Riconn-192.png"
];

// 1. Install Event: फाइलों को कैश करना और तुरंत एक्टिव करना
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

// 2. Activate Event: पुराना कैश तुरंत डिलीट करना
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event: नेटवर्क-फर्स्ट स्ट्रेटजी (Firebase डेटा को ब्लॉक किए बिना)
self.addEventListener('fetch', event => {
    if (event.request.method !== "GET") {
        return;
    }

    // Firebase और Google APIs के लाइव डेटा को कैश न करें
    const reqUrl = event.request.url;
    if (reqUrl.includes("firebaseio.com") || reqUrl.includes("googleapis.com") || reqUrl.includes("gstatic.com")) {
        return;
    }

    // HTML पेजेस के लिए नेटवर्क-फर्स्ट (ताकि नया अपडेट तुरंत दिखे)
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

    // बाकी इमेज और स्टैटिक फाइलों के लिए कैश-फर्स्ट
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

// 4. Push Event: बैकग्राउंड पुश नोटिफिकेशन हैंडलर
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
        icon: "./Kiconn-192.png",
        badge: "./Kiconn-192.png",
        vibrate: [200, 100, 200],
        tag: "chat-msg",
        renotify: true,
        data: {
            url: data.data?.url || data.url || "./GtoA.html"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 5. Notification Click Event: नोटिफिकेशन पर क्लिक करने पर चैट पेज खोलना
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || "./GtoA.html";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.includes(targetUrl.replace('./', '')) && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
