// FREE FIRE LAB — Firebase bootstrap (modular SDK from CDN, no build step needed)
// These web config values are public identifiers (not secrets). Security comes from Firestore rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import * as FS from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import * as AU from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCtXyNim4pPGPkyJOW9zQmEqnlnKtbLtcw",
  authDomain: "chat-chat-app-b3fd3.firebaseapp.com",
  projectId: "chat-chat-app-b3fd3",
  storageBucket: "chat-chat-app-b3fd3.firebasestorage.app",
  messagingSenderId: "284766266907",
  appId: "1:284766266907:web:9b859c4b083326f089babe",
  measurementId: "G-QWFTF9S23Z"
};

export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.14.1";
// Admin usernames are mapped to a real Firebase Auth account: <username>@ADMIN_DOMAIN
export const ADMIN_DOMAIN = "ffl-admin.app";

export const app = initializeApp(firebaseConfig);
export const db = FS.getFirestore(app);
export const auth = AU.getAuth(app);
export { FS, AU };
