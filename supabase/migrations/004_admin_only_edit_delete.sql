-- ============================================
-- PWM Expense Vouchers - Admin-only edit/delete
-- Migration 004: Only admins can update or delete vouchers
-- ============================================

-- Drop existing voucher update/delete policies (from 001 and 002)
DROP POLICY IF EXISTS "Users can update own vouchers, admins can update all" ON vouchers;
DROP POLICY IF EXISTS "Users can update vouchers based on role" ON vouchers;
DROP POLICY IF EXISTS "Admins can delete vouchers" ON vouchers;
DROP POLICY IF EXISTS "Users can delete vouchers based on role" ON vouchers;

-- ADMIN ONLY: Can update any voucher (includes soft delete via deleted_at)
CREATE POLICY "Admin can update vouchers"
ON vouchers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ADMIN ONLY: Can hard-delete vouchers (if ever used)
CREATE POLICY "Admin can delete vouchers"
ON vouchers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
