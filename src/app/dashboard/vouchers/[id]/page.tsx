import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VoucherView } from '@/components/voucher/voucher-view'
import type { CompanySettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function VoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Parallel fetch — was sequential and slow on mobile networks
  const [profileResult, voucherResult, settingsResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('vouchers')
      .select(
        `
        id,
        voucher_number,
        voucher_sequence,
        expense_date,
        paid_to,
        description,
        amount,
        amount_in_words,
        payment_mode,
        transaction_reference,
        requested_by,
        remarks,
        receipt_url,
        created_at,
        created_by,
        category:expense_categories(name),
        paid_by_employee:employees!vouchers_paid_by_fkey(name, designation),
        approved_by_employee:employees!vouchers_approved_by_fkey(name, designation),
        created_by_profile:profiles(name)
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('company_settings')
      .select('brand_name, company_name, office_address, phone, email, logo_url')
      .limit(1)
      .maybeSingle(),
  ])

  const voucher = voucherResult.data
  if (!voucher) {
    notFound()
  }

  const isAdmin = profileResult.data?.role === 'admin'

  return (
    <VoucherView
      voucher={voucher as never}
      settings={(settingsResult.data as CompanySettings | null) ?? null}
      isAdmin={isAdmin}
    />
  )
}
