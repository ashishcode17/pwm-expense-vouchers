# Security Audit Report — PWM Expense Vouchers

Architecture note: There are **no custom REST API route handlers** for CRUD. The app is Next.js App Router + **Supabase client SDK** (PostgREST + Auth + Storage). Authorization is enforced by **RLS** + server layouts (`requireAdmin` / dashboard auth).

---

## 1) Authentication

| Check | Status | Severity | Finding & fix |
|-------|--------|----------|---------------|
| Plaintext password storage | **Pass** | — | Passwords go to **Supabase Auth** (`signInWithPassword` / `signUp`). App never stores hashes. Supabase uses bcrypt server-side. No local change required. |
| Rate limiting on login | **Gap** | **Medium** | No app-level throttle on `src/app/login/page.tsx`. Relies on Supabase Auth rate limits. **Fix (Dashboard):** Auth → Rate Limits tighten sign-in. **Optional code:** edge middleware counter / Vercel WAF. |
| JWT expiry ≤ 24h | **Verify Dashboard** | **Medium** | Not set in repo. Supabase default access JWT is **3600s**. **Fix:** Auth → Sessions → JWT expiry ≤ 86400 (prefer 3600). |
| Session after logout | **Pass** | — | `signOut()` in `app-shell.tsx` (global scope clears refresh tokens). |
| Password reset link ≤ 1h | **Gap** | **Medium** | No forgot-password UI; no `resetPasswordForEmail` in app. Recovery expiry is Dashboard-only. **Fix:** Confirm Auth email OTP/recovery expiry ≤ 3600s; add reset page if needed. |
| CSRF on login form | **N/A / Low** | **Low** | Login is JS → Supabase Auth API, not a classic cookie form POST. Cookie sessions use `@supabase/ssr` (SameSite typically Lax). No CSRF token needed for this pattern. |
| Open public signup | **Risk** | **High** | `/signup` allows anyone to create staff. **Fix:** Disable public signup in Supabase Auth, or remove `/signup` and invite-only. |
| Weak password min (6) | **Gap** | **Medium** | `signup/page.tsx` minLength 6. **Fix:** Raise to 12+ in UI + Supabase password policy. |
| Delete user incomplete | **Gap** | **High** | `users/page.tsx` deletes `profiles` only, not `auth.users`. **Fix:** Edge Function with service role `auth.admin.deleteUser(id)`. |

### Exact code (safer login errors) — applied
Use `toUserError()` instead of raw `error.message` (see `src/lib/user-error.ts`).

---

## 2) Authorization (every “endpoint” / data path)

| Path / operation | AuthN | AuthZ | Horizontal (IDOR) | Vertical | Status |
|------------------|-------|-------|-------------------|----------|--------|
| `GET /` | Redirect if logged in | — | — | — | OK |
| `GET /login`, `/signup` | Public | — | — | — | Signup **High** risk if left open |
| `GET /auth/confirm`, `/auth/callback` | Token/code | `next` path allowlisted | — | — | OK |
| `GET /dashboard/*` layout | `getUser()` required | — | — | — | OK |
| `GET /dashboard` | Auth | Staff: own vouchers via RLS; admin totals | RLS | OK | OK |
| `GET /dashboard/vouchers/new` + insert | Auth | Insert `created_by = auth.uid()` | N/A | Staff OK | OK |
| `GET /dashboard/vouchers/[id]` | Auth | RLS select own/admin | **RLS** | OK | OK if `LAUNCH_NOW` applied |
| Soft-delete voucher | Auth | Admin-only UPDATE RLS + UI | Admin only | OK | OK |
| `GET .../edit` + update | Auth | Client admin check + admin UPDATE RLS | Admin only | OK | OK |
| `GET /dashboard/register` | Auth | **`requireAdmin` layout** + RLS | Admin | OK | OK |
| `GET /dashboard/reports` | Auth | **`requireAdmin`** | Admin | OK | OK |
| `GET /dashboard/settings` + mutations | Auth | **`requireAdmin`** + RLS | Admin | OK | OK |
| `GET /dashboard/users` + role/delete | Auth | Layout + client admin | Admin | **Partial** | Profile delete ≠ Auth delete (**High**) |
| Storage upload/signed URL | Auth | Path `receipts/{uid}/…` policies | Own/admin | OK | OK if hardening SQL applied |
| RPC `get_next_voucher_number` | Auth | SECURITY DEFINER | N/A | OK | OK |

**Horizontal escalation:** Staff cannot read others’ vouchers **if** migration 005 / `LAUNCH_NOW` was run (drops old “view all” policy).  
**Vertical escalation:** Admin routes guarded by `src/lib/auth/require-role.ts` + RLS. Staff cannot self-promote if `protect_profile_privileges` trigger is installed.

---

## 3) Hardcoded secrets

| Finding | File | Line | Severity | Secure alternative |
|---------|------|------|----------|--------------------|
| Android keystore passwords on disk | `android/keystore.properties` | 1–2 | **High** (gitignored) | CI secrets → generate file at build: `echo "storePassword=$KEYSTORE_PASSWORD" > keystore.properties` |
| Keystore binary | `android/app/pwm-release.keystore` | — | **High** (gitignored) | Keep out of git; store in secure CI artifact store |
| `.env` / `.env.local` | — | — | **Pass** | Not committed (`.gitignore`). Only `.env.local.example` tracked |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | env | — | **OK** | Anon key is public by design; protect with RLS |
| `sk_`, `pk_`, `AKIA…`, private keys in repo | — | — | **Pass** | None found |
| Service role key in client | — | — | **Pass** | Not used in app |

---

## 4) SQL / injection

| Location | Issue | Severity | Fix |
|----------|-------|----------|-----|
| `register/page.tsx` `.or(\`...${q}...\`)` | PostgREST filter string concat | **Medium** (mitigated by `escapeIlike`) | Prefer RPC with bound params, or keep escape + allowlists (payment mode allowlist applied) |
| Other `.eq/.gte/.lte/.rpc` | Parameterized by client | **Pass** | — |
| MongoDB / raw `sql` tagged templates | None | — | — |

### Vulnerable vs safer

```ts
// Before (risky if unsanitized)
query.or(`voucher_number.ilike.%${filters.search}%,...`)

// Current (sanitized)
const q = escapeIlike(filters.search) // strips %_,.()\\
query.or(`voucher_number.ilike.%${q}%,paid_to.ilike.%${q}%,description.ilike.%${q}%`)

// Best
await supabase.rpc('search_vouchers', { q })
```

---

## 5) Deployment (Vercel + Next.js)

| Check | Before | After this PR |
|-------|--------|----------------|
| Debug / source maps | Defaults OK | `productionBrowserSourceMaps: false` |
| Security headers | **Missing** | Added in `next.config.ts` |
| HSTS | Platform only | App sends `Strict-Transport-Security` |
| CSP / XFO / XCTO / Referrer | Missing | Set |
| HTTPS | Custom domain on Vercel | OK |
| Secrets | Env on Vercel | Keep `NEXT_PUBLIC_*` + never put service role in client |

Config lives in `next.config.ts` (applied on this branch).

**Supabase Dashboard still required:** Site URL, JWT expiry, Auth rate limits, recovery OTP expiry.

---

## 6) Dependencies (`npm audit`)

| Package | Registry | Notes |
|---------|----------|-------|
| All named deps | Exist on npm | No typosquatting |
| `uuid` via `@capacitor/cli` → `xcode` | **3 moderate** | Build-time CLI; moved CLI to `devDependencies` |
| `shadcn` | CLI tooling | Moved to `devDependencies` (not runtime) |
| `localtunnel` | Removed earlier | OK |
| Version pins | Mix of `^` and exact | Deploy with `npm ci` + lockfile |

---

## 7) Error handling / info disclosure

| Location | Leak | Severity | Fix |
|----------|------|----------|-----|
| login / signup | Was raw `error.message` | **Medium** | → `toUserError()` (**applied**) |
| new voucher | Was raw message | **Medium** | → `toUserError()` (**applied**) |
| settings category | Was raw message | **Medium** | → generic toast (**applied**) |
| Missing `error.tsx` / `not-found.tsx` | Default Next pages | **Medium** | **Added** |
| `console.error` in browser | Devtools only | **Low** | Prefer server logging later |

---

## Priority actions for you

1. Confirm `LAUNCH_NOW` / hardening SQL already ran (RLS).  
2. Supabase Auth: JWT ≤ 24h, recovery ≤ 1h, rate limits ON, consider disabling public signup.  
3. Clear any real receipt files in Storage UI if needed.  
4. Deploy this branch (headers + error pages + safer errors).  
5. Rotate Android keystore passwords if the workspace was ever shared.
