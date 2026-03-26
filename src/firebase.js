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
const messaging = getMessaging(app);
export const auth = getAuth(app);
export { app, messaging };

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, { vapidKey: 'BC16ZZ7Y8KUrRKP9KHsvMMALrFpAmB6yUxLvEHxHB5bsJExprKYaH8RWHo63lm_8uLMGsPcAv0_rFzsdlh4lwEg' });
        if (currentToken) {
            console.log('current token for client: ', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

// Persistent foreground message listener — calls callback on every message
export const onMessageListener = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground message:', payload);
        callback(payload);
    });
};
