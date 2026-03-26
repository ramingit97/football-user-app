// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing the public config keys.
const firebaseConfig = {
  apiKey: "AIzaSyCl4r2-pjsHxUb65aqPkRJwSBH9oO3UGgE",
  authDomain: "footballbaku1.firebaseapp.com",
  projectId: "footballbaku1",
  storageBucket: "footballbaku1.firebasestorage.app",
  messagingSenderId: "559743086780",
  appId: "1:559743086780:web:c0edbc6ad6f7f0f643a0b9",
  measurementId: "G-J3NDEKSJMK"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'Уведомление';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: payload.data || {},
    };

    // Must RETURN the promise — otherwise the SW may terminate before the notification is shown
    return self.registration.showNotification(notificationTitle, notificationOptions);
});
