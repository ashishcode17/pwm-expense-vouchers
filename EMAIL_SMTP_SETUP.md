# Fix: Signup confirmation emails not sending

## Root cause (confirmed)

Supabase **built-in email** is for testing only:

- **2 emails per hour** for the whole project
- After testing signups, you hit: `over_email_send_rate_limit`
- Mail **stops completely** until the hour resets

Your project returned this error when signup was tested. **Confirm email can stay ON** — you need **custom SMTP**.

---

## Fix (one-time, ~15 min) — use Resend (free)

### Step 1: Resend account
1. Go to https://resend.com/signup
2. Create account (free tier: ~100 emails/day)

### Step 2: Add domain (recommended)
1. Resend → **Domains** → Add `propertywithmanish.com`
2. Add the DNS records Resend shows (in Cloudflare)
3. Wait until status = **Verified**

### Step 3: Create API key
1. Resend → **API Keys** → Create
2. Copy the key (starts with `re_`)

### Step 4: Supabase SMTP settings
1. Open: https://supabase.com/dashboard/project/ownfexksfpkfojxyjwwv/auth/smtp
2. Enable **Custom SMTP**
3. Fill in:

| Field | Value |
|-------|--------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | your Resend API key (`re_...`) |
| Sender email | `noreply@propertywithmanish.com` |
| Sender name | `PWM Expense Vouchers` |

4. **Save**

### Step 5: Keep confirm email ON
1. Authentication → **Providers** → **Email** → **Confirm email ON**
2. URL Configuration:
   - Site URL: `https://vouchers.propertywithmanish.com`
   - Redirect URLs: `https://vouchers.propertywithmanish.com/**` and `/auth/confirm`

### Step 6: Test
1. Wait 1 hour if old rate limit still active, or use a fresh email
2. Sign up at https://vouchers.propertywithmanish.com/signup
3. Check Auth **Logs** in Supabase — no `over_email_send_rate_limit`

---

## Alternative: Gmail SMTP

1. Google Account → Security → 2-Step Verification ON
2. Create **App Password** for Mail
3. Supabase SMTP: `smtp.gmail.com`, port `587`, user `propertywithmanish@gmail.com`, password = app password

---

## Until SMTP is configured

- Wait 1 hour, then try one signup
- Admin: Authentication → Users → **Confirm user** manually
- Auth Logs will show `over_email_send_rate_limit` when limit is hit
