// Firebase App और Messaging के CDN स्क्रिप्ट्स इम्पोर्ट करें
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// config.js को इम्पोर्ट करें ताकि बार-बार कॉन्फ़िगरेशन न लिखना पड़े
importScripts('./config.js');

// Firebase इनिशियलाइज़ेशन (config.js के firebaseConfig का उपयोग)
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// जब ऐप बैकग्राउंड में हो और नया नोटिफिकेशन आए
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || "नया संदेश";
    const notificationOptions = {
        body: payload.notification?.body || "आपके लिए नया संदेश आया है",
        icon: "./Kiconn-192.png",
        badge: "./Kiconn-192.png",
        vibrate: [200, 100, 200],
        tag: "chat-msg",
        renotify: true,
        data: {
            url: payload.data?.url || "./GtoA.html"
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// नोटिफिकेशन पर क्लिक करने पर सही पेज पर रीडायरेक्ट करना या फोकस करना
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "./GtoA.html";

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes(targetUrl.replace('./', '')) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
