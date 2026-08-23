-- ============================================
-- Fix: Admin soft-delete voucher fails (RLS)
-- Run in Supabase → SQL Editor → Run
-- ============================================

-- Admin must be able to SELECT rows after soft-delete (PostgREST / RETURNING)
DROP POLICY IF EXISTS "Staff view own vouchers, admin view all" ON vouchers;

CREATE POLICY "Staff view own active vouchers, admin view all"
ON vouchers FOR SELECT
USING (
  public.is_admin()
  OR (deleted_at IS NULL AND created_by = auth.uid())
);

-- Reliable admin soft-delete via RPC (bypasses client RLS edge cases)
CREATE OR REPLACE FUNCTION public.soft_delete_voucher(p_voucher_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete vouchers';
  END IF;

  UPDATE public.vouchers
  SET deleted_at = NOW()
  WHERE id = p_voucher_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found or already deleted';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_voucher(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_voucher(UUID) TO authenticated;

-- Verify
SELECT proname FROM pg_proc WHERE proname = 'soft_delete_voucher';
