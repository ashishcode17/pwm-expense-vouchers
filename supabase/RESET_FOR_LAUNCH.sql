-- ============================================
-- PWM Expense Vouchers — FULL LAUNCH RESET
-- Keeps ONLY admin: propertywithmanish@gmail.com
-- Deletes: all vouchers, other auth users, profiles,
--          receipt files, voucher sequence
-- Run in: Supabase → SQL Editor → New query → Run
-- Also run 005_security_hardening.sql (or LAUNCH_NOW.sql)
-- ============================================

BEGIN;

-- 1) All expense vouchers (test + real wipe for launch)
DELETE FROM public.vouchers;

-- 2) Reset voucher numbering
DELETE FROM public.voucher_sequence;

-- 3) Remove non-admin profiles first (FK from vouchers already cleared)
DELETE FROM public.profiles
WHERE email IS DISTINCT FROM 'propertywithmanish@gmail.com';

-- 4) Ensure remaining admin profile is correct
UPDATE public.profiles
SET role = 'admin',
    active = true
WHERE email = 'propertywithmanish@gmail.com';

COMMIT;

-- 5) Delete Auth users except primary admin (outside txn; auth schema)
DELETE FROM auth.users
WHERE email IS DISTINCT FROM 'propertywithmanish@gmail.com';

-- 6) Wipe all receipt files in storage
DELETE FROM storage.objects
WHERE bucket_id = 'vouchers';

-- Verify (should show 1 admin profile, 0 vouchers)
SELECT email, role, active FROM public.profiles;
SELECT count(*) AS voucher_count FROM public.vouchers;
SELECT count(*) AS auth_user_count FROM auth.users;
SELECT count(*) AS receipt_files FROM storage.objects WHERE bucket_id = 'vouchers';
