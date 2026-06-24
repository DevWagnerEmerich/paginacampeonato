import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração obtida por variáveis de ambiente do Vite ou fallbacks padrão
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8iNq8cYVYD8I0jWk6Tj3nLOU9Yu3b3PY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "abstract-altar-d53sn.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "abstract-altar-d53sn",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "abstract-altar-d53sn.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "119788167568",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:119788167568:web:76854bdb651fbc45ac9315",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-59eb40c9-bccf-4070-a6e9-1fe4dd662c2d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID provided in config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

const auth = getAuth(app);

export { app, db, auth };
export default app;
