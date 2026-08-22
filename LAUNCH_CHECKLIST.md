# Launch Checklist — PWM Expense Vouchers

## 1) Reset data (do this once before office launch)

1. Open Supabase → **SQL Editor**
2. Paste and run: `supabase/RESET_FOR_LAUNCH.sql`
3. Supabase → **Authentication → Users**
   - Delete all users **except** `propertywithmanish@gmail.com`
4. Supabase → **Storage → vouchers → receipts**
   - Delete all test bill files
5. Confirm:
   - Only admin profile remains
   - Vouchers count = 0

## 2) Custom domain (recommended)

Buy/own a domain, then in Vercel:

1. Project → **Settings → Domains**
2. Add e.g. `pwmexpensevoucher.com` or `vouchers.propertywithmanish.com`
3. Set DNS records Vercel shows (usually A/CNAME)
4. Wait until SSL becomes **Valid**
5. Tell developer to update Capacitor `server.url` + rebuild APK if domain changes

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
