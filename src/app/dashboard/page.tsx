import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { IndianRupee, FileText, Calendar, CreditCard, PlusCircle } from 'lucide-react'
import { RecentVouchersTable } from '@/components/dashboard/recent-vouchers-table'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { data: todayExpenses } = await supabase
    .from('vouchers')
    .select('amount')
    .eq('expense_date', today)
    .is('deleted_at', null)

  const todayTotal = todayExpenses?.reduce((sum, v) => sum + Number(v.amount), 0) || 0

  const { data: monthExpenses } = await supabase
    .from('vouchers')
    .select('amount, payment_mode')
    .gte('expense_date', firstDayOfMonth)
    .is('deleted_at', null)

  const monthTotal = monthExpenses?.reduce((sum, v) => sum + Number(v.amount), 0) || 0
  const voucherCount = monthExpenses?.length || 0

  const cashExpenses =
    monthExpenses
      ?.filter((v) => v.payment_mode === 'Cash')
      .reduce((sum, v) => sum + Number(v.amount), 0) || 0

  const onlineExpenses =
    monthExpenses
      ?.filter((v) => ['UPI', 'Bank Transfer', 'Card'].includes(v.payment_mode))
      .reduce((sum, v) => sum + Number(v.amount), 0) || 0

  const { data: recentVouchers } = await supabase
    .from('vouchers')
    .select(`
      *,
      category:expense_categories(name),
      paid_by_employee:employees!vouchers_paid_by_fkey(name),
      created_by_profile:profiles(name)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-4 pb-8 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {isAdmin ? 'PWM Expense Vouchers' : 'My Vouchers'}
          </h1>
          <p className="mt-1 text-sm text-gray-600 md:text-base">
            {isAdmin
              ? 'Manage your office expenses and vouchers'
              : 'View and manage your expense vouchers'}
          </p>
        </div>
        <Link href="/dashboard/vouchers/new" className="hidden sm:block">
          <Button size="lg" className="w-full gap-2 sm:w-auto">
            <PlusCircle className="h-5 w-5" />
            New Expense Voucher
          </Button>
        </Link>
      </div>

      {isAdmin && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-2 md:gap-6 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium md:text-sm">Today&apos;s Expenses</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">
                ₹{todayTotal.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium md:text-sm">This Month</CardTitle>
              <IndianRupee className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">
                ₹{monthTotal.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium md:text-sm">Vouchers This Month</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">{voucherCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium md:text-sm">Cash Expenses</CardTitle>
              <IndianRupee className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">
                ₹{cashExpenses.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium md:text-sm">UPI/Online</CardTitle>
              <CreditCard className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">
                ₹{onlineExpenses.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="px-4 py-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">
            {isAdmin ? 'Recent Vouchers' : 'My Recent Vouchers'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          {!recentVouchers || recentVouchers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No vouchers yet</p>
              <p className="mt-2 text-sm">Create your first expense voucher to get started</p>
              <Link href="/dashboard/vouchers/new" className="mt-4 inline-block sm:hidden">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  New Expense Voucher
                </Button>
              </Link>
            </div>
          ) : (
            <RecentVouchersTable vouchers={recentVouchers} isAdmin={isAdmin} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
