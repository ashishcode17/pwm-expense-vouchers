# PWM Expense Vouchers — Office Operations & Troubleshooting Guide

Yeh document batata hai ki app **kaise kaam karti hai**, office mein **kaise chalani hai**, aur problem aaye to **kahan dekhna hai**.

---

## 1) App asal mein kya hai?

Yeh ek **cloud web app** hai. Android APK sirf ek **wrapper** hai jo phone pe website kholta hai.

| Piece | Role | URL / Place |
|-------|------|-------------|
| **Website (real app)** | Login, vouchers, PDF, reports | `https://vouchers.propertywithmanish.com` |
| **Database + Auth + File storage** | Users, vouchers, bills | Supabase |
| **Android APK** | Phone icon / WebView shell | Opens the Vercel URL |
| **iPhone** | Safari → Add to Home Screen | Same Vercel URL |
| **Code** | Source | GitHub: `ashishcode17/pwm-expense-vouchers` |

**Sabse important baat:**  
APK ke andar website copy nahi hai. APK internet se live website load karti hai.  
Isliye:

- Website fix = app fix (naya APK har baar zaroori nahi)
- Internet band = app nahi chalegi
- Vercel down / paused = APK bhi blank/error dikhayegi

---

## 2) Poora system flow (simple)

```
Phone APK / Browser
        │
        ▼
Vercel (Next.js website)
        │
        ▼
Supabase
  ├── Auth (login/signup)
  ├── Database (vouchers, users, settings)
  └── Storage (bill/receipt files)
```

### User kya karta hai

1. Login / Signup
2. New Expense Voucher banata hai
3. Optional: bill photo/PDF attach
4. Save → voucher number auto milta hai (`PWM/EXP/YYYY/0001`)
5. View / Print / Download PDF
6. Admin: edit/delete, reports, register, users, settings

---

## 3) Roles (Admin vs Staff)

| Action | Admin | Staff |
|--------|-------|-------|
| Signup / Login | ✅ | ✅ |
| New voucher | ✅ | ✅ |
| View own vouchers | ✅ | ✅ |
| View all vouchers | ✅ | ❌ |
| Edit voucher | ✅ only | ❌ |
| Delete voucher | ✅ only | ❌ |
| Expense Register | ✅ | ❌ |
| Reports | ✅ | ❌ |
| Users page | ✅ | ❌ |
| Settings | ✅ | ❌ |

**Main admin email (by design):** `propertywithmanish@gmail.com`  
Is email ko signup/login pe admin banana chahiye (trigger/SQL se).

Baaki users default **staff** hote hain.

---

## 4) Main screens kya karti hain

### Login / Signup
- Supabase Auth
- Password min 6 characters
- Signup ke baad profile banani chahiye (`profiles` table)

### Dashboard
- Admin: summary cards + recent vouchers
- Staff: apne vouchers
- Mobile: hamburger menu

### New Voucher
Fields: date, paid to, amount, category, description, payment mode, paid by, approved by, remarks, bill attach  
Amount words mein auto convert hota hai (Indian format).

### View Voucher
- Professional payment voucher layout
- Print / PDF
- Agar bill attached hai: Open / Download
- Admin: Edit / Delete

### Expense Register
- Filters + CSV export (admin)

### Reports
- Monthly totals, category / payment breakdown (admin)

### Settings
- Company details, employees, categories (admin)

### Users
- Role change / user management (admin)

---

## 5) Data kahan store hota hai (Supabase tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User name, email, role |
| `employees` | Paid By / Approved By dropdown |
| `expense_categories` | Categories |
| `company_settings` | Company header for voucher/PDF |
| `voucher_sequence` | Atomic voucher number counter |
| `vouchers` | Actual expense records |
| Storage bucket `vouchers` | Receipt files under `receipts/` |

**Soft delete:** voucher delete = `deleted_at` set hota hai (row hard delete nahi).

---

## 6) Office mein deploy / install kaise karna hai

### A) Website (already live)
- URL: `https://vouchers.propertywithmanish.com`
- Host: Vercel
- Code push to `main` → auto redeploy (agar connected hai)

### B) Android phones
1. Latest APK download:  
   https://github.com/ashishcode17/pwm-expense-vouchers/releases
2. Phone pe install (Unknown apps allow)
3. Open → website load hogi
4. Login

**Recommended:** pehle purana APK uninstall, phir naya install.

### C) iPhone
1. Safari mein website kholo
2. Share → **Add to Home Screen**
3. Icon se open karo

### D) Desktop / Laptop
Browser mein same URL.

---

## 7) Daily office use (recommended process)

1. Admin pehle Settings mein:
   - Company details
   - Employees add
   - Categories add/check
2. Staff accounts signup / create
3. Har expense pe **New Voucher**
4. Bill ho to attach
5. Save → Print/PDF zarurat pe
6. Month end: Reports + Register export

---

## 8) Common problems & kaise solve karein

### App open hoti hai lekin blank / paused
**Cause:** Vercel deployment paused / billing / quota  
**Check:** Vercel Dashboard → project → Resume / Billing  
**Fix:** Resume deployment, wait 1–2 min, app reopen

### Login fail / session out
**Cause:** Wrong password, auth issue, cookies  
**Fix:**
- Password reset (Supabase Auth → Users)
- Browser/app cache clear / reinstall APK
- Confirm Supabase Auth email confirmation settings (agar on hai to email verify zaroori)

### Signup confirmation email opens localhost / “site can’t be reached”
**Cause:** Supabase **Site URL** still set to `http://localhost:3000`  
**Fix (do once in Supabase Dashboard):**
1. Authentication → **URL Configuration**
2. Site URL → `https://vouchers.propertywithmanish.com`
3. Redirect URLs mein add karo:
   - `https://vouchers.propertywithmanish.com/**`
   - `https://vouchers.propertywithmanish.com/auth/confirm`
4. Save. Naye signup emails live site pe khulenge.  
(Verification pehle bhi ho jati thi — sirf redirect broken tha.)

### Signup email hi nahi aa rahi
**Confirmed cause (testing):** Supabase built-in mail = **2 emails/hour only**. After testing, limit hit → **no mail at all** until reset.

**Fix (keep Confirm email ON):** Set up **custom SMTP** — full steps in **`EMAIL_SMTP_SETUP.md`** (Resend or Gmail).

Quick link: https://supabase.com/dashboard/project/ownfexksfpkfojxyjwwv/auth/smtp

**Until SMTP is done:**
- Wait 1 hour, then try **one** new signup
- Or admin manually **Confirm user** in Authentication → Users
- Check Auth **Logs** for `over_email_send_rate_limit`

**Also check:**
- Spam folder
- Redirect URL allowlist includes `/auth/confirm`
- Email already registered → use Sign In or Resend on signup screen

**Do NOT need to turn off Confirm email** once SMTP is configured.

### Signup hua lekin dashboard / role galat
**Cause:** `profiles` row missing ya role staff hai  
**Fix (Supabase SQL):**
```sql
-- Check profile
SELECT * FROM profiles WHERE email = 'user@email.com';

-- Make admin (if needed)
UPDATE profiles SET role = 'admin' WHERE email = 'propertywithmanish@gmail.com';
```

### Bill/receipt upload fail
**Cause:** Storage bucket / policies missing  
**Fix:** Supabase → SQL Editor → run `supabase/migrations/003_storage_setup.sql`  
Confirm Storage mein bucket name: `vouchers` (public)

### Edit/Delete staff ko dikh raha / nahi chal raha
**Rule:** sirf admin edit/delete kar sakta hai  
**DB policies:** `004_admin_only_edit_delete.sql` run hona chahiye

### Employees / categories dropdown empty
**Cause:** Settings mein data nahi, ya inactive  
**Fix:** Admin → Settings → Employees / Categories add + Active

### Voucher number duplicate / fail
**Cause:** `get_next_voucher_number` RPC missing  
**Fix:** `001_initial_schema.sql` ke sequence function/policies check karo

### APK install pe “scan / dangerous”
**Normal** for non-Play Store apps (Play Protect)  
Use latest **release-signed** APK from GitHub Releases  
Poora trust ke liye Play Store publish karna padta hai

### Phone back button app band / minimize
Latest APK (v1.2+) mein back = history back  
Purana APK hai to update karo

### View voucher slow
Website deploy latest hona chahiye (parallel fetch already added)  
Slow internet / Supabase region latency bhi affect karti hai  
Check: Vercel deploy success + phone network

### PDF / Print issue
Browser/WebView print support pe depend  
Desktop Chrome usually best for print  
PDF Download button use karo as backup

---

## 9) Important dashboards (bookmark kar lo)

| Service | Kyon |
|---------|------|
| Vercel | Website deploy / pause / logs |
| Supabase | Users, DB, Storage, SQL |
| GitHub repo | Code + APK releases |
| GitHub Releases | APK download for office phones |

---

## 10) Emergency checklist (5 minutes)

1. Website browser mein khulti hai?  
   - Nahi → Vercel check
2. Login hota hai?  
   - Nahi → Supabase Auth / password
3. New voucher save hota hai?  
   - Nahi → Supabase Table Editor / RLS / categories-employees
4. Upload fail?  
   - Storage bucket + policies
5. APK purani lag rahi?  
   - Latest release install
6. Sirf ek phone pe issue?  
   - Network / app reinstall / another browser test

---

## 11) Code / infra map (technical)

- Frontend: Next.js (App Router) + TypeScript + Tailwind
- Hosting: Vercel
- Backend: Supabase (Postgres + Auth + Storage + RLS)
- Android shell: Capacitor (`server.url` → Vercel)
- PDF: jsPDF (client-side)
- Auth session: `src/proxy.ts` + Supabase SSR helpers

Key folders:
- `src/app/dashboard/...` → screens
- `src/components/...` → UI pieces
- `supabase/migrations/...` → DB/storage policies
- `android/...` → APK project
- `capacitor.config.ts` → APK opens which URL

---

## 12) Golden rules for office

1. **Source of truth website hai**, APK nahi  
2. Kabhi bhi production data SQL se casually delete mat karo  
3. Admin account safe rakho  
4. APK updates GitHub Releases se do  
5. Supabase + Vercel login credentials office owner ke paas safe backup mein rakho  
6. Keystore (Play Store / future signed APK) khona mat — updates block ho sakti hain

---

## Quick links

- Live app: https://vouchers.propertywithmanish.com  
- APK releases: https://github.com/ashishcode17/pwm-expense-vouchers/releases  
- Repo: https://github.com/ashishcode17/pwm-expense-vouchers  
