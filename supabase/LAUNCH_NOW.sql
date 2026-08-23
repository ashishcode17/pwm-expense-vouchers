-- ============================================
-- PWM Expense Vouchers — Migration 005
-- Security hardening + performance indexes
-- Safe to re-run (drops policies by name first)
-- ============================================

-- Helper: admin check (avoids recursive policy issues)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND COALESCE(active, true) = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Protect role / active / email from self-escalation
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.email = 'propertywithmanish@gmail.com' THEN
      IF NEW.role IS DISTINCT FROM 'admin' OR COALESCE(NEW.active, true) IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Primary admin account cannot be demoted or deactivated';
      END IF;
    END IF;

    IF NOT public.is_admin() THEN
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Only admins can change roles';
      END IF;
      IF NEW.active IS DISTINCT FROM OLD.active THEN
        RAISE EXCEPTION 'Only admins can change active status';
      END IF;
      IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Email cannot be changed here';
      END IF;
      IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Profile id cannot be changed';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges_trg ON profiles;
CREATE TRIGGER protect_profile_privileges_trg
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- Auto-create staff profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    'staff',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sequence RPC: SECURITY DEFINER only (no direct table writes for clients)
CREATE OR REPLACE FUNCTION public.get_next_voucher_number(voucher_year INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO voucher_sequence (year, last_number)
  VALUES (voucher_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_number = voucher_sequence.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN next_num;
END;
$$;

REVOKE ALL ON FUNCTION public.get_next_voucher_number(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_voucher_number(INTEGER) TO authenticated;

-- ============================================
-- VOUCHERS — clean policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view non-deleted vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can view all vouchers" ON vouchers;
DROP POLICY IF EXISTS "Staff can view own vouchers" ON vouchers;
DROP POLICY IF EXISTS "Authenticated users can create vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can insert vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can update own vouchers, admins can update all" ON vouchers;
DROP POLICY IF EXISTS "Users can update vouchers based on role" ON vouchers;
DROP POLICY IF EXISTS "Admin can update vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admins can delete vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admin can delete vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can delete vouchers based on role" ON vouchers;
DROP POLICY IF EXISTS "Creators can set receipt on own vouchers" ON vouchers;

CREATE POLICY "Staff view own vouchers, admin view all"
ON vouchers FOR SELECT
USING (
  deleted_at IS NULL
  AND (created_by = auth.uid() OR public.is_admin())
);

CREATE POLICY "Users insert own vouchers"
ON vouchers FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admin update vouchers"
ON vouchers FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete vouchers"
ON vouchers FOR DELETE
USING (public.is_admin());

-- ============================================
-- PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admin can delete users" ON profiles;
DROP POLICY IF EXISTS "Users can view authenticated profiles" ON profiles;
DROP POLICY IF EXISTS "Users update own name" ON profiles;

CREATE POLICY "Authenticated users view profiles"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users update own name only"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin update any profile"
ON profiles FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete profiles"
ON profiles FOR DELETE
USING (public.is_admin());

-- ============================================
-- EMPLOYEES / CATEGORIES / SETTINGS
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view employees" ON employees;
DROP POLICY IF EXISTS "Users can view employees" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
DROP POLICY IF EXISTS "Admin can insert employees" ON employees;
DROP POLICY IF EXISTS "Admin can update employees" ON employees;
DROP POLICY IF EXISTS "Admin can delete employees" ON employees;

CREATE POLICY "Authenticated view employees"
ON employees FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage employees"
ON employees FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view categories" ON expense_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON expense_categories;
DROP POLICY IF EXISTS "Admin can insert categories" ON expense_categories;
DROP POLICY IF EXISTS "Admin can update categories" ON expense_categories;
DROP POLICY IF EXISTS "Admin can delete categories" ON expense_categories;

CREATE POLICY "Authenticated view categories"
ON expense_categories FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage categories"
ON expense_categories FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view settings" ON company_settings;
DROP POLICY IF EXISTS "Users can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Admin can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update company settings" ON company_settings;
DROP POLICY IF EXISTS "Admin can update company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON company_settings;

-- Staff need brand/settings for voucher PDF/print; admin manages
CREATE POLICY "Authenticated view settings"
ON company_settings FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage settings"
ON company_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- VOUCHER SEQUENCE — lock down direct access
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view sequence" ON voucher_sequence;
DROP POLICY IF EXISTS "System can manage sequence" ON voucher_sequence;

-- No client policies: only SECURITY DEFINER function touches this table

-- ============================================
-- STORAGE — private bucket + owner-scoped paths
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vouchers',
  'vouchers',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Receipt upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "Receipt read own or admin" ON storage.objects;
DROP POLICY IF EXISTS "Receipt update own or admin" ON storage.objects;
DROP POLICY IF EXISTS "Receipt delete own or admin" ON storage.objects;

CREATE POLICY "Receipt upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vouchers'
  AND (storage.foldername(name))[1] = 'receipts'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Receipt read own or admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vouchers'
  AND (
    public.is_admin()
    OR (
      (storage.foldername(name))[1] = 'receipts'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

CREATE POLICY "Receipt update own or admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vouchers'
  AND (
    public.is_admin()
    OR (
      (storage.foldername(name))[1] = 'receipts'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

CREATE POLICY "Receipt delete own or admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vouchers'
  AND (
    public.is_admin()
    OR (
      (storage.foldername(name))[1] = 'receipts'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_active_expense_date
  ON vouchers (expense_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vouchers_active_created_by
  ON vouchers (created_by, created_at DESC)
  WHERE deleted_at IS NULL;


-- ===== LAUNCH RESET =====

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
