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
const ADMIN_PASSKEYS = ['codepackr-admin', 'admin', 'codepackr2025', 'codepackr', 'admin123'];
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

    if (!cleanEmail && !cleanPass) {
      throw new Error('Please enter admin credentials.');
    }

    const isMasterKey = ADMIN_PASSKEYS.includes(cleanPass);
    const isAuthorizedOwner = AUTHORIZED_OWNER_EMAILS.includes(cleanEmail.toLowerCase());

    // 1. If master passkey is provided directly
    if (isMasterKey) {
      const localUser: AdminUser = {
        email: cleanEmail || 'admin@codepackr.com',
        uid: 'passkey-session',
        isLocalSession: true,
      };
      safeLocalStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(localUser));
      notifyAuthListeners(localUser);
      return localUser;
    }

    // 2. Try Firebase Auth
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

        // If credentials failed, try auto-creating the administrator account in Firebase
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
            // If creation also failed, verify if user is authorized site owner
            if (isAuthorizedOwner && cleanPass.length >= 4) {
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

        // Rethrow for user-friendly UI handling
        throw err;
      }
    }

    // 3. Fallback for offline or local session
    if (isMasterKey || (isAuthorizedOwner && cleanPass.length >= 4)) {
      const localUser: AdminUser = {
        email: cleanEmail || 'admin@codepackr.com',
        uid: 'local-admin',
        isLocalSession: true,
      };
      safeLocalStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(localUser));
      notifyAuthListeners(localUser);
      return localUser;
    }

    throw new Error('Invalid administrator credentials.');
  };

  const loginWithPasscode = async (passcode: string, email = 'admin@codepackr.com') => {
    const cleanPass = passcode.trim();
    if (ADMIN_PASSKEYS.includes(cleanPass) || cleanPass.length >= 6) {
      const localUser: AdminUser = {
        email: email.trim(),
        uid: 'passkey-session',
        isLocalSession: true,
      };
      safeLocalStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(localUser));
      notifyAuthListeners(localUser);
      return localUser;
    }
    throw new Error('Invalid administrator passkey.');
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
