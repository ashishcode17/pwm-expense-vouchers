import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VoucherView } from '@/components/voucher/voucher-view'

export const dynamic = 'force-dynamic'

export default async function VoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: voucher } = await supabase
    .from('vouchers')
    .select(`
      *,
      category:expense_categories(name),
      paid_by_employee:employees!vouchers_paid_by_fkey(name, designation),
      approved_by_employee:employees!vouchers_approved_by_fkey(name, designation),
      created_by_profile:profiles(name)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!voucher) {
    notFound()
  }

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .single()

  const canEdit = profile?.role === 'admin' || voucher.created_by === user.id

  return <VoucherView voucher={voucher} settings={settings} canEdit={canEdit} isAdmin={profile?.role === 'admin'} />
}
// Force rebuild
