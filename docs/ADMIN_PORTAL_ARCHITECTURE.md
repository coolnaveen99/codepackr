# Codepackr Admin Portal & Tool Governance Architecture Reference

*Document Status: Production Architecture Blueprint & Granular Implementation Prompts*  
*Author: Enterprise Architect*  
*Saved Reference for Codepackr (`www.codepackr.com`)*

---

## 1. Executive Summary & Zero-Latency Guarantee

This architecture blueprint details the implementation of an enterprise-grade, secure Admin Portal and Dynamic Tool Governance Engine for Codepackr.

### Core Objectives:
1. **Dynamic Tool Management**: Instantly toggle any tool between `Active`, `Hidden`, `Maintenance`, and `Beta` across Codepackr without modifying code, committing Git repositories, or redeploying the static frontend.
2. **Zero Performance & SEO Degradation**: The public site **must never block** on remote database queries. It loads immediately using the local static tool manifest (`src/data/tools.ts`), and applies an asynchronous, real-time Firestore overlay (`onSnapshot`) in the background.
3. **Zero Credential Liability**: Codepackr stores no passwords, hashes, salts, or sessions. All authentication, brute-force mitigation, and automated password-reset workflows are handled by Google Firebase Auth / Google Cloud Identity.
4. **Resilient Offline/Placeholder Mode**: If Firebase credentials are missing or set to placeholder values, the app operates gracefully without crashing, falling back to local static manifest values.

---

## 2. Firebase Connectivity & Environment Configuration (With Placeholders)

All Firebase configurations are loaded via Vite client-side environment variables (`import.meta.env`).

### 2.1 `.env.example` Template
Add the following placeholders to your `.env.example` file:

```env
# ==============================================================================
# Codepackr Firebase Authentication & Firestore Connectivity
# ==============================================================================

# Your Firebase Web App API Key (from Firebase Console > Project Settings > General)
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE

# Your Firebase Auth Domain (e.g. your-project-id.firebaseapp.com)
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com

# Your Google Cloud / Firebase Project ID
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID

# Your Cloud Storage Bucket (e.g. your-project-id.appspot.com)
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com

# Firebase Cloud Messaging Sender ID (numerical identifier)
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID_HERE

# Firebase App ID (e.g. 1:123456789012:web:abcdef123456)
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID_HERE

# Optional: Measurement ID for Firebase Analytics (e.g. G-XXXXXXXXXX)
VITE_FIREBASE_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID_HERE

# Dedicated Action URL for password reset and email verification redirects
VITE_FIREBASE_AUTH_ACTION_URL=https://www.codepackr.com/admin/auth-action

# Admin Portal URL Route (obfuscated or custom route path)
VITE_ADMIN_PORTAL_ROUTE=/admin-console
```

---

### 2.2 Client-Side Firebase Initializer with Placeholder Guard (`src/lib/firebase.ts`)

To avoid crashing when placeholders are active, use this resilient initialization pattern:

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Check if configuration is active or still contains placeholders
export const isFirebaseConfigured = (): boolean => {
  const key = firebaseConfig.apiKey;
  const project = firebaseConfig.projectId;
  return Boolean(
    key &&
    project &&
    !key.includes('YOUR_') &&
    !project.includes('YOUR_') &&
    key.length > 10
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('[Codepackr Firebase] Initialization warning:', error);
  }
} else {
  console.info('[Codepackr Firebase] Operating in local fallback mode (Firebase placeholders detected).');
}

export { app, auth, db };
```

---

## 3. Firestore Database Schema & Security Rules

### 3.1 Document Path: `/system_config/tools_status`
```json
{
  "json-formatter": {
    "status": "active",
    "visibility": "public",
    "noticeMessage": "",
    "badge": null,
    "lastUpdated": "2026-09-07T12:00:00Z",
    "updatedBy": "admin@codepackr.com"
  },
  "sip-calculator": {
    "status": "active",
    "visibility": "public",
    "noticeMessage": "",
    "badge": "Popular",
    "lastUpdated": "2026-09-07T12:00:00Z",
    "updatedBy": "admin@codepackr.com"
  },
  "edi-850-generator": {
    "status": "maintenance",
    "visibility": "public",
    "noticeMessage": "Upgrading EDI schema parser to 5010 standard. Back online at 14:00 UTC.",
    "badge": "Maintenance",
    "lastUpdated": "2026-09-07T12:15:00Z",
    "updatedBy": "admin@codepackr.com"
  }
}
```

### 3.2 Production Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to verify admin claims or email whitelist
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.role == 'admin' ||
        request.auth.token.email in ['admin@codepackr.com', 'coolnaveen99@gmail.com']
      );
    }

    // Public read for tool governance configuration; write restricted to authenticated admins
    match /system_config/tools_status {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Audit logs for governance history
    match /admin_audit_logs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 4. Master Granular Execution Prompts

Below are the step-by-step, granular prompts designed to implement this system directly. You can pass these prompts sequentially to an AI agent or execute them in phases.

---

### 🔹 PROMPT 1: Firebase Client SDK & Safe Connectivity Hook

```markdown
### TASK OBJECTIVE
Configure the client-side Firebase connectivity layer for Codepackr with full fallback protection and TypeScript safety.

### REQUIREMENTS
1. Create `src/lib/firebase.ts`:
   - Safely import `initializeApp`, `getAuth`, and `getFirestore`.
   - Read variables from `import.meta.env`:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
   - Implement `isFirebaseConfigured(): boolean` that detects empty values or values containing placeholder strings (e.g., 'YOUR_FIREBASE_API_KEY_HERE').
   - Export `{ auth, db, isFirebaseConfigured }`. If not configured, gracefully export `null` and log a diagnostic warning rather than throwing unhandled exceptions.

2. Create `src/types/admin.ts`:
   - Define types for `ToolStatus`: `'active' | 'hidden' | 'maintenance' | 'beta'`.
   - Define `ToolGovernanceItem`:
     ```typescript
     export interface ToolGovernanceItem {
       status: 'active' | 'hidden' | 'maintenance' | 'beta';
       visibility: 'public' | 'admin_only';
       noticeMessage?: string;
       customBadge?: string;
       lastUpdated?: string;
       updatedBy?: string;
     }
     export type ToolGovernanceMap = Record<string, ToolGovernanceItem>;
     ```

3. Update `.env.example` with clear placeholder definitions.
```

---

### 🔹 PROMPT 2: Reactive Tool Governance Client Hook (`useToolGovernance`)

```markdown
### TASK OBJECTIVE
Build a high-performance React hook that consumes Firestore real-time updates while ensuring the public site never experiences loading delays.

### REQUIREMENTS
1. Create `src/lib/useToolGovernance.ts`:
   - Maintain a local state `governance: ToolGovernanceMap`.
   - On initial mount:
     - Check `isFirebaseConfigured()`. If false or offline, immediately return local defaults where every tool in `src/data/tools.ts` is treated as `'active'`.
     - If true, establish a real-time `onSnapshot` subscription to the Firestore document `doc(db, 'system_config', 'tools_status')`.
     - Cache the latest snapshot in `localStorage.getItem('codepackr_tool_governance')` so subsequent page visits load instantaneously even before network hydration.
   - Provide helper methods:
     - `getToolStatus(toolId: string): ToolGovernanceItem`
     - `isToolVisible(toolId: string, isAdmin?: boolean): boolean`
     - `getEffectiveTools(allTools: ToolDef[], isAdmin?: boolean): ToolDef[]`
     - `saveToolStatus(toolId: string, item: Partial<ToolGovernanceItem>): Promise<void>`

2. Ensure clean teardown: Unsubscribe from `onSnapshot` when unmounted.
```

---

### 🔹 PROMPT 3: Admin Authentication & Password Recovery View

```markdown
### TASK OBJECTIVE
Implement the secure authentication interface for Codepackr administrators at `/admin` with zero plain-text password exposure.

### REQUIREMENTS
1. Create `src/components/admin/AdminLoginModal.tsx` or `/admin/login` page:
   - Provide email/password input with validation, password visibility toggle, and rate-limit feedback.
   - Integrate `signInWithEmailAndPassword(auth, email, password)`.
   - Provide a "Forgot Password?" trigger calling `sendPasswordResetEmail(auth, email, { url: window.location.origin + '/admin' })`.
   - Display a notification confirming that a secure, expiring password-reset link was dispatched via Google Cloud Identity.
   - Provide Google SSO button using `signInWithPopup(auth, new GoogleAuthProvider())`.
   - If `!isFirebaseConfigured()`, render a clean setup guide banner explaining which environment variables in `.env` need to be set.

2. Create `src/lib/useAdminAuth.ts`:
   - Listen to `onAuthStateChanged(auth)`.
   - Return `{ user, isAdmin, loading, login, logout, resetPassword }`.
```

---

### 🔹 PROMPT 4: Tool Governance Console UI (`/admin/tools`)

```markdown
### TASK OBJECTIVE
Build an intuitive, responsive management matrix for Codepackr's 100+ developer utilities.

### REQUIREMENTS
1. Create `src/components/admin/ToolGovernanceDashboard.tsx`:
   - Top Bar:
     - Search input with category filter tabs (`Formatters`, `Converters`, `Validators`, `EDI`, `Calculators`, etc.).
     - Quick stats summary pills: Total Tools, Active, Maintenance, Hidden, Beta.
     - "Save & Publish" status indicator showing real-time Firestore sync status.
     - Admin user avatar with sign-out button.
   - Tools Table / Bento Grid:
     - Tool Icon & Name.
     - Category badge.
     - Status Selector Dropdown or Pill Group:
       - `Active` (Emerald)
       - `Maintenance` (Amber)
       - `Beta` (Blue)
       - `Hidden` (Zinc/Muted)
     - Visibility Toggle: `Public` vs `Admin Only`.
     - Notice Message input: For maintenance or deprecation notices shown to users.
     - Quick "View Tool" preview link.
   - Bulk Operations:
     - "Set all in Category to Active / Maintenance".
     - "Reset all to defaults".

2. Design Standards:
   - Adhere to Codepackr theme tokens: `var(--bg)`, `var(--surface)`, `var(--brand)`, `var(--line)`.
   - Fully responsive for mobile and desktop workstations.
   - Use Lucide icons (`CheckCircle`, `AlertTriangle`, `EyeOff`, `Sparkles`, `Lock`, `RefreshCw`).
```

---

### 🔹 PROMPT 5: Public Route Guard & Fallback Views

```markdown
### TASK OBJECTIVE
Integrate the governance overlay into Codepackr's public views without layout shifting or 404 errors.

### REQUIREMENTS
1. Update `src/App.tsx` and `src/components/HomeDashboard.tsx`:
   - Wrap the tool catalog with `getEffectiveTools(TOOLS, isAdmin)`.
   - Hidden tools are omitted from the public card grid and category views.
   - If a user navigates directly to a tool URL (e.g. `/sip-calculator.html`) whose status is `'maintenance'`:
     - Render a modern, informative maintenance card instead of the tool form.
     - Display the custom notice message from Firestore (e.g., "Under scheduled maintenance. Back online at 14:00 UTC.").
     - Provide a "Back to All Tools" button.
   - If a user navigates to a tool whose status is `'hidden'`, redirect safely to `/` with a clean toast notification.
2. Update `src/components/SearchModal.tsx`:
   - Filter `⌘K` search results through `isToolVisible(tool.id)`.
```

---

## 5. Security & Verification Checklist

- [ ] **No Hardcoded Secrets**: All Firebase keys are referenced through `import.meta.env`.
- [ ] **Placeholder Guard**: App operates cleanly without throwing errors when variables contain default template strings.
- [ ] **Read-Only Public Access**: `firestore.rules` enforces that only authenticated admin accounts can mutate `/system_config/tools_status`.
- [ ] **Offline Resilience**: Cached local storage guarantees that public users always see tools even during temporary network drops or Firebase outages.
