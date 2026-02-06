import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";

// TODO: Replace with your specific Firebase Project configuration from the console
// Go to https://console.firebase.google.com/
// Create a project -> Add Web App -> Copy config
const firebaseConfig = {
    apiKey: "API_KEY_PLACEHOLDER",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.firebasestorage.app",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
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
    console.warn("Firebase initialization failed (likely missing config). Auth will be mocked.");
}

export { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect };
