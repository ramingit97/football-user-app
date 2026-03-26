// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCl4r2-pjsHxUb65aqPkRJwSBH9oO3UGgE",
    authDomain: "footballbaku1.firebaseapp.com",
    projectId: "footballbaku1",
    storageBucket: "footballbaku1.firebasestorage.app",
    messagingSenderId: "559743086780",
    appId: "1:559743086780:web:c0edbc6ad6f7f0f643a0b9",
    measurementId: "G-J3NDEKSJMK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { app };

// Messaging работает только на HTTPS с Service Worker
let messaging = null;
try {
    messaging = getMessaging(app);
} catch (e) {
    console.warn('Firebase Messaging not supported in this environment');
}
export { messaging };

export const requestForToken = async () => {
    if (!messaging) return null;
    try {
        const currentToken = await getToken(messaging, { vapidKey: 'BC16ZZ7Y8KUrRKP9KHsvMMALrFpAmB6yUxLvEHxHB5bsJExprKYaH8RWHo63lm_8uLMGsPcAv0_rFzsdlh4lwEg' });
        if (currentToken) {
            return currentToken;
        }
        return null;
    } catch (err) {
        console.warn('FCM token error:', err);
        return null;
    }
};

export const onMessageListener = (callback) => {
    if (!messaging) return () => {};
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};
