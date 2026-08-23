import type { SupabaseClient } from '@supabase/supabase-js'
import { toUserError } from '@/lib/user-error'

export async function softDeleteVoucher(
  supabase: SupabaseClient,
  voucherId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: rpcError } = await supabase.rpc('soft_delete_voucher', {
    p_voucher_id: voucherId,
  })

  if (!rpcError) {
    return { ok: true }
  }

  // Fallback if migration not applied yet
  const rpcMsg = rpcError.message?.toLowerCase() ?? ''
  if (
    rpcMsg.includes('soft_delete_voucher') &&
    (rpcMsg.includes('does not exist') || rpcMsg.includes('could not find'))
  ) {
    const { error: updateError, count } = await supabase
      .from('vouchers')
      .update({ deleted_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', voucherId)
      .is('deleted_at', null)

    if (updateError) {
      return { ok: false, message: toUserError(updateError, 'Failed to delete voucher') }
    }
    if (!count) {
      return {
        ok: false,
        message: 'Could not delete voucher. Run supabase/FIX_VOUCHER_DELETE.sql in Supabase SQL Editor.',
      }
    }
    return { ok: true }
  }

  return { ok: false, message: toUserError(rpcError, 'Failed to delete voucher') }
}
