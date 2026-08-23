# Final launch audit — PWM Expense Vouchers

Deep security + performance pass before office go-live.

## What was fixed in code (this branch)

| Area | Fix |
|------|-----|
| Privilege escalation | Trigger blocks staff from changing `role` / `active` / email |
| Voucher read IDOR | Dropped leftover “view all vouchers” policy; staff see own only |
| Profiles / lists | Anon can no longer read profiles; employees/categories require auth |
| Sequence table | Direct client writes removed; RPC is `SECURITY DEFINER` |
| Receipts | Private storage bucket + signed URLs; path `receipts/{userId}/…` |
| Staff receipt attach | Upload happens **before** insert (no post-insert UPDATE needed) |
| Admin routes | Server layouts guard settings / reports / register / users |
| Inactive users | Dashboard layout signs out `active = false` |
| Register search | Escaped + debounced; CSV formula injection hardened; limit 500 |
| Edit voucher | Saves `transaction_reference` + `amount_in_words` |
| Auth redirects | `next` path allowlisted |
| Android | HTTPS only, no cleartext, `allowBackup=false` → APK **v1.5** |
| Deps | Removed unused `localtunnel` |

## YOU must run in Supabase (cannot be done from this agent)

1. Open SQL Editor: https://supabase.com/dashboard/project/ownfexksfpkfojxyjwwv/sql/new  
2. Paste **all** of `supabase/LAUNCH_NOW.sql` → Run  
3. Confirm verify queries show **1 admin**, **0 vouchers**, **0 receipt files**  
4. Auth → URL Configuration → Site URL = `https://vouchers.propertywithmanish.com`

Until step 2 runs, the old insecure RLS policies remain live on the database.

## Optional dashboard settings

- Auth → Providers → Email: keep confirm email ON for office hygiene  
- Or turn confirm OFF if you want instant staff access after signup  

## After deploy

1. Wait for Vercel deploy from `main`  
2. Hard-refresh login page  
3. Sign up a test staff → confirm they cannot see admin menus / others’ vouchers  
4. Install APK v1.5 for Android shell hardening (web fixes apply without new APK)
