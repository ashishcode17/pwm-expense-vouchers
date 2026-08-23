# Launch Checklist — PWM Expense Vouchers

## 1) Reset data + harden security (do this once before office launch)

1. Open Supabase → **SQL Editor**
2. Paste and run the **entire** file: `supabase/LAUNCH_NOW.sql`  
   (security hardening + wipe to admin-only)
3. Confirm results at bottom of SQL run:
   - Only `propertywithmanish@gmail.com` in profiles
   - `voucher_count = 0`
   - `auth_user_count = 1`
4. Storage → bucket **vouchers** → delete all files under `receipts/` (SQL cannot delete storage objects directly)
5. Supabase → **Authentication → URL Configuration**
   - Site URL = `https://vouchers.propertywithmanish.com`
   - Redirect URLs include `https://vouchers.propertywithmanish.com/**`
5. Login as admin → Settings → employees/categories → add real office data
6. Install APK **v1.5+** on phones (HTTPS-only shell)

## 2) Custom domain (recommended)

Buy/own a domain, then in Vercel:

1. Project → **Settings → Domains**
2. Add e.g. `pwmexpensevoucher.com` or `vouchers.propertywithmanish.com`
3. Set DNS records Vercel shows (usually A/CNAME)
4. Wait until SSL becomes **Valid**
5. Tell developer to update Capacitor `server.url` + rebuild APK if domain changes

## 2b) Supabase Auth URLs (required for signup emails)

If confirmation emails open `localhost:3000` → site unreachable, fix this once:

1. Open Supabase → **Authentication → URL Configuration**
2. **Site URL** = `https://vouchers.propertywithmanish.com` (not localhost)
3. **Redirect URLs** add:
   - `https://vouchers.propertywithmanish.com/**`
   - `https://vouchers.propertywithmanish.com/auth/confirm`
   - `https://vouchers.propertywithmanish.com/auth/callback`
   - `http://localhost:3000/**` (optional, for local testing)
4. Save
5. (Optional) Auth → **Email Templates** → Confirm signup  
   Prefer `{{ .ConfirmationURL }}` or  
   `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`  
   if the template was customized to hardcode SiteURL paths
6. Vercel → Environment Variables → set  
   `NEXT_PUBLIC_SITE_URL=https://vouchers.propertywithmanish.com`  
   then Redeploy

After this, new signup emails open the live site and land on `/auth/confirm` → dashboard.

## 3) Fresh office setup after reset

1. Login as admin
2. Settings → company details
3. Add real employees
4. Check/add categories
5. Create first real voucher as a test
6. Install latest APK on office phones

## 4) Free plan notes

- Small office can start on free tiers
- Commercial / heavy use may need Vercel Pro later
- Watch Supabase storage (bills) and DB size
