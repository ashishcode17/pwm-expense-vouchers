import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VoucherView } from '@/components/voucher/voucher-view'

export const dynamic = 'force-dynamic'

export default async function VoucherPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: voucher } = await supabase
    .from('vouchers')
    .select(`
      *,
      category:expense_categories(name),
      paid_by_employee:employees!vouchers_paid_by_fkey(name, designation),
      approved_by_employee:employees!vouchers_approved_by_fkey(name, designation),
      created_by_profile:profiles(name)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!voucher) {
    notFound()
  }

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .single()

  return <VoucherView voucher={voucher} settings={settings} />
}
