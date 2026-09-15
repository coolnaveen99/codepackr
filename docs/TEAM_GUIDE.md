# Team Guide — Branching, Testing & Release

Clear separation: **work → test → release**

| Stage | Branch | Purpose |
|-------|--------|--------|
| Work | `feature/*` | New features and fixes |
| Test | `dev` | Integration & staging |
| Release | `main` | Production (live site) |

---

## Rules (everyone)

1. **Always create feature branches from `dev`** — never from `main`.
2. **Never push directly to `dev` or `main`** — only via Pull Request.
3. **PRs into `dev` and `main` need admin approval** (1 approval required).
4. **`dev` and `main` cannot be deleted** and force-push is blocked.

---

## How to start work

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

Do your work, then:

```bash
git add .
git commit -m "feat: short description"
git push -u origin feature/your-feature-name
```

Open a **Pull Request**: base = `dev`, compare = your feature branch.

---

## How to test

### 1. Feature branch (your work)
- After you push, **Vercel** creates a preview URL automatically.
- Open the PR on GitHub → look for the Vercel preview link.
- Share that link with the team for testing.

### 2. After merge into `dev`
- Changes land on the `dev` branch.
- Use the `dev` deployment / staging URL for final checks before production.

### 3. Production (`main`)
- Only after admin merges `dev` → `main`.
- Live sites: [codepackr.com](https://www.codepackr.com)

---

## How to release to production (admin only)

1. Confirm everything on `dev` is tested and good.
2. Open a Pull Request: **base = `main`**, **compare = `dev`**.
3. Admin reviews and **approves**.
4. Admin **merges** the PR.
5. Vercel deploys `main` → production.

---

## Full flow

```
Developer:
  create feature from dev → work → push → test on Vercel preview
       ↓
  Open PR: feature → dev
       ↓
  Admin approves & merges into dev
       ↓
  Team tests on dev (staging)
       ↓
  Admin opens PR: dev → main
       ↓
  Admin approves & merges
       ↓
  Production updated (release done)
```

---

## Branch summary

| Branch | Who merges | Deploy |
|--------|------------|--------|
| `feature/*` | Admin (into `dev`) | Vercel Preview |
| `dev` | Admin (into `main`) | Staging / preview |
| `main` | — | Production |

---

## Tips

- Keep feature branches short-lived (merge or close within a few days).
- Use clear PR titles: `feat: ...`, `fix: ...`, `docs: ...`.
- If something is only documentation, you can still use a feature branch and the same flow.
