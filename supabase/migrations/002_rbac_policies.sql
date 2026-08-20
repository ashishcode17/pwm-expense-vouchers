-- ============================================
-- PWM Expense Vouchers - Role-Based Access Control (RBAC)
-- Migration 002: Enhanced RLS Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can insert vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can update vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can delete vouchers" ON vouchers;

-- ============================================
-- VOUCHERS TABLE - Role-Based Policies
-- ============================================

-- STAFF: Can only view their OWN vouchers
CREATE POLICY "Staff can view own vouchers"
ON vouchers FOR SELECT
USING (
  auth.uid() = created_by
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- STAFF: Can only insert vouchers (automatically becomes their voucher)
CREATE POLICY "Users can insert vouchers"
ON vouchers FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- STAFF: Can only update their OWN vouchers
-- ADMIN: Can update ANY voucher
CREATE POLICY "Users can update vouchers based on role"
ON vouchers FOR UPDATE
USING (
  auth.uid() = created_by
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- STAFF: Can only delete their OWN vouchers
-- ADMIN: Can delete ANY voucher
CREATE POLICY "Users can delete vouchers based on role"
ON vouchers FOR DELETE
USING (
  auth.uid() = created_by
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- PROFILES TABLE - Enhanced Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Everyone can view all profiles (needed for "created_by" lookups)
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ADMIN: Can update any profile (for user management)
CREATE POLICY "Admin can update any profile"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ADMIN: Can delete users (soft delete recommended)
CREATE POLICY "Admin can delete users"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- SETTINGS, EMPLOYEES, CATEGORIES
-- ADMIN-only access
-- ============================================

-- Drop existing policies for these tables
DROP POLICY IF EXISTS "Users can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can view employees" ON employees;
DROP POLICY IF EXISTS "Users can insert employees" ON employees;
DROP POLICY IF EXISTS "Users can update employees" ON employees;
DROP POLICY IF EXISTS "Users can view categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can insert categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can update categories" ON expense_categories;

-- COMPANY SETTINGS: Admin-only
CREATE POLICY "Admin can view company settings"
ON company_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can update company settings"
ON company_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- EMPLOYEES: Everyone can view (for dropdowns), only admin can modify
CREATE POLICY "Users can view employees"
ON employees FOR SELECT
USING (true);

CREATE POLICY "Admin can insert employees"
ON employees FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can update employees"
ON employees FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can delete employees"
ON employees FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- EXPENSE CATEGORIES: Everyone can view (for dropdowns), only admin can modify
CREATE POLICY "Users can view categories"
ON expense_categories FOR SELECT
USING (true);

CREATE POLICY "Admin can insert categories"
ON expense_categories FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can update categories"
ON expense_categories FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can delete categories"
ON expense_categories FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
