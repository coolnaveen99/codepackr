import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel, Firestore } from 'firebase/firestore';

// Codepackr Firebase Production Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyARUk9QZbmUSWPT4oHIwm7ho6l0trjrem8",
  authDomain: "codepackr-cf6b1.firebaseapp.com",
  projectId: "codepackr-cf6b1",
  storageBucket: "codepackr-cf6b1.firebasestorage.app",
  messagingSenderId: "779918234930",
  appId: "1:779918234930:web:a94837a6204de9026a732b",
  measurementId: "G-TC54P43M6G",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  
  // Suppress internal Firestore connection retry logs when offline or behind restricted proxies
  try {
    setLogLevel('silent');
  } catch {
    // Ignore in unsupported environments
  }

  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    db = getFirestore(app);
  }
} catch (error) {
  // Gracefully fallback to client-side offline operation
}

export { app, auth, db };
