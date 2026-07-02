/// <reference types="vite/client" />

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const requiredFirebaseEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseEnvVars = Object.entries(requiredFirebaseEnv)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const isFirebaseConfigured = missingFirebaseEnvVars.length === 0;

export const firebaseConfig = {
  // Placeholders allow the app to render setup help when .env.local is absent.
  apiKey: requiredFirebaseEnv.VITE_FIREBASE_API_KEY || 'missing-api-key',
  authDomain: requiredFirebaseEnv.VITE_FIREBASE_AUTH_DOMAIN || 'missing.firebaseapp.com',
  projectId: requiredFirebaseEnv.VITE_FIREBASE_PROJECT_ID || 'missing-project',
  storageBucket: requiredFirebaseEnv.VITE_FIREBASE_STORAGE_BUCKET || 'missing-project.appspot.com',
  messagingSenderId: requiredFirebaseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: requiredFirebaseEnv.VITE_FIREBASE_APP_ID || '1:000000000000:web:missing',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
