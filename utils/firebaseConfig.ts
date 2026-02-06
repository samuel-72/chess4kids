import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";

// Specific Firebase Project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBMNMEX-GOE7U1Kww9o5UMoOB-jOuMOcSs",
    authDomain: "chess4kids-c6c34.firebaseapp.com",
    projectId: "chess4kids-c6c34",
    storageBucket: "chess4kids-c6c34.firebasestorage.app",
    messagingSenderId: "691437033655",
    appId: "1:691437033655:web:e7a8df12e7e42c34769532",
    measurementId: "G-7BEFML8ZVV"
};

export const isConfigValid = () => {
    return firebaseConfig.apiKey !== "API_KEY_PLACEHOLDER";
};

// Initialize Firebase (singleton pattern)
let app;
let auth;

try {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
} catch (e) {
    console.warn("Firebase initialization failed. Auth will be mocked.", e);
}

export { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect };
