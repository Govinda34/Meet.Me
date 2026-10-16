// Firebase App और Messaging के CDN स्क्रिप्ट्स इम्पोर्ट करें
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Firebase इनिशियलाइज़ेशन (अपनी प्रोजेक्ट डिटेल्स यहाँ भरें)
firebase.initializeApp({
  apiKey: "AIzaSyBvtN9cxTACg0lbzdJu_5Vwb0r8gt89jF8",
  authDomain: "achait.firebaseapp.com",
  databaseURL: "https://achait-default-rtdb.firebaseio.com",
  projectId: "achait",
  storageBucket: "achait.firebasestorage.app",
  messagingSenderId: "970610938948",
  appId: "1:970610938948:web:521e3b5e5f71b54a245811",
  measurementId: "G-VK9KEESHRJ"
});

const messaging = firebase.messaging();

// जब ऐप बैकग्राउंड में हो और नया नोटिफिकेशन आए
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || "नया संदेश";
    const notificationOptions = {
        body: payload.notification?.body || "आपके लिए नया संदेश आया है",
        icon: "/Meet.Me/Kiconn-192.png",
        badge: "/Meet.Me/Kiconn-192.png",
        data: {
            url: payload.data?.url || "/Meet.Me/GtoA.html"
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// नोटिफिकेशन पर क्लिक करने पर सही पेज पर रीडायरेक्ट करना
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/Meet.Me/GtoA.html";

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
