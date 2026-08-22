-- ============================================
-- PWM Expense Vouchers — LAUNCH RESET
-- Keeps ONLY admin: propertywithmanish@gmail.com
-- Deletes test vouchers, other profiles, and receipt files metadata cleanup notes
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================

BEGIN;

-- 1) Soft-delete / remove all vouchers (test data)
DELETE FROM vouchers;

-- 2) Reset voucher numbering to zero for current/future years
DELETE FROM voucher_sequence;

-- 3) Optional: clear employees (dropdown list) — uncomment if you want empty list
-- DELETE FROM employees;

-- 4) Keep default categories OR wipe and reseed:
-- DELETE FROM expense_categories;
-- INSERT INTO expense_categories (name) VALUES
--   ('Refreshments'),
--   ('Travel'),
--   ('Office Supplies'),
--   ('Utilities'),
--   ('Maintenance'),
--   ('Miscellaneous');

-- 5) Delete all profiles EXCEPT main admin
DELETE FROM profiles
WHERE email IS DISTINCT FROM 'propertywithmanish@gmail.com';

-- Ensure admin role is correct
UPDATE profiles
SET role = 'admin',
    active = true
WHERE email = 'propertywithmanish@gmail.com';

COMMIT;

-- ============================================
-- AFTER THIS SQL: also delete Auth users in Dashboard
-- ============================================
-- Supabase → Authentication → Users
-- Delete every user EXCEPT propertywithmanish@gmail.com
--
-- Storage cleanup:
-- Supabase → Storage → vouchers → receipts folder → delete all files
--
-- Verify:
-- SELECT email, role FROM profiles;
-- SELECT count(*) FROM vouchers;
-- SELECT * FROM voucher_sequence;
