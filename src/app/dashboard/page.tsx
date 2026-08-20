import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { IndianRupee, FileText, Calendar, CreditCard, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // Fetch today's expenses
  const { data: todayExpenses } = await supabase
    .from('vouchers')
    .select('amount')
    .eq('expense_date', today)
    .is('deleted_at', null)

  const todayTotal = todayExpenses?.reduce((sum, v) => sum + Number(v.amount), 0) || 0

  // Fetch this month's expenses
  const { data: monthExpenses } = await supabase
    .from('vouchers')
    .select('amount, payment_mode')
    .gte('expense_date', firstDayOfMonth)
    .is('deleted_at', null)

  const monthTotal = monthExpenses?.reduce((sum, v) => sum + Number(v.amount), 0) || 0
  const voucherCount = monthExpenses?.length || 0
  
  const cashExpenses = monthExpenses
    ?.filter(v => v.payment_mode === 'Cash')
    .reduce((sum, v) => sum + Number(v.amount), 0) || 0
  
  const onlineExpenses = monthExpenses
    ?.filter(v => ['UPI', 'Bank Transfer', 'Card'].includes(v.payment_mode))
    .reduce((sum, v) => sum + Number(v.amount), 0) || 0

  // Fetch recent vouchers
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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PWM Expense Vouchers</h1>
          <p className="mt-1 text-gray-600">Manage your office expenses and vouchers</p>
        </div>
        <Link href="/dashboard/vouchers/new">
          <Button size="lg" className="gap-2">
            <PlusCircle className="h-5 w-5" />
            New Expense Voucher
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Expenses</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayTotal.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <IndianRupee className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{monthTotal.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vouchers This Month</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voucherCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{cashExpenses.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UPI/Online</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{onlineExpenses.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentVouchers || recentVouchers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vouchers yet</p>
              <p className="text-sm mt-2">Create your first expense voucher to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Paid To</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                      <TableCell>{format(new Date(voucher.expense_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{voucher.paid_to}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{voucher.category?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{voucher.description}</TableCell>
                      <TableCell className="font-semibold">₹{Number(voucher.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge variant={voucher.payment_mode === 'Cash' ? 'default' : 'secondary'}>
                          {voucher.payment_mode}
                        </Badge>
                      </TableCell>
                      <TableCell>{voucher.created_by_profile?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/vouchers/${voucher.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
