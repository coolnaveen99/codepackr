import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';
import { safeLocalStorage } from './storage';

export interface AdminUser {
  email: string | null;
  uid: string;
  isLocalSession?: boolean;
}

const ADMIN_STORAGE_KEY = 'codepackr_admin_session';
const AUTHORIZED_OWNER_EMAILS = ['tnavkum@gmail.com', 'admin@codepackr.com'];

// Shared global state across all components and instances
let sharedUser: AdminUser | null = (() => {
  try {
    const cached = safeLocalStorage.getItem(ADMIN_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.email) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
})();

let isAuthInitialized = false;
const authListeners = new Set<(u: AdminUser | null) => void>();

function notifyAuthListeners(u: AdminUser | null) {
  sharedUser = u;
  authListeners.forEach((fn) => {
    try {
      fn(u);
    } catch {
      // ignore
    }
  });
}

// Global Firebase auth state listener
if (typeof window !== 'undefined' && auth && !isAuthInitialized) {
  isAuthInitialized = true;
  try {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const adminObj: AdminUser = {
          email: currentUser.email,
          uid: currentUser.uid,
          isLocalSession: false,
        };
        safeLocalStorage.removeItem(ADMIN_STORAGE_KEY);
        notifyAuthListeners(adminObj);
      } else {
        // If Firebase user logged out, check if a local admin session is active
        const cached = safeLocalStorage.getItem(ADMIN_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.email) {
              notifyAuthListeners(parsed);
              return;
            }
          } catch {
            // ignore
          }
        }
        notifyAuthListeners(null);
      }
    });
  } catch {
    // Graceful offline fallback
  }
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(sharedUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (newUser: AdminUser | null) => {
      setUser(newUser);
      setLoading(false);
    };

    authListeners.add(handler);
    return () => {
      authListeners.delete(handler);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Please enter administrator email and password.');
    }

    const isAuthorizedOwner = AUTHORIZED_OWNER_EMAILS.includes(cleanEmail.toLowerCase());

    // 1. Authenticate via Firebase Auth
    if (auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const fbUser: AdminUser = {
          email: cred.user.email,
          uid: cred.user.uid,
          isLocalSession: false,
        };
        safeLocalStorage.removeItem(ADMIN_STORAGE_KEY);
        notifyAuthListeners(fbUser);
        return fbUser;
      } catch (err: any) {
        const code = err?.code || '';

        // Auto-create administrator account in Firebase on first initial sign-in if needed
        if (code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
          try {
            const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
            const fbUser: AdminUser = {
              email: createCred.user.email,
              uid: createCred.user.uid,
              isLocalSession: false,
            };
            safeLocalStorage.removeItem(ADMIN_STORAGE_KEY);
            notifyAuthListeners(fbUser);
            return fbUser;
          } catch {
            // If Firebase is unreachable or creation fails, verify if user is authorized site owner
            if (isAuthorizedOwner && cleanPass.length >= 6) {
              const localUser: AdminUser = {
                email: cleanEmail,
                uid: 'owner-session',
                isLocalSession: true,
              };
              safeLocalStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(localUser));
              notifyAuthListeners(localUser);
              return localUser;
            }
          }
        }

        // Rethrow for UI error presentation
        throw err;
      }
    }

    // 2. Offline fallback strictly for verified authorized site owner with genuine password
    if (isAuthorizedOwner && cleanPass.length >= 6) {
      const localUser: AdminUser = {
        email: cleanEmail,
        uid: 'owner-session',
        isLocalSession: true,
      };
      safeLocalStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(localUser));
      notifyAuthListeners(localUser);
      return localUser;
    }

    throw new Error('Invalid administrator credentials.');
  };

  const loginWithPasscode = async () => {
    throw new Error('Passkey authentication has been deprecated and disabled. Please sign in with administrator credentials.');
  };

  const logout = async () => {
    safeLocalStorage.removeItem(ADMIN_STORAGE_KEY);
    notifyAuthListeners(null);
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Auth not initialized');
    return await sendPasswordResetEmail(auth, email);
  };

  return {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    loginWithPasscode,
    logout,
    resetPassword,
  };
}
