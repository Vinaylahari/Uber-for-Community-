/* Auto-generated — run: npm run generate:sw */
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  "apiKey": "AIzaSyCL5BFnsOWhWsA15onoM91BlIkz7zWJVFg",
  "authDomain": "uber-for-community---sahayam.firebaseapp.com",
  "projectId": "uber-for-community---sahayam",
  "storageBucket": "uber-for-community---sahayam.firebasestorage.app",
  "messagingSenderId": "1043492315444",
  "appId": "1:1043492315444:web:71bead9cd3262ae02ec561"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Sahayam';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.svg',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
